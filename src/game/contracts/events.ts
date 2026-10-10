import { z } from "zod";
import {
  chanceSchema,
  countSchema,
  damageTypeSchema,
  idSchema,
  phaseSchema,
  resourceSchema,
} from "./skills.ts";

const uniqueTargets = z
  .array(idSchema)
  .min(1)
  .refine((ids) => new Set(ids).size === ids.length, "Targets must be unique");

export const actionCommandSchema = z.strictObject({
  schema_version: z.literal(1),
  command_id: idSchema,
  combat_id: idSchema,
  expected_revision: countSchema,
  actor_id: idSchema,
  skill_id: idSchema,
  target_ids: uniqueTargets,
});

const resourceChange = z.strictObject({
  resource: resourceSchema,
  before: countSchema,
  after: countSchema,
  delta: z.number().int().min(-Number.MAX_SAFE_INTEGER).max(Number.MAX_SAFE_INTEGER),
  reason: z.enum(["cost", "damage", "heal", "effect"]),
});
const hitResult = z
  .strictObject({
    outcome: z.enum(["hit", "miss"]),
    hit_chance: chanceSchema,
    hit_roll: chanceSchema.max(0.9999999999999999).optional(),
    critical: z.boolean(),
    crit_chance: chanceSchema,
    crit_roll: chanceSchema.max(0.9999999999999999).optional(),
  })
  .superRefine((hit, context) => {
    const issue = (message: string) => context.addIssue({ code: "custom", message });
    if (
      hit.hit_roll === undefined
        ? hit.hit_chance !== 1 || hit.outcome !== "hit"
        : hit.hit_roll < hit.hit_chance !== (hit.outcome === "hit")
    ) {
      issue("Hit outcome must match roll; absent roll means guaranteed hit");
    }
    if (hit.outcome === "miss" && (hit.critical || hit.crit_roll !== undefined))
      issue("Miss cannot roll or apply critical");
    if (
      hit.crit_roll === undefined
        ? hit.critical || hit.crit_chance !== 0
        : hit.crit_roll < hit.crit_chance !== hit.critical
    ) {
      issue("Critical outcome must match roll; absent roll means critical disabled");
    }
  });
const statusState = {
  status_id: idSchema,
  instance_id: idSchema,
};
const payloadSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("action_started"), skill_id: idSchema }),
  z.strictObject({ type: z.literal("resource_changed"), ...resourceChange.shape }),
  hitResult.safeExtend({ type: z.literal("hit_resolved") }),
  z.strictObject({
    type: z.literal("damage_applied"),
    amount: countSchema.min(1),
    damage_type: damageTypeSchema,
    critical: z.boolean(),
  }),
  z.strictObject({ type: z.literal("healing_applied"), amount: countSchema.min(1) }),
  z.strictObject({
    type: z.literal("status_applied"),
    ...statusState,
    duration: countSchema.min(1),
    stacks: countSchema.min(1),
    source_id: idSchema,
  }),
  z.strictObject({
    type: z.literal("status_removed"),
    ...statusState,
    reason: z.enum(["cleanse", "expired", "defeat"]),
  }),
  z.strictObject({ type: z.literal("combatant_defeated") }),
  z.strictObject({
    type: z.literal("cooldown_changed"),
    skill_id: idSchema,
    before: countSchema,
    after: countSchema,
  }),
  z.strictObject({ type: z.literal("action_completed"), revision: countSchema }),
]);

export const combatEventSchema = z
  .strictObject({
    schema_version: z.literal(1),
    event_id: idSchema,
    combat_id: idSchema,
    action_id: idSchema,
    sequence: countSchema.min(1),
    turn: countSchema.min(1),
    phase: phaseSchema,
    source_id: idSchema,
    target_id: idSchema.optional(),
    step_id: idSchema.optional(),
    payload: payloadSchema,
  })
  .superRefine((event, context) => {
    const type = event.payload.type;
    const issue = (path: string, message: string) =>
      context.addIssue({ code: "custom", path: [path], message });
    const actionLevel = type === "action_started" || type === "action_completed";
    if (!actionLevel && event.target_id === undefined)
      issue("target_id", "Required for combatant facts");
    if (actionLevel && (event.target_id !== undefined || event.step_id !== undefined))
      issue("target_id", "Action boundaries have no target or step");
    const expectedPhase =
      type === "action_started"
        ? "commit"
        : type === "action_completed"
          ? "complete"
          : type === "combatant_defeated"
            ? "aftermath"
            : type === "cooldown_changed" ||
                (type === "resource_changed" && event.payload.reason === "cost")
              ? "commit"
              : "impact";
    if (event.phase !== expectedPhase) issue("phase", `Expected ${expectedPhase}`);
    if (type === "resource_changed") {
      if (event.payload.after - event.payload.before !== event.payload.delta)
        issue("payload", "Delta must equal after - before");
      if (
        (event.payload.reason === "cost" || event.payload.reason === "damage") &&
        event.payload.delta > 0
      )
        issue("payload", "Cost/damage cannot increase resources");
      if (
        (event.payload.reason === "heal" || event.payload.reason === "effect") &&
        event.payload.delta < 0
      )
        issue("payload", "Heal/grant cannot decrease resources");
      if (
        (event.payload.reason === "heal" || event.payload.reason === "damage") &&
        event.payload.resource !== "hp"
      )
        issue("payload", "Damage/heal must change HP");
      if (event.payload.reason === "effect" && event.payload.resource === "hp")
        issue("payload", "Resource grants only support stamina/focus");
      if (
        event.payload.reason === "cost" &&
        (event.payload.resource === "hp" || event.target_id !== event.source_id)
      )
        issue("payload", "Costs must charge source stamina/focus");
    }
    if (type === "status_removed" && event.payload.reason === "expired")
      issue("payload", "Expiry requires a lifecycle transaction, not a skill event");
    if (type === "status_applied" && event.payload.source_id !== event.source_id)
      issue("payload", "Application source must match action source");
    if (type === "cooldown_changed" && event.target_id !== event.source_id)
      issue("target_id", "Cooldown changes belong to action source");
  });

const resolvedBase = {
  schema_version: z.literal(1),
  action_id: idSchema,
  command: actionCommandSchema,
  revision_before: countSchema,
  revision_after: countSchema,
  rng_cursor_before: countSchema,
  rng_cursor_after: countSchema,
};

export const resolvedActionSchema = z
  .discriminatedUnion("status", [
    z.strictObject({
      ...resolvedBase,
      status: z.literal("resolved"),
      target_ids: uniqueTargets,
      events: z.array(combatEventSchema).min(2),
    }),
    z.strictObject({
      ...resolvedBase,
      status: z.literal("rejected"),
      reason: z.enum([
        "stale_revision",
        "unknown_actor",
        "unknown_skill",
        "wrong_window",
        "requirements",
        "invalid_targets",
        "insufficient_resource",
        "cooldown",
        "combat_finished",
      ]),
      events: z.array(combatEventSchema).max(0),
    }),
  ])
  .superRefine((action, context) => {
    const issue = (path: (string | number)[], message: string) =>
      context.addIssue({ code: "custom", path, message });
    if (action.status === "rejected") {
      if (
        action.revision_after !== action.revision_before ||
        action.rng_cursor_after !== action.rng_cursor_before
      ) {
        issue([], "Rejected actions must not change state or RNG");
      }
      return;
    }
    if (action.command.expected_revision !== action.revision_before)
      issue(["revision_before"], "Accepted command must match revision");
    if (action.revision_after !== action.revision_before + 1)
      issue(["revision_after"], "Resolved action commits exactly one revision");
    if (action.rng_cursor_after < action.rng_cursor_before)
      issue(["rng_cursor_after"], "RNG cursor cannot go backwards");
    if (action.target_ids.join(",") !== [...action.target_ids].sort().join(","))
      issue(["target_ids"], "Targets must be sorted by combatant ID");
    if (action.target_ids.join(",") !== [...action.command.target_ids].sort().join(","))
      issue(["target_ids"], "Resolved target set must match command intent");
    const events = action.events;
    if (
      events[0].payload.type !== "action_started" ||
      events.at(-1)?.payload.type !== "action_completed"
    )
      issue(["events"], "Action boundaries must enclose events");
    const ids = new Set<string>();
    let phaseIndex = 0;
    const phases = ["commit", "impact", "aftermath", "complete"];
    events.forEach((event, index) => {
      const path = ["events", index];
      if (ids.has(event.event_id)) issue([...path, "event_id"], "Duplicate event ID");
      ids.add(event.event_id);
      if (
        event.combat_id !== action.command.combat_id ||
        event.action_id !== action.action_id ||
        event.source_id !== action.command.actor_id
      )
        issue(path, "Event identity must match action");
      if (event.turn !== events[0].turn) issue([...path, "turn"], "One action belongs to one turn");
      if (index > 0 && event.sequence !== events[index - 1].sequence + 1)
        issue([...path, "sequence"], "Event sequence must be contiguous");
      const nextPhase = phases.indexOf(event.phase);
      if (nextPhase < phaseIndex) issue([...path, "phase"], "Phases cannot go backwards");
      phaseIndex = nextPhase;
      if (
        event.target_id &&
        event.target_id !== action.command.actor_id &&
        !action.target_ids.includes(event.target_id)
      )
        issue([...path, "target_id"], "Target outside resolved action");
      if (
        event.payload.type === "action_started" &&
        (index !== 0 || event.payload.skill_id !== action.command.skill_id)
      )
        issue(path, "Invalid action_started");
      if (
        event.payload.type === "cooldown_changed" &&
        event.payload.skill_id !== action.command.skill_id
      )
        issue(path, "Cooldown skill must match action");
      if (
        event.payload.type === "action_completed" &&
        (index !== events.length - 1 || event.payload.revision !== action.revision_after)
      )
        issue(path, "Invalid action_completed");
    });
  });

export type ActionCommand = z.infer<typeof actionCommandSchema>;
export type CombatEvent = z.infer<typeof combatEventSchema>;
export type ResolvedAction = z.infer<typeof resolvedActionSchema>;
