class_name HudFocusTapHelp
extends VBoxContainer
## Inline details preserve surrounding action/target context; no hover is required.

signal help_opened
signal help_closed

const Tokens = preload("res://scripts/ui/foundation/hud_theme.gd")

var _caption := "Details"
var _description := ""
var _reason := ""
var _pinned := false
var _suppress_focus_open := false

@onready var trigger: Button = $Trigger
@onready var reason_label: Label = $Reason
@onready var details: PanelContainer = $Details
@onready var description_label: Label = $Details/Content/Description
@onready var dismiss_button: Button = $Details/Content/Dismiss


func _ready() -> void:
	theme = Tokens.create()
	trigger.pressed.connect(_toggle_pinned)
	trigger.focus_entered.connect(_show_on_focus)
	trigger.focus_exited.connect(_queue_focus_check)
	dismiss_button.focus_exited.connect(_queue_focus_check)
	dismiss_button.pressed.connect(dismiss)
	_refresh()


## An unavailable reason is always visible; inspection is never disabled.
func set_help(description: String, caption: String = "Details",
		unavailable_reason: String = "") -> void:
	_description = description
	_caption = caption
	_reason = unavailable_reason
	if is_node_ready():
		_refresh()


func dismiss() -> void:
	_pinned = false
	_set_open(false)
	if trigger.visible and is_visible_in_tree():
		_suppress_focus_open = true
		trigger.grab_focus()
		_suppress_focus_open = false


func _refresh() -> void:
	trigger.text = _caption
	trigger.visible = not _description.is_empty()
	description_label.text = _description
	reason_label.text = _reason
	reason_label.visible = not _reason.is_empty()
	if _description.is_empty():
		_pinned = false
		_set_open(false)


func _show_on_focus() -> void:
	if not _suppress_focus_open:
		_set_open(true)


func _toggle_pinned() -> void:
	if _pinned:
		dismiss()
	else:
		_pinned = true
		_set_open(true)


func _set_open(open: bool) -> void:
	open = open and not _description.is_empty()
	if details.visible == open:
		return
	details.visible = open
	if open:
		help_opened.emit()
	else:
		help_closed.emit()


func _queue_focus_check() -> void:
	_dismiss_if_focus_left.call_deferred()


func _dismiss_if_focus_left() -> void:
	if not is_inside_tree() or _pinned:
		return
	var owner := get_viewport().gui_get_focus_owner()
	if owner == null or not is_ancestor_of(owner):
		_set_open(false)


func _unhandled_key_input(event: InputEvent) -> void:
	if not details.visible or not is_visible_in_tree():
		return
	var owner := get_viewport().gui_get_focus_owner()
	if owner != null and is_ancestor_of(owner) and event.is_action_pressed("ui_cancel"):
		dismiss()
		get_viewport().set_input_as_handled()
