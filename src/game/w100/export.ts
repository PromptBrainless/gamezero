import { CHARAKTERE, bonus, type Charakter } from "./charaktere";
import { BAU_X0, BAU_Y0, BAU_KANTE, ziele, type Feld } from "./karte";

export interface Stellung {
  name: string;
  feld: Feld;
  form: Charakter["form"];
  reichweite: number;
  mindest: number;
}

/** Foundry 14: Region mit GridShape, nicht die abgeschaffte MeasuredTemplate. Kein fertiges Weltdokument. */
export function foundryPaket(stellung: Stellung[]) {
  return {
    hinweis:
      "Foundry 14. shapes[].type grid entspricht GridShapeData: offsets sind Felder relativ zum Token. Wände sind die Kante des Baus in Feldern, mal die Gitterweite der Szene. Erst importierbar, wenn ein eigenes System die Actor-Felder kennt.",
    actors: CHARAKTERE.map(actor),
    waende: [
      kante(BAU_X0, BAU_Y0, BAU_X0 + BAU_KANTE, BAU_Y0),
      kante(BAU_X0 + BAU_KANTE, BAU_Y0, BAU_X0 + BAU_KANTE, BAU_Y0 + BAU_KANTE),
      kante(BAU_X0 + BAU_KANTE, BAU_Y0 + BAU_KANTE, BAU_X0, BAU_Y0 + BAU_KANTE),
      kante(BAU_X0, BAU_Y0 + BAU_KANTE, BAU_X0, BAU_Y0),
    ],
    regionen: stellung.map((wer) => ({
      name: `${wer.name} Radius`,
      color: "#e16a4e",
      visibility: 2,
      attachment: { token: wer.name },
      shapes: [
        {
          type: "grid",
          origin: { x: wer.feld.x, y: wer.feld.y },
          offsets: ziele(wer.form, wer.feld, wer.reichweite, wer.feld, wer.mindest).map((feld) => ({
            i: feld.x - wer.feld.x,
            j: feld.y - wer.feld.y,
          })),
        },
      ],
    })),
  };
}

function kante(x1: number, y1: number, x2: number, y2: number) {
  return { x1, y1, x2, y2, move: "block", sense: "block", light: "block" };
}

function actor(c: Charakter) {
  return {
    name: c.name,
    type: "character",
    system: {
      ws: c.ws,
      bs: c.bs,
      staerke: c.staerke,
      widerstand: c.widerstand,
      wille: c.wille,
      ausweichen: c.ausweichen,
      wunden: { value: c.wunden, max: c.wunden },
      bonus: { sb: bonus(c.staerke), zb: bonus(c.widerstand) },
      waffe: {
        schaden: c.schaden,
        laenge: c.laenge,
        reichweite: c.reichweite,
        mindest: c.mindest,
        form: c.form,
        effekt: c.effekt,
        ortwahl: c.ortwahl,
      },
      ruestung: c.ruestung,
    },
  };
}

/** Roll20-Blatt und ein Makro. Die Karte, das Hineinlaufen und die Szenen fehlen dort bewusst. */
export function roll20Paket() {
  return {
    hinweis:
      "Attribute für ein Roll20-Charakterblatt. Das Makro würfelt nur W100 und liest WS oder BS. Erfolgsgrade, Zone, Rüstung und Radius rechnet Duellzeit.",
    characters: CHARAKTERE.map((c) => ({
      name: c.name,
      attributes: {
        WS: c.ws,
        BS: c.bs,
        Staerke: c.staerke,
        Widerstand: c.widerstand,
        Wille: c.wille,
        Ausweichen: c.ausweichen,
        Wunden: c.wunden,
        SB: bonus(c.staerke),
        ZB: bonus(c.widerstand),
        Schaden: c.schaden,
        Radius: c.reichweite,
        Mindest: c.mindest,
        Laenge: c.laenge,
        Form: c.form,
      },
    })),
    macros: [
      {
        name: "Schlag",
        action:
          "/desc @{selected|character_name} schlägt. Wurf [[1d100]] gegen WS @{selected|WS}, Fernkampf gegen BS @{selected|BS}.",
      },
    ],
  };
}
