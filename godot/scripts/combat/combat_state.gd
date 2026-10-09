class_name CombatState
extends RefCounted
## Pure-data source of truth for one 1v1 fight (no nodes, deterministic via seed).

var rng := RandomNumberGenerator.new()
var round_number := 0
var combatants: Array[CombatantState] = []
var events: Array[Dictionary] = []
