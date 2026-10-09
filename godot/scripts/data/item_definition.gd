class_name ItemDefinition
extends Resource

@export var id: StringName
@export var display_name := ""
@export_enum("weapon", "offhand", "head", "chest", "hands", "legs", "trinket", "consumable") var slot := "weapon"
