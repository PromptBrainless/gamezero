extends Control

signal target_selected(index: int)

const Tokens = preload("res://scripts/ui/foundation/hud_theme.gd")
const SKY := Color("#172526")
const DISTANCE := Color("#304340")
const STONE := Color("#52605a")
const SHADOW := Color("#101816")
const EARTH := Color("#343c31")

var encounter: Dictionary = {}
var actors: Array = []
var selected := -1
var target_selection := false
var reduced_motion := false
var _elapsed := 0.0
var _last_sequence := -1
var _impacts: Array = []
var _texture_cache: Dictionary = {}
var _idle_sheets: Dictionary = {}
var _anim_time := 0.0
var _frame_count := 3
var _frame_duration := 0.4
var _bg_cache: Dictionary = {}

func _init() -> void:
	custom_minimum_size.y = 200
	size_flags_horizontal = Control.SIZE_EXPAND_FILL

func _ready() -> void:
	clip_contents = true
	mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND if target_selection else Control.CURSOR_ARROW
	resized.connect(queue_redraw)
	set_process(not reduced_motion)
	_preload_textures()

func _preload_textures() -> void:
	var ids := ["mercenary", "duelist", "scholar_mage", "iron_captain", "hedge_cultist", "alley_cutthroat", "rusted_deserter"]
	for id in ids:
		var path := "res://assets/art/characters/%s.png" % id
		if ResourceLoader.exists(path):
			_texture_cache[id] = load(path)
		var sheet_path := "res://assets/art/characters/%s_idle.png" % id
		if ResourceLoader.exists(sheet_path):
			_idle_sheets[id] = load(sheet_path)
	var bgs := ["hedges", "ruins", "boss_gate"]
	for bg in bgs:
		var path := "res://assets/art/backgrounds/%s.png" % bg
		if ResourceLoader.exists(path):
			_bg_cache[bg] = load(path)

func present(record: Dictionary, player: Dictionary, opponents: Array, target: int = -1, selectable: bool = false, events: Array = []) -> void:
	encounter = record.duplicate(true)
	actors = [player.duplicate(true)]
	actors.append_array(opponents.duplicate(true))
	selected = target
	target_selection = selectable
	mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND if selectable else Control.CURSOR_ARROW
	for event in events:
		var sequence := int(event.get("seq", 0))
		if sequence <= _last_sequence:
			continue
		if event.get("type") == "damage":
			for index in range(actors.size()):
				if actors[index].get("id") == event.get("target"):
					_impacts.append({"actor": index, "amount": event.payload.get("amount", 0)})
		_last_sequence = sequence
	if reduced_motion:
		_impacts.clear()
	var hit_counts: Dictionary = {}
	for impact in _impacts:
		impact.line = hit_counts.get(impact.actor, 0)
		hit_counts[impact.actor] = impact.line + 1
	_elapsed = 0.0
	set_process(not reduced_motion)
	queue_redraw()

func _process(delta: float) -> void:
	_anim_time += delta
	_elapsed += minf(delta, 0.1)
	if _elapsed >= 0.8:
		_impacts.clear()
		set_process(false)
	queue_redraw()

func actor_position(index: int) -> Vector2:
	if index == 0:
		return Vector2(500 if actors.size() == 1 else 225, 296)
	return Vector2(720 if actors.size() == 2 else 630 + (index - 1) * 220, 296)

func _gui_input(event: InputEvent) -> void:
	if not target_selection or not event is InputEventMouseButton or event.button_index != MOUSE_BUTTON_LEFT or not event.pressed:
		return
	var point: Vector2 = event.position * Vector2(1000.0 / size.x, 360.0 / size.y)
	for index in range(1, actors.size()):
		if actors[index].get("hp", 1) > 0 and Rect2(actor_position(index) - Vector2(80, 230), Vector2(160, 250)).has_point(point):
			target_selected.emit(index - 1)
			accept_event()
			return

func polygon(points: Array, color: Color) -> void:
	draw_colored_polygon(PackedVector2Array(points), color)

func stroke(points: Array, color: Color, width: float = 3.0) -> void:
	draw_polyline(PackedVector2Array(points), color, width, true)

func _draw() -> void:
	if size.x <= 0 or size.y <= 0:
		return
	draw_set_transform(Vector2.ZERO, 0, Vector2(size.x / 1000.0, size.y / 360.0))
	# Background
	var bg_key := "ruins"
	if encounter.get("arena", "").contains("hedge") or encounter.get("id") == "cult_in_the_hedges":
		bg_key = "hedges"
	elif encounter.get("type") == "boss":
		bg_key = "boss_gate"
	var bg: Texture2D = _bg_cache.get(bg_key)
	if bg:
		draw_texture_rect(bg, Rect2(0, 0, 1000, 360), false)
	else:
		draw_rect(Rect2(0, 0, 1000, 360), SKY)
		draw_circle(Vector2(800, 65), 34, Color("#c6c5a1"))
		draw_circle(Vector2(812, 58), 32, SKY)
		polygon([Vector2(0, 150), Vector2(100, 95), Vector2(250, 155), Vector2(405, 78), Vector2(620, 155), Vector2(800, 110), Vector2(1000, 170), Vector2(1000, 340), Vector2(0, 340)], DISTANCE)
		var forest: bool = bg_key == "hedges"
		if forest:
			for index in range(15):
				var x := float(index * 77 - 20)
				polygon([Vector2(x, 282), Vector2(x + 12, 48), Vector2(x + 28, 25), Vector2(x + 26, 282)], SHADOW)
				stroke([Vector2(x + 18, 120), Vector2(x - 35, 70), Vector2(x - 48, 18)], SHADOW, 10)
				stroke([Vector2(x + 20, 170), Vector2(x + 55, 110), Vector2(x + 70, 55)], SHADOW, 7)
		else:
			for index in range(9):
				var x := float(index * 125 - 35)
				var height := float(110 + (index * 31) % 75)
				draw_rect(Rect2(x, 265 - height, 105, height), DISTANCE.darkened(0.25))
				for brick in range(4):
					stroke([Vector2(x, 265 - height + brick * 38), Vector2(x + 105, 265 - height + brick * 38)], STONE.darkened(0.3), 1)
				draw_rect(Rect2(x + 32, 288 - height, 30, 48), SHADOW)
			if encounter.get("type") == "boss":
				draw_rect(Rect2(380, 45, 225, 250), STONE.darkened(0.3))
				draw_rect(Rect2(428, 100, 130, 195), SHADOW)
				for x in range(438, 560, 20):
					draw_line(Vector2(x, 100), Vector2(x, 285), STONE, 5)
				polygon([Vector2(350, 45), Vector2(488, 12), Vector2(637, 45)], DISTANCE)
		draw_rect(Rect2(0, 265, 1000, 95), EARTH)
		polygon([Vector2(0, 325), Vector2(300, 280), Vector2(710, 278), Vector2(1000, 315), Vector2(1000, 360), Vector2(0, 360)], STONE.darkened(0.35))
		for index in range(40):
			var x := float((index * 83) % 1000)
			var y := float(303 + (index * 17) % 54)
			stroke([Vector2(x, y), Vector2(x + 26, y - 2)], EARTH.lightened(0.16), 2)
	for index in range(actors.size()):
		var actor: Dictionary = actors[index]
		var position := actor_position(index)
		draw_set_transform(position * Vector2(size.x / 1000.0, size.y / 360.0), 0, Vector2(size.x / 1000.0, size.y / 360.0))
		draw_actor(actor, index > 0)
		if index > 0 and selected == index - 1:
			stroke([Vector2(-52, 6), Vector2(0, 17), Vector2(52, 6)], Tokens.HIGHLIGHT, 4)
		if index > 0 and target_selection and actor.get("hp", 1) > 0:
			stroke([Vector2(-74, -170), Vector2(-74, -190), Vector2(-53, -190)], Tokens.HIGHLIGHT, 2)
			stroke([Vector2(53, -190), Vector2(74, -190), Vector2(74, -170)], Tokens.HIGHLIGHT, 2)
	for impact in _impacts:
		var position := actor_position(impact.actor) + Vector2(-20, -190 - impact.line * 32 - _elapsed * 35)
		draw_set_transform(position * Vector2(size.x / 1000.0, size.y / 360.0), 0, Vector2(size.x / 1000.0, size.y / 360.0))
		draw_string(ThemeDB.fallback_font, Vector2.ZERO, "−%s" % impact.amount, HORIZONTAL_ALIGNMENT_LEFT, -1, 32, Tokens.HIGHLIGHT)
	draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)

func _texture_drawable(tex: Texture2D) -> bool:
	return tex != null and not (tex is PlaceholderTexture2D) and tex.get_width() > 0 and tex.get_height() > 0

func _draw_sprite(tex: Texture2D, sheet: bool, enemy: bool) -> void:
	var region := Rect2(0, 0, tex.get_width(), tex.get_height())
	if sheet:
		var frames := maxi(_frame_count, 1)
		var frame_w := float(int(tex.get_width() / float(frames)))
		if frame_w < 1.0:
			return
		var frame := int(_anim_time / _frame_duration) % frames
		region = Rect2(frame * frame_w, 0.0, frame_w, tex.get_height())
	# Full-rect draw of one frame. draw_texture_rect_region under the stage
	# scale samples past the frame and fills the rest with the checkerboard.
	var atlas := AtlasTexture.new()
	atlas.atlas = tex
	atlas.region = region
	atlas.filter_clip = true
	var dest_size := region.size * 1.6
	var dest := Rect2(-dest_size.x * 0.5, -dest_size.y + 18.0, dest_size.x, dest_size.y)
	if enemy:
		dest = Rect2(dest_size.x * 0.5, -dest_size.y + 18.0, -dest_size.x, dest_size.y)
	draw_texture_rect(atlas, dest, false)
	draw_ellipse_shadow()

func draw_actor(actor: Dictionary, enemy: bool) -> void:
	var id: String = actor.get("content_id", actor.get("id", ""))
	var sheet: Texture2D = _idle_sheets.get(id)
	if _texture_drawable(sheet):
		_draw_sprite(sheet, true, enemy)
		return
	var tex: Texture2D = _texture_cache.get(id)
	if _texture_drawable(tex):
		_draw_sprite(tex, false, enemy)
		return
	# Fallback to procedural drawing if no sprite available
	var mage := id in ["scholar_mage", "hedge_cultist"]
	var light := id in ["duelist", "alley_cutthroat"]
	var boss := id == "iron_captain"
	var accent: Color = Tokens.DANGER if enemy else Tokens.STEEL if mage else Tokens.HIGHLIGHT
	if actor.get("hp", 1) <= 0:
		draw_set_transform((actor_position(actors.find(actor)) + Vector2(0, -8)) * Vector2(size.x / 1000.0, size.y / 360.0), PI / 2, Vector2(size.x / 1000.0, size.y / 360.0) * 0.6)
		accent = STONE
	draw_ellipse_shadow()
	var facing := -1.0 if enemy else 1.0
	polygon([Vector2(-30, -150), Vector2(-65, -14), Vector2(30, -24), Vector2(38, -144)], accent.darkened(0.55))
	for index in range(5):
		stroke([Vector2(-25 + index * 12, -133), Vector2(-52 + index * 15, -28)], accent.darkened(0.25), 2)
	stroke([Vector2(-21, -73), Vector2(-28, -5), Vector2(-49, -2)], SHADOW, 17)
	stroke([Vector2(17, -73), Vector2(27, -5), Vector2(49, -2)], SHADOW, 17)
	polygon([Vector2(-33, -151), Vector2(28, -151), Vector2(35, -78), Vector2(-29, -71)], DISTANCE if mage else STONE)
	polygon([Vector2(-24, -139), Vector2(18, -139), Vector2(19, -96), Vector2(-21, -92)], accent.darkened(0.24))
	for y in range(-130, -94, 10):
		stroke([Vector2(-19, y), Vector2(17, y - 2)], STONE.lightened(0.25), 2)
	stroke([Vector2(-33, -78), Vector2(34, -80)], Tokens.HIGHLIGHT.darkened(0.4), 7)
	stroke([Vector2(25 * facing, -138), Vector2(47 * facing, -110), Vector2(67 * facing, -131)], STONE, 13)
	draw_circle(Vector2(67 * facing, -131), 6, Tokens.MUTED)
	polygon([Vector2(-18, -185), Vector2(8, -191), Vector2(23, -175), Vector2(16, -153), Vector2(-8, -151), Vector2(-20, -166)], Tokens.MUTED.darkened(0.2))
	polygon([Vector2(-24, -173), Vector2(-21, -194), Vector2(10, -203), Vector2(27, -186), Vector2(18, -178), Vector2(5, -190), Vector2(-14, -180)], SHADOW if not mage else STONE)
	stroke([Vector2(9 * facing, -171), Vector2(18 * facing, -172)], SHADOW, 3)
	if mage:
		stroke([Vector2(75 * facing, -6), Vector2(79 * facing, -221)], Tokens.HIGHLIGHT.darkened(0.25), 5)
		polygon([Vector2(79 * facing, -234), Vector2(66 * facing, -218), Vector2(80 * facing, -201), Vector2(92 * facing, -219)], Tokens.STEEL if not enemy else Tokens.DANGER)
		draw_arc(Vector2(79 * facing, -219), 23, 0, TAU, 28, accent.darkened(0.1), 2, true)
	else:
		var blade_height := -223 if light else -195
		polygon([Vector2(61 * facing, -132), Vector2(73 * facing, blade_height), Vector2(82 * facing, blade_height + 7), Vector2(70 * facing, -130)], Tokens.FOREGROUND.darkened(0.15))
		stroke([Vector2(54 * facing, -132), Vector2(83 * facing, -128)], Tokens.HIGHLIGHT, 5)
		if not light:
			polygon([Vector2(-56 * facing, -137), Vector2(-11 * facing, -127), Vector2(-17 * facing, -67), Vector2(-41 * facing, -43), Vector2(-65 * facing, -78)], accent.darkened(0.35))
			stroke([Vector2(-56 * facing, -137), Vector2(-11 * facing, -127), Vector2(-17 * facing, -67), Vector2(-41 * facing, -43), Vector2(-65 * facing, -78), Vector2(-56 * facing, -137)], Tokens.MUTED, 3)
			stroke([Vector2(-39 * facing, -123), Vector2(-39 * facing, -65)], Tokens.HIGHLIGHT, 3)
	if boss:
		polygon([Vector2(-24, -170), Vector2(-25, -199), Vector2(15, -207), Vector2(29, -180), Vector2(19, -155), Vector2(-14, -151)], STONE)
		stroke([Vector2(-16, -178), Vector2(23, -180)], SHADOW, 5)
		stroke([Vector2(7, -196), Vector2(7, -159)], Tokens.HIGHLIGHT, 3)

func draw_ellipse_shadow() -> void:
	var points := PackedVector2Array()
	for index in range(32):
		points.append(Vector2(cos(index * TAU / 32) * 68, sin(index * TAU / 32) * 10))
	draw_colored_polygon(points, SHADOW)
