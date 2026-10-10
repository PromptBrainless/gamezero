class_name HudStatusChip
extends PanelContainer
## Canonical definition plus separately supplied active-instance values.
## default_duration/max_stacks are not remaining duration/current stacks.

const Tokens = preload("res://scripts/ui/foundation/hud_theme.gd")
const HelpWidget = preload("res://scripts/ui/foundation/focus_tap_help.gd")

var _record: Dictionary = {}
var _duration: Variant = null
var _stacks: Variant = null
var _icon: Texture2D = null

@onready var name_label: Label = $Content/Name
@onready var shape_label: Label = $Content/Shape
@onready var kind_label: Label = $Content/Kind
@onready var counts_label: Label = $Content/Counts
@onready var icon_view: TextureRect = $Content/Icon
@onready var help: HelpWidget = $Content/Help


func _ready() -> void:
	theme = Tokens.create()
	counts_label.add_theme_font_override("font", Tokens.numeric_font())
	_refresh()


## Supply validated canonical records; optional icon must be an approved mapping.
func set_status(record: Dictionary, duration: Variant = null,
		stacks: Variant = null, icon: Texture2D = null) -> bool:
	_record = {}
	_duration = null
	_stacks = null
	_icon = null
	var valid := record.get("name") is String and record.get("description") is String
	valid = valid and (duration == null or Tokens.is_number(duration))
	valid = valid and (stacks == null or Tokens.is_number(stacks))
	if valid:
		_record = record.duplicate(true)
		_duration = duration
		_stacks = stacks
		_icon = icon
	if is_node_ready():
		_refresh()
	return valid


func clear_status() -> void:
	_record = {}
	_duration = null
	_stacks = null
	_icon = null
	if is_node_ready():
		_refresh()


func _refresh() -> void:
	visible = not _record.is_empty()
	name_label.text = str(_record.get("name", ""))
	kind_label.text = str(_record.get("kind", ""))
	kind_label.visible = not kind_label.text.is_empty()
	var shape := str(_record.get("icon_shape", ""))
	shape_label.text = "Shape: %s" % shape
	shape_label.visible = _icon == null and not shape.is_empty()
	icon_view.texture = _icon
	icon_view.visible = _icon != null
	var counts := PackedStringArray()
	if _duration != null:
		counts.append("Duration: %s" % str(_duration))
	if _stacks != null:
		counts.append("Stacks: %s" % str(_stacks))
	counts_label.text = " · ".join(counts)
	counts_label.visible = not counts.is_empty()
	help.set_help(str(_record.get("description", "")))
