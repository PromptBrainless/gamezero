class_name HudNumericMeter
extends VBoxContainer
## Numbers are authoritative. Clamping affects only the supporting fill.

const Tokens = preload("res://scripts/ui/foundation/hud_theme.gd")

var _caption := ""
var _current: Variant = null
var _maximum: Variant = null
var _warning := false

@onready var caption_label: Label = $Caption
@onready var value_label: Label = $Value
@onready var meter: ProgressBar = $Meter
@onready var warning_label: Label = $Warning


func _ready() -> void:
	theme = Tokens.create()
	value_label.add_theme_font_override("font", Tokens.numeric_font())
	_refresh()


## Null means unavailable, not zero. Invalid input clears any previous reading.
func set_values(caption: String, current: Variant, maximum: Variant = null,
		warning: bool = false) -> bool:
	_caption = caption
	_current = null
	_maximum = null
	_warning = false
	var valid := (current == null or Tokens.is_number(current)) \
			and (maximum == null or Tokens.is_number(maximum))
	if valid:
		_current = current
		_maximum = maximum
		_warning = warning
	if is_node_ready():
		_refresh()
	return valid


func _refresh() -> void:
	caption_label.text = _caption
	caption_label.visible = not _caption.is_empty()
	value_label.visible = _current != null or _maximum != null
	if _current != null and _maximum != null:
		value_label.text = "%s / %s" % [str(_current), str(_maximum)]
	elif _current != null:
		value_label.text = str(_current)
	elif _maximum != null:
		value_label.text = "Max: %s" % str(_maximum)
	else:
		value_label.text = ""
	meter.visible = _current != null and _maximum != null
	if meter.visible:
		meter.visible = _maximum > 0 and _current >= 0
	if meter.visible:
		# A fixed visual range avoids ProgressBar changing supplied bounds.
		meter.value = clampf(float(_current) / float(_maximum), 0.0, 1.0)
	warning_label.visible = _warning
	meter.add_theme_stylebox_override("fill",
			Tokens.panel(Tokens.DANGER if _warning else Tokens.STEEL,
			Tokens.DANGER if _warning else Tokens.STEEL))
