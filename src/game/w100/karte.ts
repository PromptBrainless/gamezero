/** Gitter 64×64. Jede Waffe deckt einen eigenen Radius. Nahkampf und Schuss brauchen Sicht am Bau vorbei, der Bogen geht darüber. */

export const BREITE = 64;

export type Form = "nah" | "schuss" | "bogen";

export interface Feld {
  x: number;
  y: number;
}

export const BAU_X0 = 24;
export const BAU_Y0 = 24;
export const BAU_KANTE = 16;

export const BAU: Feld[] = [];
for (let y = BAU_Y0; y < BAU_Y0 + BAU_KANTE; y += 1) {
  for (let x = BAU_X0; x < BAU_X0 + BAU_KANTE; x += 1) BAU.push({ x, y });
}

const BAU_IDS = new Set(BAU.map((feld) => feld.y * BREITE + feld.x));

export function index(feld: Feld): number {
  return feld.y * BREITE + feld.x;
}

export function vonIndex(id: number): Feld {
  return { x: id % BREITE, y: Math.floor(id / BREITE) };
}

export function gleich(a: Feld, b: Feld): boolean {
  return a.x === b.x && a.y === b.y;
}

export function imFeld(feld: Feld): boolean {
  return feld.x >= 0 && feld.y >= 0 && feld.x < BREITE && feld.y < BREITE;
}

export function istBau(feld: Feld): boolean {
  return BAU_IDS.has(index(feld));
}

const RICHTUNG: Feld[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

export function nachbarn(feld: Feld): Feld[] {
  return RICHTUNG.map((r) => ({ x: feld.x + r.x, y: feld.y + r.y })).filter(imFeld);
}

export function schrittZurueck(von: Feld, gegner: Feld): Feld | null {
  const frei = nachbarn(von).filter((feld) => !istBau(feld) && !gleich(feld, gegner));
  frei.sort((a, b) => abstand(b, gegner) - abstand(a, gegner));
  return frei[0] ?? null;
}

export function abstand(a: Feld, b: Feld): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function erreichbar(von: Feld, weite: number, block: Feld[]): Feld[] {
  const gesehen = new Set<number>([index(von)]);
  let rand = [von];
  const treffer: Feld[] = [];
  for (let schritt = 0; schritt < weite; schritt += 1) {
    const naechste: Feld[] = [];
    for (const feld of rand) {
      for (const nachbar of nachbarn(feld)) {
        const id = index(nachbar);
        if (gesehen.has(id) || istBau(nachbar) || block.some((item) => gleich(item, nachbar))) continue;
        gesehen.add(id);
        treffer.push(nachbar);
        naechste.push(nachbar);
      }
    }
    rand = naechste;
  }
  return treffer;
}

/** Schablone der Waffe: Kreis oder Ring, noch ohne Mauer. */
export function inSchablone(von: Feld, feld: Feld, weite: number, mindest = 1): boolean {
  if (!imFeld(feld) || gleich(von, feld)) return false;
  const dx = feld.x - von.x;
  const dy = feld.y - von.y;
  const quadrat = dx * dx + dy * dy;
  return quadrat <= weite * weite && quadrat >= mindest * mindest;
}

/** Fläche der Waffe. Nahkampf und Schuss brauchen eine freie Ecke, der Bogen geht über den Bau. */
export function bereich(form: Form, von: Feld, feld: Feld, weite: number, mindest = 1): boolean {
  if (!inSchablone(von, feld, weite, mindest) || istBau(feld)) return false;
  if (form === "bogen") return true;
  return sichtfrei(von, feld);
}

function sichtfrei(von: Feld, nach: Feld): boolean {
  const ox = von.x + 0.5;
  const oy = von.y + 0.5;
  const ecken: Array<[number, number]> = [
    [nach.x + 0.05, nach.y + 0.05],
    [nach.x + 0.95, nach.y + 0.05],
    [nach.x + 0.05, nach.y + 0.95],
    [nach.x + 0.95, nach.y + 0.95],
  ];
  return ecken.some(([tx, ty]) => strahlFrei(ox, oy, tx, ty, nach));
}

function strahlFrei(x0: number, y0: number, x1: number, y1: number, ziel: Feld): boolean {
  let x = Math.floor(x0);
  let y = Math.floor(y0);
  const dx = x1 - x0;
  const dy = y1 - y0;
  const stepX = dx > 0 ? 1 : dx < 0 ? -1 : 0;
  const stepY = dy > 0 ? 1 : dy < 0 ? -1 : 0;
  const tDeltaX = dx === 0 ? Number.POSITIVE_INFINITY : Math.abs(1 / dx);
  const tDeltaY = dy === 0 ? Number.POSITIVE_INFINITY : Math.abs(1 / dy);
  const bruchX = x0 - Math.floor(x0);
  const bruchY = y0 - Math.floor(y0);
  let tMaxX = dx === 0 ? Number.POSITIVE_INFINITY : (dx > 0 ? 1 - bruchX : bruchX) * tDeltaX;
  let tMaxY = dy === 0 ? Number.POSITIVE_INFINITY : (dy > 0 ? 1 - bruchY : bruchY) * tDeltaY;
  for (let n = 0; n < BREITE * 2; n += 1) {
    if (x === ziel.x && y === ziel.y) return true;
    if (tMaxX < tMaxY) {
      x += stepX;
      tMaxX += tDeltaX;
    } else if (tMaxY < tMaxX) {
      y += stepY;
      tMaxY += tDeltaY;
    } else {
      const seiteX = istBau({ x: x + stepX, y });
      const seiteY = istBau({ x, y: y + stepY });
      if (seiteX && seiteY) return false;
      x += stepX;
      y += stepY;
      tMaxX += tDeltaX;
      tMaxY += tDeltaY;
    }
    if (x === ziel.x && y === ziel.y) return true;
    if (!imFeld({ x, y }) || istBau({ x, y })) return false;
  }
  return false;
}

export function ziele(form: Form, von: Feld, weite: number, _gegner: Feld, mindest = 1): Feld[] {
  const liste: Feld[] = [];
  const vonX = Math.max(0, von.x - weite);
  const bisX = Math.min(BREITE - 1, von.x + weite);
  const vonY = Math.max(0, von.y - weite);
  const bisY = Math.min(BREITE - 1, von.y + weite);
  for (let y = vonY; y <= bisY; y += 1) {
    for (let x = vonX; x <= bisX; x += 1) {
      const feld = { x, y };
      if (bereich(form, von, feld, weite, mindest)) liste.push(feld);
    }
  }
  return liste;
}

export function kannTreffen(form: Form, von: Feld, weite: number, gegner: Feld, mindest = 1): boolean {
  return bereich(form, von, gegner, weite, mindest);
}

export function weg(von: Feld, ziel: Feld, weite: number, block: Feld[]): Feld[] | null {
  if (gleich(von, ziel)) return [];
  const herkunft = new Map<number, number>();
  const gesehen = new Set<number>([index(von)]);
  let rand = [von];
  let gefunden = false;
  for (let schritt = 0; schritt < weite && !gefunden; schritt += 1) {
    const naechste: Feld[] = [];
    for (const feld of rand) {
      for (const nachbar of nachbarn(feld)) {
        const id = index(nachbar);
        if (gesehen.has(id) || istBau(nachbar) || block.some((item) => gleich(item, nachbar))) continue;
        gesehen.add(id);
        herkunft.set(id, index(feld));
        naechste.push(nachbar);
        if (gleich(nachbar, ziel)) gefunden = true;
      }
    }
    rand = naechste;
  }
  if (!herkunft.has(index(ziel))) return null;
  const schritte: Feld[] = [];
  let cursor = index(ziel);
  const start = index(von);
  while (cursor !== start) {
    schritte.push(vonIndex(cursor));
    const davor = herkunft.get(cursor);
    if (davor === undefined) return null;
    cursor = davor;
  }
  schritte.reverse();
  return schritte;
}
