class_name EnemyDefinition
extends Resource

@export var id: StringName
@export var display_name := ""
@export var archetype := ""  # bruiser, duelist, tank, assassin, ...
@export var is_boss := false
@export var max_hp := 10
@export var skills: Array[SkillDefinition] = []
