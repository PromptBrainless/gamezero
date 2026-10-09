class_name Inventory
extends RefCounted
## Slot-based inventory plus equipped loadout (slot name -> ItemDefinition).

var equipped := {}
var bag: Array[ItemDefinition] = []
