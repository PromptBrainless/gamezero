extends Node
## Global signals. Combat emits events; presentation (HUD/animation) listens.

signal combat_event(event: Dictionary)
signal combat_started(player_id: StringName, enemy_id: StringName)
signal combat_finished(player_won: bool)
