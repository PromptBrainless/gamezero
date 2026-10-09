# Content pipeline

- Content is Godot `Resource` files (`.tres`) in `godot/data/` using classes from `scripts/data/`: skills, enemies, bosses, items, careers, statuses.
- Optional later: CSV/JSON export for balancing; the existing `public/bilanz.txt` simulation is a balance reference.
- Art: atlases per character; layered parts for customization; paint parallax backgrounds into `assets/art/`.
- Per-figure minimum animations: idle, attack light/heavy, skill, dodge, block, hit, stun, defeat, victory.
