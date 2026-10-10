class_name HudFoundationTheme
extends RefCounted
## Native starting tokens from docs/art-sprint-1-production-pack.md.

const BACKGROUND := Color("#111513")
const SURFACE := Color("#1a201e")
const RAISED := Color("#252d2a")
const FOREGROUND := Color("#f1eee5")
const MUTED := Color("#a7b3ab")
const DANGER := Color("#e16a4e")
const HIGHLIGHT := Color("#e8c98d")
const STEEL := Color("#8fc5c3")
const SPACE := 8
const TOUCH_SIZE := 48
const FONT_SIZE := 18


static func panel(color: Color, border: Color = MUTED, width: int = 1) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = color
	style.border_color = border
	style.set_border_width_all(width)
	style.set_corner_radius_all(4)
	style.content_margin_left = SPACE
	style.content_margin_right = SPACE
	style.content_margin_top = SPACE
	style.content_margin_bottom = SPACE
	return style


static func create() -> Theme:
	var result := Theme.new()
	result.default_font_size = FONT_SIZE
	result.set_color("font_color", "Label", FOREGROUND)
	result.set_color("font_color", "Button", FOREGROUND)
	for state in ["hover", "pressed", "focus", "disabled", "hover_pressed"]:
		result.set_color("font_%s_color" % state, "Button", FOREGROUND)
	result.set_constant("separation", "VBoxContainer", SPACE)
	result.set_constant("separation", "HBoxContainer", SPACE)
	result.set_stylebox("panel", "PanelContainer", panel(SURFACE))
	result.set_stylebox("normal", "Button", panel(RAISED))
	result.set_stylebox("hover", "Button", panel(RAISED, FOREGROUND))
	result.set_stylebox("pressed", "Button", panel(SURFACE, HIGHLIGHT, 2))
	result.set_stylebox("disabled", "Button", panel(SURFACE))
	var focus := panel(Color.TRANSPARENT, HIGHLIGHT, 2)
	focus.draw_center = false
	result.set_stylebox("focus", "Button", focus)
	result.set_stylebox("background", "ProgressBar", panel(BACKGROUND))
	result.set_stylebox("fill", "ProgressBar", panel(STEEL, STEEL))
	return result


static func numeric_font() -> FontVariation:
	var font := FontVariation.new()
	font.base_font = ThemeDB.fallback_font
	font.opentype_features = {"tnum": 1}
	return font


static func is_number(value: Variant) -> bool:
	if value is int:
		return true
	if value is float:
		return is_finite(value)
	return false
