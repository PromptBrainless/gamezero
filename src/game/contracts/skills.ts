import { z } from "zod";

export const idSchema = z.string().regex(/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/);
export const countSchema = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
export const chanceSchema = z.number().min(0).max(1);
export const resourceSchema = z.enum(["hp", "stamina", "focus"]);
export const damageTypeSchema = z.enum(["physical", "arcane", "frost", "bleed"]);
export const phaseSchema = z.enum(["validate", "commit", "impact", "aftermath", "complete"]);
const uniqueIds = z
  .array(idSchema)
  .refine((ids) => new Set(ids).size === ids.length, "IDs must be unique");

export const targetingRuleSchema = z
  .strictObject({
    schema_version: z.literal(1),
    id: idSchema,
    side: z.enum(["self", "ally", "enemy"]),
    selection: z.enum(["chosen", "all"]),
    min_targets: countSchema.min(1),
    max_targets: countSchema.min(1),
    life_state: z.literal("alive"),
    order: z.literal("combatant_id"),
  })
  .superRefine((rule, context) => {
    if (rule.max_targets < rule.min_targets) {
      context.addIssue({
        code: "custom",
        path: ["max_targets"],
        message: "Must be >= min_targets",
      });
    }
    if (
      rule.side === "self" &&
      (rule.min_targets !== 1 || rule.max_targets !== 1 || rule.selection !== "chosen")
    ) {
      context.addIssue({
        code: "custom",
        path: ["side"],
        message: "Self requires one chosen target",
      });
    }
  });

const amountSchema = z.strictObject({
  flat: countSchema,
  scaling_stat: z.enum(["attack", "magic"]),
  multiplier: z.number().finite().min(0),
});
const stepBase = {
  id: idSchema,
  recipient: z.enum(["source", "targets"]),
  gate: z.enum(["always", "on_hit"]),
};

export const effectStepSchema = z.discriminatedUnion("op", [
  z.strictObject({
    ...stepBase,
    op: z.literal("damage"),
    amount: amountSchema,
    damage_type: damageTypeSchema,
    ignores_defense: z.boolean(),
    can_crit: z.boolean(),
  }),
  z.strictObject({ ...stepBase, op: z.literal("heal"), amount: amountSchema }),
  z.strictObject({
    ...stepBase,
    op: z.literal("apply_status"),
    status_id: idSchema,
    duration: countSchema.min(1),
    stacks: countSchema.min(1),
    chance: chanceSchema,
  }),
  z.strictObject({
    ...stepBase,
    op: z.literal("remove_status"),
    status_ids: uniqueIds.min(1),
  }),
  z.strictObject({
    ...stepBase,
    op: z.literal("grant_resource"),
    resource: z.enum(["stamina", "focus"]),
    amount: countSchema.min(1),
  }),
]);

export const effectSequenceSchema = z
  .strictObject({
    schema_version: z.literal(1),
    id: idSchema,
    steps: z.array(effectStepSchema).min(1).max(32),
  })
  .superRefine((sequence, context) => {
    const ids = sequence.steps.map((step) => step.id);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: "custom",
        path: ["steps"],
        message: "Step IDs must be unique within a sequence",
      });
    }
  });

const requirementSchema = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("has_tag"), tag: idSchema }),
  z.strictObject({ kind: z.literal("has_status"), status_id: idSchema }),
  z.strictObject({ kind: z.literal("lacks_status"), status_id: idSchema }),
]);
const hitRuleSchema = z.discriminatedUnion("mode", [
  z.strictObject({ mode: z.literal("always"), crit_multiplier: z.number().finite().min(1) }),
  z.strictObject({
    mode: z.literal("accuracy"),
    accuracy: chanceSchema,
    crit_multiplier: z.number().finite().min(1),
  }),
]);

export const skillDefSchema = z
  .strictObject({
    schema_version: z.literal(1),
    id: idSchema,
    name: z.string().min(1),
    description: z.string().min(1),
    type: z.enum(["attack", "defense", "control", "reaction"]),
    career: idSchema.optional(),
    costs: z
      .array(
        z.strictObject({
          resource: z.enum(["stamina", "focus"]),
          amount: countSchema.min(1),
        }),
      )
      .max(2),
    cooldown: countSchema,
    targeting_rule_id: idSchema,
    effect_sequence_id: idSchema,
    timing: z.strictObject({
      window: z.enum(["own_turn", "after_melee_hit"]),
      effect_phase: z.literal("impact"),
    }),
    hit_rule: hitRuleSchema,
    requirements: z.array(requirementSchema),
    tags: uniqueIds,
  })
  .superRefine((skill, context) => {
    if (new Set(skill.costs.map((cost) => cost.resource)).size !== skill.costs.length) {
      context.addIssue({
        code: "custom",
        path: ["costs"],
        message: "Each resource may be charged once",
      });
    }
    if ((skill.type === "reaction") !== (skill.timing.window === "after_melee_hit")) {
      context.addIssue({
        code: "custom",
        path: ["timing"],
        message: "Reaction type and trigger window must agree",
      });
    }
  });

export type SkillDef = z.infer<typeof skillDefSchema>;
export type EffectStep = z.infer<typeof effectStepSchema>;
export type EffectSequence = z.infer<typeof effectSequenceSchema>;
export type TargetingRule = z.infer<typeof targetingRuleSchema>;

export const skillCatalogSchema = z.strictObject({
  skills: z.array(skillDefSchema).min(1),
  effect_sequences: z.array(effectSequenceSchema).min(1),
  targeting_rules: z.array(targetingRuleSchema).min(1),
});

// External collections stay owned by the existing slice data contract.
export function validateSkillCatalog(
  input: unknown,
  references: { statuses: ReadonlySet<string>; careers: ReadonlySet<string> },
) {
  return skillCatalogSchema
    .superRefine((catalog, context) => {
      for (const collection of ["skills", "effect_sequences", "targeting_rules"] as const) {
        const seen = new Set<string>();
        catalog[collection].forEach((record, index) => {
          if (seen.has(record.id)) {
            context.addIssue({
              code: "custom",
              path: [collection, index, "id"],
              message: "Duplicate collection ID",
            });
          }
          seen.add(record.id);
        });
      }
      const sequences = new Map(catalog.effect_sequences.map((record) => [record.id, record]));
      const targets = new Set(catalog.targeting_rules.map((record) => record.id));
      const check = (valid: boolean, path: (string | number)[], message: string) => {
        if (!valid) context.addIssue({ code: "custom", path, message });
      };
      catalog.skills.forEach((skill, index) => {
        const path = ["skills", index];
        check(
          targets.has(skill.targeting_rule_id),
          [...path, "targeting_rule_id"],
          "Unknown targeting rule",
        );
        check(
          sequences.has(skill.effect_sequence_id),
          [...path, "effect_sequence_id"],
          "Unknown effect sequence",
        );
        if (skill.career)
          check(references.careers.has(skill.career), [...path, "career"], "Unknown career");
        skill.requirements.forEach((requirement, requirementIndex) => {
          if ("status_id" in requirement) {
            check(
              references.statuses.has(requirement.status_id),
              [...path, "requirements", requirementIndex, "status_id"],
              "Unknown status",
            );
          }
        });
      });
      catalog.effect_sequences.forEach((sequence, index) => {
        sequence.steps.forEach((step, stepIndex) => {
          const path = ["effect_sequences", index, "steps", stepIndex];
          if (step.recipient === "source") {
            check(
              step.gate === "always",
              [...path, "gate"],
              "Source effects cannot depend on a target hit",
            );
          }
          const statuses =
            step.op === "apply_status"
              ? [step.status_id]
              : step.op === "remove_status"
                ? step.status_ids
                : [];
          statuses.forEach((status) =>
            check(references.statuses.has(status), path, `Unknown status: ${status}`),
          );
        });
      });
    })
    .safeParse(input);
}
