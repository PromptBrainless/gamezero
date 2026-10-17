# Pixel-Art Prompts — Gamezero Asset Pipeline

Strukturierte Prompts für die kostenfreie Pollinations Classic API und lokale Open-Weights-Workflows.
Ziel: konsistenter, lesbarer Pixel-Art-Stil für den mobile-first Tactical RPG (Side-View).

**Stil-Anker (immer mitgeben):**
```
pixel art, 16-bit inspired, clean edges, limited palette, readable silhouette,
side view, dark fantasy with grounded emotional weight, subtle cozy cottagecore accents,
high contrast for mobile, no anti-aliasing, crisp pixels
```

---

## 1. Charaktere (Side-View)

### Basis-Held
```
pixel art character, side view, standing idle, [CLASS], [ARMOR DESCRIPTION],
readable silhouette, limited color palette (max 12 colors),
subtle breathing idle, clean pixel edges, dark fantasy, grounded,
high contrast, mobile-readable, no blur, 64x64 or 96x96 sprite sheet ready
```

### Varianten
- **Duelist:** `agile duelist, light leather and cloth, short blade, focused stance`
- **Warden:** `heavy warden, layered cloth and metal plates, shield on back, grounded stance`
- **Echo:** `echo mystic, layered robes with faint glowing threads, staff or focus, calm presence`

### Emotions / Zustände
```
pixel art [CHARACTER], side view, [EMOTION: determined / wounded / focused / exhausted],
subtle facial expression readable at small size, clean pixels
```

---

## 2. Tilesets & Terrain

### Ground / Path
```
pixel art tileset, side-view ground layer, [MATERIAL: packed earth / wooden planks / stone path / mossy ruin],
seamless horizontal, readable height variation, limited palette,
dark fantasy, subtle wear, mobile-friendly contrast, 16x16 or 32x32 base
```

### Vertical Elements (Walls, Cliffs, Barriers)
```
pixel art vertical terrain, side view, [TYPE: ruined wall / wooden barricade / rock face / hedge],
clear top edge for units to stand on, limited palette, high readability
```

### Interactive / Cover
```
pixel art cover object, side view, [OBJECT: overturned cart / low stone wall / wooden crate / thick roots],
readable silhouette, can block line of sight, limited palette
```

---

## 3. Battlemap-Elemente

### Encounter-Stage
```
pixel art battlemap background layer, side view, [LOCATION: ruined village edge / forest clearing / stone bridge / cellar],
layered depth (foreground / mid / background), limited palette,
room for units on ground plane, dark fantasy atmosphere, mobile readable
```

### Status / Marker
```
pixel art status icon, small, [EFFECT: poison / burn / shield / haste / stunned],
clear at 16x16, limited palette, high contrast, no text
```

---

## 4. UI-Icons & HUD

### Action Icons
```
pixel art UI icon, [ACTION: attack / move / skill / end turn / inspect],
16x16 or 24x24, limited palette, high contrast, readable on dark and light backgrounds,
side-view inspired but simplified, no anti-aliasing
```

### Resource / Career Icons
```
pixel art resource icon, [TYPE: stamina / focus / scrap / echo thread],
simple geometric form, limited palette, mobile tap-target friendly
```

---

## 5. VFX & Feedback (Sprite Sheets)

```
pixel art VFX sprite sheet, [EFFECT: slash / impact / heal pulse / status pop],
side view, limited palette, readable at small size, short loop (4-8 frames),
clean pixels, high contrast
```

---

## Nutzung mit der kostenfreien Pollinations-API

```ts
import { generatePixelArt } from "@/lib/flux/generate-pixel-art.server";

const result = await generatePixelArt({
  data: {
    variant: "duelist",
    width: 1024,
    height: 1024,
    // seed: 42,
  },
});
// result.base64 ist das Bild (JPEG)
```

Oder direkt mit dem Client:

```ts
import { createPollinationsClient } from "@/lib/flux/pollinations-client";

const client = createPollinationsClient();
const buffer = await client.generate({
  prompt: "pixel art character, side view, agile duelist, light leather, short blade, readable silhouette, limited palette, clean pixel edges, dark fantasy, high contrast, mobile-readable",
  width: 1024,
  height: 1024,
  model: "flux",
  nologo: true,
});
```

## Konsistenz-Tipps

- Immer denselben Stil-Anker voranstellen.
- Seed merken und wiederverwenden für Varianten.
- Nach der Generierung auf 64x64 / 96x96 / 32x32 herunterskalieren und Palette begrenzen (Aseprite, ImageMagick oder eigenes Tool).
- Für Tilesets: zuerst einzelne Tiles generieren, dann manuell oder per Skript zu einem Sheet zusammensetzen.
- Pollinations Classic API ist kostenfrei, aber rate-limited (ca. 1 Anfrage alle 15–45 Sekunden).

---

*Quelle: Gamezero Art Direction + bestehende Skills (game-tilesets, game-character-consistency, game-ui-icons).*
