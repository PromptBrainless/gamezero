# Visual Reference Brief

## 1. Style principles
- Dark, grounded low-fantasy; grim, muted palettes with one accent color per region.
- Readable silhouettes first; weathered materials (iron, leather, ash, bone).
- Art serves the tactical UI: flat, uncluttered backgrounds behind units.
- Regions: `roadside_marches` cold road, camps, ruins; `cinder_crypt` ash, torchlight, ritual remains, corruption violet; `blackwood_path` dark forest, fog, decayed hunting trails.

## 2. Prompt rules
- Structure: subject, role/career, pose, materials, palette, lighting, camera, background, negative terms.
- Always name palette and region accent; always specify neutral background for sprites.
- Negative: no text, no logos, no modern items, no gore excess, no glossy or cartoon look.
- Keep one subject per prompt; reuse the same style suffix: `grim low-fantasy, muted palette, hand-painted, clean silhouette`.

## 3. Prompt templates
- **Character:** `[career] full body, [pose], [gear], [palette], soft rim light, 3/4 view, plain dark background, <style suffix>` — e.g. hunter with longbow and hooked tools; witch_hunter with iron-banded coat and flame censer; brawler with wrapped fists and scarred torso.
- **Boss:** `[boss] towering, readable silhouette, phase-specific details` — `plague_mother`: bloated veiled figure, pale sickly greens, rotting growths (phases `sickly_veil`, `rotting_womb`, `feast_of_decay` escalate decay); `iron_captain`: heavy plate, battered banner.
- **HUD:** flat icons, 2 px strokes, 32 px grid, monochrome plus status color role, no text in art.
- **Environment:** wide 16:9 battle backdrop, low contrast center, horizon line at 40%, region accent lighting.
- **Items:** single item, centered, 3/4 view, neutral background, rarity shown only by UI frame.
- **FX:** isolated effect on transparent/black, 6–8 frame sheets: `poison` green drip cloud, `bleed` red slash, `purging_flame` orange-white fire, `broken_armor` shattered plates.

## 4. Output requirements
- Sprites/items: PNG with transparency, 512×512 (characters 512×768), power-of-two sheets for FX.
- Backdrops: 1920×1080 JPG/PNG.
- Icons: SVG or 64×64 PNG.
- File names: snake_case matching the data id (`plague_mother.png`).
- Every asset must pass: silhouette readable at 64 px, no text artifacts, consistent light direction (top-left).
