class_name CombatState
extends RefCounted

static func create(player: Dictionary, enemies: Array, inventory: Dictionary, seed: int) -> Dictionary:
	return {
		"player": player, "enemies": enemies, "inventory": inventory,
		"round": 1, "result": "", "events": [], "seq": 0,
		"seed": seed & 0xffffffff
	}

static func random(battle: Dictionary) -> float:
	battle.seed = (int(battle.seed) * 1664525 + 1013904223) & 0xffffffff
	return float(battle.seed) / 4294967296.0

static func emit(battle: Dictionary, type: String, source: String, target: String, payload: Dictionary = {}) -> void:
	battle.seq += 1
	battle.events.append({
		"seq": battle.seq, "type": type, "source": source,
		"target": target, "turn": battle.round, "payload": payload
	})
