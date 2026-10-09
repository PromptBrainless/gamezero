import { z } from "zod";

const chance = z.number().min(0).max(1);
const count = z.number().int().nonnegative();
const text = z.string().trim().min(1);
const id = z.string().regex(/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/);
const ids = z.array(id);
const statKeys = ["hp", "focus", "stamina", "attack", "defense", "magic", "speed", "crit_chance"] as const;
const statModifiers = z.partialRecord(z.enum(statKeys), z.number());
const stats = z.strictObject({ hp: count.positive(), attack: count, defense: count, magic: count, speed: count, crit_chance: chance, stamina: count.optional(), focus: count.optional() });
const visual = z.strictObject({ silhouette: text, accent_color: z.string().regex(/^#[0-9a-f]{6}$/i), art_quality: text.optional() });
const application = z.strictObject({ status: id, duration: count.positive(), chance: chance.optional(), target: z.enum(["self", "enemy"]).optional() });
const applications = z.array(application);
const loot = z.array(z.strictObject({ item: id, chance }));
const effectKeys = ["damage_per_turn_per_stack", "damage_type", "ignores_defense", "skip_turn", "damage_taken_multiplier", "crit_chance_bonus", "crit_chance_taken_bonus", "stamina_regen_multiplier"];
const effect = z.record(z.string(), z.union([z.number(), z.string(), z.boolean()])).superRefine((record, context) => {
  for (const key of Object.keys(record)) if (!effectKeys.includes(key) && !/^[a-z_]+_modifier$/.test(key)) context.addIssue({ code: "custom", path: [key], message: "Unbekannter Statuseffekt" });
});
const schemas = {
  careers: z.strictObject({ id, name: text, role: text, description: text, base_stats: stats, stat_growth: statModifiers, starting_skills: ids.min(1), skill_pool: ids.min(1), starting_items: ids, reaction: z.enum(["brace", "parry", "ward"]), visual: visual.optional() }),
  skills: z.strictObject({ id, name: text, type: z.enum(["attack", "defense", "control", "reaction"]), cost: z.strictObject({ focus: count.optional(), stamina: count.optional() }), cooldown: count, target: z.enum(["enemy", "self"]), description: text, career: id.optional(), damage: z.strictObject({ damage_type: text, scaling_stat: z.enum(["attack", "magic"]), multiplier: z.number().nonnegative(), flat: z.number().int(), formula: text.optional() }).optional(), applies_statuses: applications.optional(), tags: z.array(text).optional(), trigger: z.literal("after_melee_hit").optional(), removes_statuses: ids.optional() }),
  statuses: z.strictObject({ id, name: text, kind: z.enum(["buff", "debuff"]), default_duration: count.positive(), max_stacks: count.positive(), effect, description: text, tick: z.enum(["turn_start", "turn_end"]).optional(), icon_shape: text.optional() }),
  items: z.strictObject({ id, name: text, slot: z.enum(["weapon", "offhand", "armor", "trinket", "consumable"]), rarity: z.enum(["common", "uncommon", "rare"]), stat_modifiers: statModifiers, description: text, value: count.optional(), career_tags: ids.optional(), effects: z.array(z.record(z.string(), z.number())).optional(), use: z.strictObject({ heal_hp: count.optional(), restore_focus: count.optional(), next_attack_bonus: count.optional(), removes_statuses: ids.optional(), applies_statuses: applications.optional(), stackable: z.boolean().optional(), max_stack: count.positive().optional() }).optional() }),
  enemies: z.strictObject({ id, name: text, role: text, tier: count.positive(), base_stats: stats, skills: ids.min(1), description: text, weaknesses: z.array(text).optional(), resistances: z.array(text).optional(), ai: z.strictObject({ pattern: text, weights: z.record(z.string(), z.number().positive()) }).optional(), loot_table: loot.optional(), xp_reward: count.optional(), visual: visual.optional() }),
  bosses: z.strictObject({ id, name: text, title: text, tier: count.positive(), base_stats: stats, description: text, visual: visual.optional(), phases: z.array(z.strictObject({ id, name: text, hp_threshold: chance.positive(), skills: ids.min(1), telegraphs: z.array(z.strictObject({ skill: id, warning_turns: count.positive(), icon: text })).optional(), on_enter: z.array(z.strictObject({ apply_status: id.optional(), duration: count.positive().optional(), target: z.enum(["self", "enemy"]).optional(), stat_modifier: statModifiers.optional() })).optional() })).min(1), loot_table: loot.optional(), xp_reward: count.optional() }),
  encounters: z.strictObject({ id, name: text, type: z.enum(["tutorial", "standard", "boss"]), order: count.positive(), enemies: ids.min(1), difficulty: z.number().int().min(1).max(5), arena: text, rewards: z.strictObject({ xp: count, items: ids.optional() }), description: text }),
};

export type Collection = keyof typeof schemas;
type Records = { [Key in Collection]: Record<string, z.infer<(typeof schemas)[Key]>> };
export interface ContentIssue { path: string; field: string; message: string }

export function loadContent(files: Partial<Record<Collection, Record<string, string>>>) {
  const data = Object.fromEntries(Object.keys(schemas).map((key) => [key, {}])) as Records;
  const issues: ContentIssue[] = [];
  for (const type of Object.keys(schemas) as Collection[]) {
    const sources = files[type] ?? {};
    if (Object.keys(sources).length === 0) issues.push({ path: `data/${type}`, field: "collection", message: "Sammlung fehlt oder ist leer" });
    for (const [path, source] of Object.entries(sources)) {
      let record: unknown;
      try { record = JSON.parse(source); } catch { issues.push({ path, field: "json", message: "Ungueltiges JSON" }); continue; }
      const result = schemas[type].safeParse(record);
      if (!result.success) {
        for (const error of result.error.issues) issues.push({ path, field: error.path.join(".") || "record", message: error.message });
        continue;
      }
      const entry = result.data;
      const filename = path.split("/").at(-1)?.replace(/\.json$/, "");
      if (entry.id !== filename) issues.push({ path, field: "id", message: "ID stimmt nicht mit Dateiname ueberein" });
      if (data[type][entry.id]) issues.push({ path, field: "id", message: "Doppelte ID" });
      Object.assign(data[type], { [entry.id]: entry });
    }
  }
  const report = (type: Collection, recordId: string, field: string, message: string) => issues.push({ path: `data/${type}/${recordId}.json`, field, message });
  const reference = (type: Collection, recordId: string, field: string, collection: Collection, targetId: string) => {
    if (!data[collection][targetId]) report(type, recordId, field, `Fehlende Referenz: ${collection}/${targetId}`);
  };
  for (const career of Object.values(data.careers)) {
    for (const skillId of [...career.starting_skills, ...career.skill_pool]) {
      reference("careers", career.id, "skills", "skills", skillId);
      if (data.skills[skillId] && data.skills[skillId].career !== career.id) report("careers", career.id, "skills", `Falsche Karriere fuer ${skillId}`);
    }
    for (const itemId of career.starting_items) {
      reference("careers", career.id, "starting_items", "items", itemId);
      if (data.items[itemId]?.career_tags && !data.items[itemId].career_tags.includes(career.id)) report("careers", career.id, "starting_items", `Gegenstand ${itemId} ist fuer Karriere gesperrt`);
    }
    if (!career.starting_skills.every((skillId) => career.skill_pool.includes(skillId))) report("careers", career.id, "skill_pool", "Startfaehigkeit fehlt im Pool");
  }
  for (const skill of Object.values(data.skills)) {
    if (skill.career) reference("skills", skill.id, "career", "careers", skill.career);
    if (!skill.damage && !skill.applies_statuses?.length) report("skills", skill.id, "effect", "Faehigkeit ohne Wirkung");
    for (const statusId of skill.removes_statuses ?? []) reference("skills", skill.id, "removes_statuses", "statuses", statusId);
    for (const entry of skill.applies_statuses ?? []) reference("skills", skill.id, "applies_statuses", "statuses", entry.status);
  }
  for (const item of Object.values(data.items)) {
    if (item.use && item.slot !== "consumable") report("items", item.id, "use", "Nur fuer Verbrauchsgegenstaende erlaubt");
    for (const careerId of item.career_tags ?? []) reference("items", item.id, "career_tags", "careers", careerId);
    for (const statusId of item.use?.removes_statuses ?? []) reference("items", item.id, "use.removes_statuses", "statuses", statusId);
    for (const entry of item.use?.applies_statuses ?? []) reference("items", item.id, "use.applies_statuses", "statuses", entry.status);
  }
  for (const enemy of Object.values(data.enemies)) {
    for (const skillId of enemy.skills) reference("enemies", enemy.id, "skills", "skills", skillId);
    for (const skillId of Object.keys(enemy.ai?.weights ?? {})) if (!enemy.skills.includes(skillId)) report("enemies", enemy.id, "ai.weights", `Faehigkeit ${skillId} fehlt im Pool`);
  }
  for (const boss of Object.values(data.bosses)) {
    if (boss.phases[0].hp_threshold !== 1) report("bosses", boss.id, "phases", "Erste Phase muss bei 1 beginnen");
    boss.phases.forEach((phase, index) => {
      if (index > 0 && phase.hp_threshold >= boss.phases[index - 1].hp_threshold) report("bosses", boss.id, "phases", "Phasengrenzen muessen absteigen");
      for (const skillId of phase.skills) reference("bosses", boss.id, "phases.skills", "skills", skillId);
      for (const telegraph of phase.telegraphs ?? []) reference("bosses", boss.id, "phases.telegraphs", "skills", telegraph.skill);
      for (const action of phase.on_enter ?? []) if (action.apply_status) reference("bosses", boss.id, "phases.on_enter", "statuses", action.apply_status);
    });
  }
  for (const type of ["enemies", "bosses"] as const) for (const actor of Object.values(data[type])) for (const entry of actor.loot_table ?? []) reference(type, actor.id, "loot_table", "items", entry.item);
  const orders = new Set<number>();
  for (const encounter of Object.values(data.encounters)) {
    if (orders.has(encounter.order)) report("encounters", encounter.id, "order", "Doppelte Reihenfolge");
    orders.add(encounter.order);
    for (const enemyId of encounter.enemies) reference("encounters", encounter.id, "enemies", encounter.type === "boss" ? "bosses" : "enemies", enemyId);
    for (const itemId of encounter.rewards.items ?? []) reference("encounters", encounter.id, "rewards.items", "items", itemId);
  }
  return { data, issues: issues.sort((left, right) => `${left.path}.${left.field}`.localeCompare(`${right.path}.${right.field}`)), ready: issues.length === 0 };
}