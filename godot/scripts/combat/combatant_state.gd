class_name CombatantState
extends RefCounted

static func create(record: Dictionary, skills: Array, enemy: bool = false) -> Dictionary:
	var stats: Dictionary = record.base_stats.duplicate(true)
	return {
		"id": record.id, "name": record.name, "stats": stats,
		"hp": int(stats.hp), "focus": int(stats.get("focus", 0)),
		"stamina": int(stats.get("stamina", 0)), "skills": skills.duplicate(),
		"cooldowns": {}, "effects": [], "skip_turn": false,
		"phase_index": 0, "pending_skill": "", "pending_turns": 0,
		"next_attack_bonus": 0, "equipment_effects": {},
		"phases": record.get("phases", []).duplicate(true),
		"ai": record.get("ai", {}).duplicate(true), "turn_count": 0,
		"free_focus": enemy and not stats.has("focus"),
		"free_stamina": enemy and not stats.has("stamina"),
		"dead_reported": false
	}
