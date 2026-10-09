import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as SkipForward, c as Pause, d as BookOpen, i as Swords, l as Orbit, n as Volume2, o as Shield, s as Play, t as VolumeX, u as Footprints } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-B8AMJNfl.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var AKTIONEN = [
	{
		id: "bewegen",
		name: "Bewegen",
		kosten: 1,
		text: "Felder entlang der Linien, bis zur Bewegungsweite. Nicht durch Gegner oder Bau."
	},
	{
		id: "schlagen",
		name: "Schlagen",
		kosten: 1,
		text: "W100, wenn das Ziel in der Form liegt. Nahkampf vergleicht, Fernkampf ist eine einfache Probe."
	},
	{
		id: "parieren",
		name: "Parieren",
		kosten: 1,
		text: "Der nächste Schlag gegen dich ist eine Vergleichsprobe mit deiner Waffenfertigkeit."
	},
	{
		id: "ausweichen",
		name: "Ausweichen",
		kosten: 1,
		text: "Der nächste Schlag gegen dich ist eine Vergleichsprobe mit deiner Ausweichen-Fertigkeit."
	},
	{
		id: "passen",
		name: "Passen",
		kosten: 0,
		text: "Die Runde endet. Was angekündigt ist, wird jetzt gewürfelt."
	}
];
var FOLGE = [
	"Prüfen, was legal ist.",
	"Eine Option wählen.",
	"Einen Aktionspunkt zahlen.",
	"Die Wirkung sofort ausführen.",
	"Abschließen, wenn keine Punkte übrig sind."
];
var leicht = {
	kopf: 0,
	"arm-links": 1,
	"arm-rechts": 1,
	koerper: 1,
	"bein-links": 1,
	"bein-rechts": 1
};
var platte$1 = {
	kopf: 2,
	"arm-links": 3,
	"arm-rechts": 3,
	koerper: 4,
	"bein-links": 2,
	"bein-rechts": 2
};
var CHARAKTERE = [
	{
		id: "brecher",
		name: "Brecher",
		zeile: "Nah, hart, langsam.",
		ws: 55,
		bs: 25,
		staerke: 5,
		widerstand: 4,
		ausweichen: 25,
		wunden: 16,
		bewegung: 3,
		form: "nah",
		reichweite: 1,
		waffe: 6,
		ruestung: {
			...platte$1,
			koerper: 3,
			kopf: 1
		}
	},
	{
		id: "laeuferin",
		name: "Läuferin",
		zeile: "Weit gehen, dem Schlag ausweichen.",
		ws: 48,
		bs: 30,
		staerke: 4,
		widerstand: 3,
		ausweichen: 60,
		wunden: 12,
		bewegung: 5,
		form: "nah",
		reichweite: 1,
		waffe: 4,
		ruestung: leicht
	},
	{
		id: "archivar",
		name: "Archivar",
		zeile: "Bogen über Bau. Einmal die Zone wählen.",
		ws: 40,
		bs: 52,
		staerke: 3,
		widerstand: 3,
		ausweichen: 35,
		wunden: 13,
		bewegung: 4,
		form: "bogen",
		reichweite: 6,
		waffe: 5,
		ruestung: leicht
	},
	{
		id: "waechter",
		name: "Wächter",
		zeile: "Parieren und Rüstung.",
		ws: 48,
		bs: 25,
		staerke: 4,
		widerstand: 5,
		ausweichen: 30,
		wunden: 18,
		bewegung: 3,
		form: "nah",
		reichweite: 1,
		waffe: 4,
		ruestung: platte$1
	},
	{
		id: "jaeger",
		name: "Jäger",
		zeile: "Schuss bis zum ersten Hindernis.",
		ws: 35,
		bs: 58,
		staerke: 3,
		widerstand: 3,
		ausweichen: 42,
		wunden: 13,
		bewegung: 4,
		form: "schuss",
		reichweite: 6,
		waffe: 5,
		ruestung: leicht
	}
];
function charakter(id) {
	return CHARAKTERE.find((item) => item.id === id);
}
var BAU = [
	{
		x: 3,
		y: 3
	},
	{
		x: 4,
		y: 3
	},
	{
		x: 3,
		y: 4
	},
	{
		x: 4,
		y: 4
	}
];
function index(feld) {
	return feld.y * 8 + feld.x;
}
function vonIndex(id) {
	return {
		x: id % 8,
		y: Math.floor(id / 8)
	};
}
function gleich(a, b) {
	return a.x === b.x && a.y === b.y;
}
function imFeld(feld) {
	return feld.x >= 0 && feld.y >= 0 && feld.x < 8 && feld.y < 8;
}
function istBau(feld) {
	return BAU.some((bau) => gleich(bau, feld));
}
var RICHTUNG = [
	{
		x: 1,
		y: 0
	},
	{
		x: -1,
		y: 0
	},
	{
		x: 0,
		y: 1
	},
	{
		x: 0,
		y: -1
	}
];
function nachbarn(feld) {
	return RICHTUNG.map((r) => ({
		x: feld.x + r.x,
		y: feld.y + r.y
	})).filter(imFeld);
}
function schrittZurueck(von, gegner) {
	const frei = nachbarn(von).filter((feld) => !istBau(feld) && !gleich(feld, gegner));
	frei.sort((a, b) => abstand(b, gegner) - abstand(a, gegner));
	return frei[0] ?? null;
}
function abstand(a, b) {
	return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
function erreichbar(von, weite, block) {
	const gesehen = /* @__PURE__ */ new Set([index(von)]);
	let rand = [von];
	const treffer = [];
	for (let schritt = 0; schritt < weite; schritt += 1) {
		const naechste = [];
		for (const feld of rand) for (const nachbar of nachbarn(feld)) {
			const id = index(nachbar);
			if (gesehen.has(id) || istBau(nachbar) || block.some((item) => gleich(item, nachbar))) continue;
			gesehen.add(id);
			treffer.push(nachbar);
			naechste.push(nachbar);
		}
		rand = naechste;
	}
	return treffer;
}
function ziele(form, von, weite, gegner) {
	if (form === "nah") return nachbarn(von).filter((feld) => !istBau(feld));
	const liste = [];
	for (const richtung of RICHTUNG) for (let schritt = 1; schritt <= weite; schritt += 1) {
		const feld = {
			x: von.x + richtung.x * schritt,
			y: von.y + richtung.y * schritt
		};
		if (!imFeld(feld)) break;
		if (form === "schuss" && istBau(feld)) break;
		if (form === "schuss" && gleich(feld, gegner)) {
			liste.push(feld);
			break;
		}
		if (form === "bogen" && !istBau(feld)) liste.push(feld);
	}
	return liste;
}
function kannTreffen(form, von, weite, gegner) {
	return ziele(form, von, weite, gegner).some((feld) => gleich(feld, gegner));
}
var ZONE_NAME = {
	kopf: "Kopf",
	"arm-links": "Linker Arm",
	"arm-rechts": "Rechter Arm",
	koerper: "Körper",
	"bein-links": "Linkes Bein",
	"bein-rechts": "Rechtes Bein"
};
function w100(rng = Math.random) {
	return 1 + Math.floor(rng() * 100);
}
function istPasch(wurf) {
	return [
		11,
		22,
		33,
		44,
		55,
		66,
		77,
		88,
		99,
		100
	].includes(wurf);
}
function umdrehen(wurf) {
	const text = wurf === 100 ? "00" : String(wurf).padStart(2, "0");
	const rev = Number(text[1] + text[0]);
	return rev === 0 ? 100 : rev;
}
function zoneAusWurf(wurf) {
	const n = umdrehen(wurf);
	if (n <= 9) return "kopf";
	if (n <= 24) return "arm-links";
	if (n <= 44) return "arm-rechts";
	if (n <= 79) return "koerper";
	if (n <= 89) return "bein-links";
	return "bein-rechts";
}
function probe(fertigkeit, wurf) {
	const bestanden = wurf >= 96 ? false : wurf <= 5 ? true : wurf <= fertigkeit;
	const zehnerWurf = wurf === 100 ? 0 : Math.floor(wurf / 10);
	let sl = Math.floor(fertigkeit / 10) - zehnerWurf;
	if (bestanden && sl < 0) sl = 0;
	if (!bestanden && sl > 0) sl = -sl;
	return {
		wurf,
		fertigkeit,
		bestanden,
		sl,
		kritisch: bestanden && istPasch(wurf),
		patzer: !bestanden && istPasch(wurf)
	};
}
function vergleich(angriff, abwehr, waffe, widerstand, ruestung) {
	const gegen = abwehr?.sl ?? 0;
	const sl = angriff.sl - gegen;
	if (!(abwehr ? angriff.sl > abwehr.sl && !angriff.patzer : angriff.bestanden && !angriff.patzer)) return {
		getroffen: false,
		zone: null,
		sl,
		schaden: 0,
		wunden: 0,
		kritisch: false,
		patzer: angriff.patzer,
		werfer: angriff,
		abwehr,
		text: angriff.patzer ? `Patzer. Wurf ${angriff.wurf} gegen ${angriff.fertigkeit}.` : `Vorbei. Wurf ${angriff.wurf}, Erfolgsgrade ${angriff.sl} gegen ${gegen}.`
	};
	const zone = zoneAusWurf(angriff.wurf);
	const roh = sl + waffe - (widerstand + ruestung);
	const wunden = roh <= 0 ? 1 : roh;
	return {
		getroffen: true,
		zone,
		sl,
		schaden: roh,
		wunden,
		kritisch: angriff.kritisch,
		patzer: false,
		werfer: angriff,
		abwehr,
		text: `Wurf ${angriff.wurf} wird ${umdrehen(angriff.wurf)}, ${ZONE_NAME[zone]}. Erfolgsgrade ${sl}. Waffe ${waffe} minus Widerstand ${widerstand} und Rüstung ${ruestung}: ${wunden} Wunden.${angriff.kritisch ? " Kritisch." : ""}`
	};
}
var KRIT = {
	kopf: [
		{
			von: 1,
			bis: 10,
			name: "Riss",
			wunden: 1,
			tot: false,
			folge: "Blutung."
		},
		{
			von: 11,
			bis: 40,
			name: "Betäubt",
			wunden: 2,
			tot: false,
			folge: "Die nächste Runde hat 1 Aktion weniger."
		},
		{
			von: 41,
			bis: 70,
			name: "Schädel",
			wunden: 3,
			tot: false,
			folge: "Alle Proben −20, bis die Wunden wieder über 0 sind."
		},
		{
			von: 71,
			bis: 90,
			name: "Bewusstlos",
			wunden: 4,
			tot: false,
			folge: "Keine Aktion, bis eine Runde vergeht."
		},
		{
			von: 91,
			bis: 100,
			name: "Zerbrochen",
			wunden: 0,
			tot: true,
			folge: "Der Kopf hält das nicht aus."
		}
	],
	"arm-links": arm(),
	"arm-rechts": arm(),
	koerper: [
		{
			von: 1,
			bis: 10,
			name: "Kratzer",
			wunden: 1,
			tot: false,
			folge: "Blutung."
		},
		{
			von: 11,
			bis: 40,
			name: "Bauch",
			wunden: 2,
			tot: false,
			folge: "Betäubt. Die nächste Runde hat 1 Aktion weniger."
		},
		{
			von: 41,
			bis: 70,
			name: "Rippen",
			wunden: 3,
			tot: false,
			folge: "Bewegung −1 für den Rest des Kampfes."
		},
		{
			von: 71,
			bis: 90,
			name: "Durchstoßen",
			wunden: 5,
			tot: false,
			folge: "Keine Aktion in der nächsten Runde."
		},
		{
			von: 91,
			bis: 100,
			name: "Zertrennt",
			wunden: 0,
			tot: true,
			folge: "Der Körper gibt nach."
		}
	],
	"bein-links": bein(),
	"bein-rechts": bein()
};
function arm() {
	return [
		{
			von: 1,
			bis: 10,
			name: "Prellung",
			wunden: 1,
			tot: false,
			folge: "Die Waffe sitzt schief. Nächster Angriff −10."
		},
		{
			von: 11,
			bis: 40,
			name: "Schnitt",
			wunden: 1,
			tot: false,
			folge: "Blutung."
		},
		{
			von: 41,
			bis: 70,
			name: "Verrenkt",
			wunden: 2,
			tot: false,
			folge: "Angriffe −20 für den Rest des Kampfes."
		},
		{
			von: 71,
			bis: 90,
			name: "Gebrochen",
			wunden: 3,
			tot: false,
			folge: "Dieser Arm schlägt nicht mehr."
		},
		{
			von: 91,
			bis: 100,
			name: "Abgetrennt",
			wunden: 0,
			tot: true,
			folge: "Der Arm ist verloren, der Kämpfer fällt."
		}
	];
}
function bein() {
	return [
		{
			von: 1,
			bis: 10,
			name: "Tritt",
			wunden: 1,
			tot: false,
			folge: "Einen Schritt zurück."
		},
		{
			von: 11,
			bis: 40,
			name: "Schnitt",
			wunden: 1,
			tot: false,
			folge: "Blutung. Bewegung −1."
		},
		{
			von: 41,
			bis: 70,
			name: "Gelenk",
			wunden: 2,
			tot: false,
			folge: "Bewegung halbiert, mindestens 1."
		},
		{
			von: 71,
			bis: 90,
			name: "Bruch",
			wunden: 3,
			tot: false,
			folge: "Kann nicht mehr gehen, nur noch schlagen, wenn jemand herankommt."
		},
		{
			von: 91,
			bis: 100,
			name: "Zerschmettert",
			wunden: 0,
			tot: true,
			folge: "Das Bein trägt nicht mehr."
		}
	];
}
function kritZeile(zone, wurf) {
	const n = wurf === 100 ? 100 : wurf;
	return KRIT[zone].find((row) => n >= row.von && n <= row.bis) ?? KRIT[zone][0];
}
var PATZER = [
	{
		von: 1,
		bis: 20,
		name: "Eigenhieb",
		folge: "1 Wunde, Rüstung zählt nicht."
	},
	{
		von: 21,
		bis: 40,
		name: "Verhakt",
		folge: "Die nächste Runde hat 1 Aktion weniger."
	},
	{
		von: 41,
		bis: 60,
		name: "Stolpern",
		folge: "Ein Feld zurück, weg vom Gegner."
	},
	{
		von: 61,
		bis: 80,
		name: "Bloßgelegt",
		folge: "Die nächste Abwehr ist um 20 schlechter."
	},
	{
		von: 81,
		bis: 99,
		name: "Gestürzt",
		folge: "Liegt. Aufstehen kostet die nächste Bewegung."
	},
	{
		von: 100,
		bis: 100,
		name: "Waffe hin",
		folge: "Jeder weitere Angriff in diesem Kampf ist um 20 schlechter."
	}
];
function patzerZeile(wurf) {
	const n = wurf === 100 ? 100 : wurf;
	return PATZER.find((row) => n >= row.von && n <= row.bis) ?? PATZER[0];
}
function kaempfer(id, seite, feld) {
	const c = charakter(id);
	return {
		id,
		name: c.name,
		seite,
		feld,
		wunden: c.wunden,
		wundenMax: c.wunden,
		vorteil: 0,
		abwehr: "keine",
		malusAngriff: 0,
		malusAbwehr: 0,
		malusBewegung: 0,
		liegt: false,
		blutung: false,
		armHin: false,
		beinHin: false,
		bewusstlos: 0,
		wenigerAktionen: 0,
		waffeHin: false,
		zoneWahl: id === "archivar"
	};
}
function neuerKampf(a, b, rng = Math.random) {
	return {
		kaempfer: {
			A: kaempfer(a, "A", {
				x: 1,
				y: 6
			}),
			B: kaempfer(b, "B", {
				x: 6,
				y: 1
			})
		},
		amZug: "A",
		punkte: 2,
		eingehend: null,
		angesetzt: null,
		log: ["Beide stehen. Die Form auf der Karte zeigt, wo ein Schlag treffen kann."],
		blick: null,
		vorbei: false,
		sieger: null,
		rng
	};
}
function andere(seite) {
	return seite === "A" ? "B" : "A";
}
function bewegung(k) {
	const c = charakter(k.id);
	let weite = Math.max(1, c.bewegung - k.malusBewegung);
	if (k.beinHin) weite = 0;
	return weite;
}
function laufFelder(state, seite) {
	const k = state.kaempfer[seite];
	if (k.liegt || k.bewusstlos > 0 || state.vorbei) return [];
	const gegner = state.kaempfer[andere(seite)].feld;
	return erreichbar(k.feld, bewegung(k), [gegner]);
}
function schlagFelder(state, seite) {
	const k = state.kaempfer[seite];
	if (k.liegt || k.armHin || k.bewusstlos > 0 || state.vorbei) return [];
	const c = charakter(k.id);
	const gegner = state.kaempfer[andere(seite)].feld;
	return ziele(c.form, k.feld, c.reichweite, gegner);
}
function kann(state, art) {
	if (state.vorbei || state.punkte <= 0 && art !== "passen") return false;
	const k = state.kaempfer[state.amZug];
	if (k.bewusstlos > 0) return art === "passen";
	if (art === "passen") return true;
	if (art === "bewegen") return state.punkte >= 1 && (k.liegt || laufFelder(state, state.amZug).length > 0);
	if (art === "schlagen") return state.punkte >= 1 && schlagFelder(state, state.amZug).some((feld) => gleich(feld, state.kaempfer[andere(state.amZug)].feld));
	if (art === "parieren" || art === "ausweichen") return state.punkte >= 1 && k.abwehr === "keine";
	return false;
}
function bewegen(state, feld) {
	if (!kann(state, "bewegen")) return state;
	const next = klon(state);
	const k = next.kaempfer[next.amZug];
	if (k.liegt) {
		k.liegt = false;
		next.punkte -= 1;
		next.log.unshift(`${k.name} steht auf.`);
		return next;
	}
	if (!laufFelder(next, next.amZug).some((item) => gleich(item, feld))) return state;
	k.feld = feld;
	next.punkte -= 1;
	next.log.unshift(`${k.name} geht nach ${feld.x + 1},${feld.y + 1}.`);
	if (next.punkte <= 0) return abschluss(next);
	return next;
}
function abwehrWaehlen(state, art) {
	if (!kann(state, art)) return state;
	const next = klon(state);
	next.kaempfer[next.amZug].abwehr = art;
	next.punkte -= 1;
	next.log.unshift(`${next.kaempfer[next.amZug].name} setzt auf ${art === "parieren" ? "Parieren" : "Ausweichen"}.`);
	if (next.punkte <= 0) return abschluss(next);
	return next;
}
function ankuendigen(state, zone = null) {
	if (!kann(state, "schlagen")) return state;
	const next = klon(state);
	const k = next.kaempfer[next.amZug];
	const gegnerSeite = andere(next.amZug);
	const zoneFest = zone && k.zoneWahl ? zone : null;
	if (zoneFest) k.zoneWahl = false;
	next.punkte -= 1;
	schlagAufloesen(next, next.amZug, gegnerSeite, zoneFest);
	if (next.vorbei || next.punkte <= 0) return next.vorbei ? next : abschluss(next);
	return next;
}
function passen(state) {
	if (state.vorbei) return state;
	return abschluss(klon(state));
}
function abschluss(state) {
	if (state.vorbei) return state;
	const naechste = andere(state.amZug);
	state.amZug = naechste;
	const k = state.kaempfer[naechste];
	k.abwehr = "keine";
	if (k.blutung && k.wunden > 0) {
		k.wunden -= 1;
		state.log.unshift(`${k.name} blutet. 1 Wunde.`);
		if (k.wunden <= 0) fallen(state, k, "Die Blutung entscheidet.");
	}
	if (k.bewusstlos > 0) {
		k.bewusstlos -= 1;
		state.log.unshift(k.bewusstlos > 0 ? `${k.name} ist bewusstlos.` : `${k.name} kommt zu sich.`);
	}
	state.punkte = k.bewusstlos > 0 ? 0 : Math.max(0, 2 - k.wenigerAktionen);
	k.wenigerAktionen = 0;
	if (state.punkte === 0 && !state.vorbei) return abschluss(state);
	return state;
}
function schlagAufloesen(state, von, nach, festeZone) {
	const a = state.kaempfer[von];
	const b = state.kaempfer[nach];
	const ac = charakter(a.id);
	const fertigkeit = (ac.form === "nah" ? ac.ws : ac.bs) - a.malusAngriff - (a.waffeHin ? 20 : 0);
	const wurf = w100(state.rng);
	const angriff = probe(Math.max(5, Math.min(95, fertigkeit)), wurf);
	angriff.sl += Math.min(3, a.vorteil);
	let abwehrProbe = null;
	if (b.abwehr !== "keine") {
		const bc = charakter(b.id);
		const wert = (b.abwehr === "parieren" ? bc.ws : bc.ausweichen) - b.malusAbwehr;
		abwehrProbe = probe(Math.max(5, Math.min(95, wert)), w100(state.rng));
	}
	const waffe = ac.form === "nah" ? ac.waffe + ac.staerke : ac.waffe;
	const treffer = vergleich(angriff, abwehrProbe, waffe, charakter(b.id).widerstand, 0);
	if (!treffer.getroffen || !treffer.zone) {
		a.vorteil = 0;
		const art = b.abwehr === "parieren" ? "pariert" : b.abwehr === "ausweichen" ? "ausgewichen" : treffer.patzer ? "patzer" : "daneben";
		state.blick = {
			angreifer: a.id,
			ziel: b.id,
			art,
			text: treffer.text
		};
		state.log.unshift(`${a.name}: ${treffer.text}`);
		if (treffer.patzer) patzerAnwenden(state, a);
		return;
	}
	const zone = festeZone ?? treffer.zone;
	const ruestung = charakter(b.id).ruestung[zone];
	const korrigiert = vergleich(angriff, abwehrProbe, waffe, charakter(b.id).widerstand, ruestung);
	korrigiert.zone = zone;
	b.wunden -= korrigiert.wunden;
	a.vorteil = Math.min(3, a.vorteil + 1);
	b.vorteil = 0;
	state.blick = {
		angreifer: a.id,
		ziel: b.id,
		art: "treffer",
		text: korrigiert.text
	};
	state.log.unshift(`${a.name} gegen ${b.name}: ${korrigiert.text}`);
	if (korrigiert.kritisch) kritischAnwenden(state, b, zone);
	if (b.wunden <= 0) fallen(state, b, "Die Wunden sind auf 0.");
}
function kritischAnwenden(state, ziel, zone) {
	const wurf = w100(state.rng);
	const zeile = kritZeile(zone, wurf);
	if (zeile.wunden > 0) ziel.wunden -= zeile.wunden;
	if (/Blutung/.test(zeile.folge)) ziel.blutung = true;
	if (/Aktion weniger/.test(zeile.folge)) ziel.wenigerAktionen += 1;
	if (/−20|−10/.test(zeile.folge)) ziel.malusAngriff += /−20/.test(zeile.folge) ? 20 : 10;
	if (/Bewegung −1/.test(zeile.folge)) ziel.malusBewegung += 1;
	if (/halbiert/.test(zeile.folge)) ziel.malusBewegung += 2;
	if (/nicht mehr gehen/.test(zeile.folge)) ziel.beinHin = true;
	if (/schlägt nicht mehr/.test(zeile.folge)) ziel.armHin = true;
	if (/Keine Aktion/.test(zeile.folge)) ziel.bewusstlos = Math.max(ziel.bewusstlos, 1);
	if (/zurück/.test(zeile.folge)) {
		const weg = schrittZurueck(ziel.feld, state.kaempfer[andere(ziel.seite)].feld);
		if (weg) ziel.feld = weg;
	}
	state.log.unshift(`Kritisch ${zeile.name} (${wurf}). ${zeile.folge}`);
	if (zeile.tot) fallen(state, ziel, zeile.folge);
}
function patzerAnwenden(state, wer) {
	const wurf = w100(state.rng);
	const zeile = patzerZeile(wurf);
	if (zeile.name === "Eigenhieb") wer.wunden -= 1;
	if (zeile.name === "Verhakt") wer.wenigerAktionen += 1;
	if (zeile.name === "Stolpern") {
		const weg = schrittZurueck(wer.feld, state.kaempfer[andere(wer.seite)].feld);
		if (weg) wer.feld = weg;
	}
	if (zeile.name === "Bloßgelegt") wer.malusAbwehr += 20;
	if (zeile.name === "Gestürzt") wer.liegt = true;
	if (zeile.name === "Waffe hin") wer.waffeHin = true;
	state.log.unshift(`Patzer ${zeile.name} (${wurf}). ${zeile.folge}`);
	if (wer.wunden <= 0) fallen(state, wer, "Der Patzer war genug.");
}
function fallen(state, wer, grund) {
	wer.wunden = Math.min(wer.wunden, 0);
	state.vorbei = true;
	state.sieger = andere(wer.seite);
	state.punkte = 0;
	state.blick = {
		angreifer: state.kaempfer[andere(wer.seite)].id,
		ziel: wer.id,
		art: "gebrochen",
		text: grund
	};
	state.log.unshift(`${wer.name} fällt. ${grund}`);
}
function klon(state) {
	return {
		...state,
		kaempfer: {
			A: {
				...state.kaempfer.A,
				feld: { ...state.kaempfer.A.feld }
			},
			B: {
				...state.kaempfer.B,
				feld: { ...state.kaempfer.B.feld }
			}
		},
		eingehend: state.eingehend ? {
			...state.eingehend,
			feld: { ...state.eingehend.feld }
		} : null,
		angesetzt: state.angesetzt ? {
			...state.angesetzt,
			feld: { ...state.angesetzt.feld }
		} : null,
		log: [...state.log],
		blick: state.blick
	};
}
function bot(state) {
	const seite = state.amZug;
	let next = state;
	const noch = () => next.amZug === seite && !next.vorbei;
	const gegner = () => next.kaempfer[andere(seite)];
	const ich = () => next.kaempfer[seite];
	let geschlagen = false;
	let gewichen = false;
	while (noch()) {
		const c = charakter(ich().id);
		if (!geschlagen && kann(next, "schlagen")) {
			next = ankuendigen(next, null);
			geschlagen = true;
			continue;
		}
		if (geschlagen && !gewichen && c.bewegung >= 5 && kann(next, "bewegen")) {
			gewichen = true;
			const weit = laufFelder(next, seite).sort((a, b) => abstand(b, gegner().feld) - abstand(a, gegner().feld))[0];
			if (weit && abstand(weit, gegner().feld) >= 4) next = bewegen(next, weit);
			break;
		}
		if (kann(next, "schlagen")) {
			next = ankuendigen(next, null);
			continue;
		}
		if (gegnerTrifft(next, seite, ich().feld)) {
			const fertig = c.ausweichen > c.ws ? c.ausweichen : c.ws;
			if (fertig >= 45 && c.ausweichen > c.ws && kann(next, "ausweichen")) {
				next = abwehrWaehlen(next, "ausweichen");
				continue;
			}
			if (fertig >= 45 && kann(next, "parieren")) {
				next = abwehrWaehlen(next, "parieren");
				continue;
			}
		}
		if (!kann(next, "bewegen")) break;
		const schritte = laufFelder(next, seite);
		const nah = charakter(gegner().id).form === "nah";
		const treffend = schritte.filter((feld) => kannTreffen(c.form, feld, c.reichweite, gegner().feld));
		const ziel = (treffend.length ? treffend : schritte).sort((a, b) => {
			const da = abstand(a, gegner().feld);
			const db = abstand(b, gegner().feld);
			if (c.form !== "nah" && nah) return db - da;
			return da - db;
		})[0];
		if (!ziel) break;
		const vorher = ich().feld;
		next = bewegen(next, ziel);
		if (gleich(vorher, ich().feld)) break;
	}
	if (noch()) next = passen(next);
	return next;
}
function gegnerTrifft(state, seite, feld) {
	const gegner = state.kaempfer[andere(seite)];
	const c = charakter(gegner.id);
	return kannTreffen(c.form, gegner.feld, c.reichweite, feld);
}
function imMuster(state, seite, feld) {
	return gegnerTrifft(state, seite, feld);
}
function bedroht(state, seite) {
	return gegnerTrifft(state, seite, state.kaempfer[seite].feld);
}
var WAFFE = {
	brecher: "hammer",
	jaeger: "bogen",
	laeuferin: "kurzschwert",
	archivar: "kette",
	waechter: "speer"
};
function platte(id, datei) {
	if ((id === "brecher" || id === "jaeger") && datei.endsWith(".jpg") && datei.includes("_")) return `/kampf/hd/${id}/${datei}`;
	return `/kampf/v2/${id}/${datei}`;
}
function sequenz(id, gegnerIstZiel, art) {
	const klassisch = id === "brecher" || id === "jaeger";
	const bereit = klassisch ? "01_gegenueber.jpg" : `${WAFFE[id]}.jpg`;
	const holen = klassisch ? id === "jaeger" ? "03_anlegen.jpg" : "02_ausholen.jpg" : `${WAFFE[id]}.jpg`;
	const schuss = klassisch ? id === "jaeger" ? "11_schuss.jpg" : "02_ausholen.jpg" : `${WAFFE[id]}.jpg`;
	let ende = bereit;
	if (!art) ende = bereit;
	else if (art === "gebrochen") ende = klassisch ? "13_zusammenbruch.jpg" : "gebrochen.jpg";
	else if (gegnerIstZiel && art === "treffer") ende = klassisch ? "06_koerper.jpg" : "offen.jpg";
	else if (gegnerIstZiel && art === "pariert") ende = klassisch ? "08_block.jpg" : "block.jpg";
	else if (gegnerIstZiel && (art === "ausgewichen" || art === "daneben")) ende = klassisch ? art === "ausgewichen" ? "09_ausweichen.jpg" : "04_verfehlen.jpg" : "ausweichen.jpg";
	else if (!gegnerIstZiel && art === "treffer") ende = schuss;
	else if (!gegnerIstZiel && (art === "daneben" || art === "ausgewichen" || art === "pariert" || art === "patzer")) ende = klassisch ? "04_verfehlen.jpg" : "ausweichen.jpg";
	else if (art === "patzer") ende = klassisch ? "04_verfehlen.jpg" : "offen.jpg";
	return [
		platte(id, bereit),
		platte(id, holen),
		platte(id, ende)
	];
}
function SpielerBlick({ blick, gegner }) {
	const [frame, setFrame] = (0, import_react.useState)(0);
	const bilder = sequenz(gegner, !blick || blick.ziel === gegner, blick?.art ?? null);
	const key = `${gegner}-${blick?.text ?? "bereit"}`;
	(0, import_react.useEffect)(() => {
		setFrame(0);
	}, [key]);
	(0, import_react.useEffect)(() => {
		if (frame >= bilder.length - 1) return;
		const timer = window.setTimeout(() => setFrame((aktuell) => aktuell + 1), 680);
		return () => window.clearTimeout(timer);
	}, [
		frame,
		bilder.length,
		key
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
		className: "relative overflow-hidden rounded-2xl border border-white/10 bg-black",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: bilder[frame],
			alt: "",
			className: "plate-in scene-drift aspect-video w-full object-cover"
		}, `${key}-${frame}`), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figcaption", {
			className: "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[10px] uppercase tracking-wide text-white/60",
				children: "Deine Sicht"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-white",
				children: blick?.text ?? "Er steht dir gegenüber."
			})]
		})]
	});
}
var ZONEN = [
	"kopf",
	"arm-links",
	"arm-rechts",
	"koerper",
	"bein-links",
	"bein-rechts"
];
function BreachApp({ onArchiv }) {
	const [kampf, setKampf] = (0, import_react.useState)(null);
	const [a, setA] = (0, import_react.useState)("brecher");
	const [b, setB] = (0, import_react.useState)("jaeger");
	const [modus, setModus] = (0, import_react.useState)("bot");
	const [wahl, setWahl] = (0, import_react.useState)(null);
	const [zone, setZone] = (0, import_react.useState)("koerper");
	(0, import_react.useEffect)(() => {
		if (!kampf || kampf.vorbei || modus !== "bot" || kampf.amZug !== "B") return;
		const timer = window.setTimeout(() => setKampf(bot(kampf)), 1500);
		return () => window.clearTimeout(timer);
	}, [kampf, modus]);
	if (!kampf) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-4 py-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs uppercase tracking-wide text-muted",
				children: "Neues Kampfsystem"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "display text-4xl",
				children: "Gitter und W100"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Acht mal acht Felder. Schlagen würfelt sofort mit einem W100. Die Zone ist der umgedrehte Wurf. Die Szene zeigt nur, was du siehst."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wahl, {
					label: "Du",
					value: a,
					onChange: setA
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wahl, {
					label: "Gegenüber",
					value: b,
					onChange: setB
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: `btn ${modus === "bot" ? "btn-on" : ""}`,
					onClick: () => setModus("bot"),
					children: "Gegen den Bot"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: `btn ${modus === "gegen" ? "btn-on" : ""}`,
					onClick: () => setModus("gegen"),
					children: "Zu zweit"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn btn-primary",
				onClick: () => setKampf(neuerKampf(a, b)),
				children: "Kampf beginnen"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn",
				onClick: onArchiv,
				children: "Altes System"
			})
		]
	});
	const seite = kampf.amZug;
	const ich = kampf.kaempfer[seite];
	const duBist = modus === "bot" && seite === "B";
	const laufen = wahl === "bewegen" ? laufFelder(kampf, seite) : [];
	const zielen = schlagFelder(kampf, seite);
	const c = charakter(ich.id);
	function waehleFeld(feld) {
		if (duBist || kampf.vorbei) return;
		if (wahl === "bewegen") {
			setKampf(bewegen(kampf, feld));
			setWahl(null);
		}
	}
	const auge = modus === "bot" ? "A" : seite;
	const gegnerId = kampf.kaempfer[auge === "A" ? "B" : "A"].id;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-dvh max-w-6xl flex-col gap-4 px-3 py-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex flex-wrap items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs uppercase tracking-wide text-muted",
					children: "Am Zug"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "display text-3xl",
					children: ich.name
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn",
						onClick: () => setKampf(null),
						children: "Neu"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn",
						onClick: onArchiv,
						children: "Archiv"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SpielerBlick, {
				blick: kampf.blick,
				gegner: gegnerId
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-8 gap-1",
					children: Array.from({ length: 64 }, (_, id) => {
						const feld = vonIndex(id);
						const aDa = gleich(kampf.kaempfer.A.feld, feld);
						const bDa = gleich(kampf.kaempfer.B.feld, feld);
						const bau = istBau(feld);
						const ziel = imMuster(kampf, seite, feld);
						const lauf = laufen.some((item) => gleich(item, feld));
						const inForm = zielen.some((item) => gleich(item, feld));
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							disabled: !lauf,
							onClick: () => waehleFeld(feld),
							className: `relative aspect-square rounded-md border text-xs ${bau ? "border-transparent bg-raised" : "border-line bg-surface"} ${ziel ? "ring-2 ring-accent" : ""} ${lauf ? "ring-2 ring-soft" : ""} ${inForm && !bau ? "outline outline-1 outline-white/30" : ""}`,
							children: [
								aDa && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "display text-lg",
									children: "A"
								}),
								bDa && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "display text-lg text-accent",
									children: "B"
								}),
								bau && !aDa && !bDa && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] text-faint",
									children: "Bau"
								})
							]
						}, id);
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-xs text-muted",
					children: bedroht(kampf, seite) ? "Du stehst in der Form des anderen. Ausweichen oder Parieren gilt für den nächsten Schlag." : "Die umrandeten Felder sind die Form des Gegners. Schlagen würfelt sofort, wenn du ihn darin hast."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: "flex flex-col gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Karte, {
							seite: "A",
							kampf
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Karte, {
							seite: "B",
							kampf
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted",
							children: [
								"Aktionen: ",
								kampf.punkte,
								". ",
								c.zeile
							]
						}),
						ich.zoneWahl && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "text-xs text-muted",
							children: ["Zone festlegen", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								className: "btn mt-1 w-full",
								value: zone,
								onChange: (event) => setZone(event.target.value),
								children: ZONEN.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: item,
									children: ZONE_NAME[item]
								}, item))
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-2 gap-2",
							children: AKTIONEN.map((aktion) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								disabled: duBist || !kann(kampf, aktion.id),
								className: `btn h-auto flex-col items-start py-2 text-left ${wahl === aktion.id ? "btn-on" : ""}`,
								onClick: () => {
									if (aktion.id === "bewegen") setWahl(wahl === "bewegen" ? null : "bewegen");
									if (aktion.id === "schlagen") {
										setKampf(ankuendigen(kampf, ich.zoneWahl ? zone : null));
										setWahl(null);
									}
									if (aktion.id === "parieren" || aktion.id === "ausweichen") setKampf(abwehrWaehlen(kampf, aktion.id));
									if (aktion.id === "passen") setKampf(passen(kampf));
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: aktion.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-faint",
									children: aktion.text
								})]
							}, aktion.id))
						}),
						kampf.vorbei && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "display text-2xl",
							children: kampf.sieger ? `${kampf.kaempfer[kampf.sieger].name} steht.` : "Unentschieden"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "panel max-h-48 overflow-auto p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[10px] uppercase tracking-wide text-faint",
					children: FOLGE[Math.min(4, 4 - kampf.punkte)]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "mt-2 flex flex-col gap-1 text-sm text-muted",
					children: kampf.log.slice(0, 8).map((zeile, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: zeile }, `${i}-${zeile}`))
				})]
			})
		]
	});
}
function Wahl({ label, value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "text-sm",
		children: [label, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
			className: "btn mt-1 w-full",
			value,
			onChange: (event) => onChange(event.target.value),
			children: CHARAKTERE.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
				value: item.id,
				children: [
					item.name,
					" · ",
					item.zeile
				]
			}, item.id))
		})]
	});
}
function Karte({ seite, kampf }) {
	const k = kampf.kaempfer[seite];
	const c = charakter(k.id);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: `panel p-3 ${kampf.amZug === seite ? "ring-1 ring-white/40" : ""}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-baseline justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "display text-xl",
					children: k.name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted",
					children: seite
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs tabular-nums text-muted",
				children: [
					k.wunden,
					"/",
					k.wundenMax,
					" Wunden · Vorteil ",
					k.vorteil,
					" · ",
					c.form === "nah" ? `WS ${c.ws}` : `BS ${c.bs}`
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs text-faint",
				children: [
					k.abwehr !== "keine" ? k.abwehr : "keine Abwehr",
					k.liegt ? " · liegt" : "",
					k.blutung ? " · blutet" : ""
				]
			})
		]
	});
}
var CHARACTERS = [
	{
		id: "brecher",
		name: "Brecher",
		line: "Schwerer Treffer",
		kraft: 8,
		schutz: 5,
		bewegung: 2,
		kontrolle: 2,
		tempo: 3,
		cores: [
			"attack",
			"attack",
			"guard"
		],
		passive: "Ab 5 Endschaden erhält das Ziel 1 zusätzlichen Bruch.",
		ability: "Aufbrechen",
		abilityCost: 3,
		abilityAction: "attack",
		abilityText: "Angriff, Reichweite 1. Treffer: +2 Rohschaden, Schutz endet, ein Schutz-Echo verliert 1 Ladung."
	},
	{
		id: "laeuferin",
		name: "Läuferin",
		line: "Durchgang",
		kraft: 5,
		schutz: 5,
		bewegung: 8,
		kontrolle: 5,
		tempo: 8,
		cores: [
			"move",
			"move",
			"influence"
		],
		passive: "Ignoriert den ersten negativen Feldmarker, den sie in der Runde betritt. Hat sie einmal ausgewichen, tragen ihre Angriffe in diesem Kampf +2 Rohschaden und ignorieren 2 Schutzbonus und 2 Rüstung.",
		ability: "Seitenwechsel",
		abilityCost: 2,
		abilityAction: "move",
		abilityText: "Ausweichen, ohne das Feld zu wechseln. Danach ein Bewegungs-Echo mit 1 Ladung. Der Schritt öffnet den nächsten Angriff."
	},
	{
		id: "archivar",
		name: "Archivar",
		line: "Speichern",
		kraft: 3,
		schutz: 6,
		bewegung: 4,
		kontrolle: 9,
		tempo: 4,
		cores: [
			"influence",
			"guard",
			"move"
		],
		passive: "Ein durch Einfluss ohne Item erzeugtes Echo erhält 1 zusätzliche Ladung. Ein eigenes Echo auf dem Feld gibt +2 Verteidigung und gibt einen Treffer als 1 Bruch zurück. Der erste Treffer des Kampfes ist auf 2 Körper gedeckelt und legt ein Schutz-Echo mit 2 Ladungen.",
		ability: "Verbindung",
		abilityCost: 3,
		abilityAction: "influence",
		abilityText: "Zwei eigene Echos verstärken sich um 1 Ladung und gelten diese Runde als benutzt. Fehlen sie, entsteht zuerst ein Schutz-Echo mit 2 Ladungen."
	},
	{
		id: "waechter",
		name: "Wächter",
		line: "Standhalten",
		kraft: 4,
		schutz: 8,
		bewegung: 2,
		kontrolle: 5,
		tempo: 2,
		cores: [
			"guard",
			"guard",
			"influence"
		],
		passive: "Gegnerische Fähigkeiten verschieben höchstens um 2 Felder. Der erste Treffer jeder Runde ist um den Schutzbonus niedriger, mindestens 2.",
		ability: "Sperre",
		abilityCost: 2,
		abilityAction: "guard",
		abilityText: "Schutzmarker auf dem eigenen Feld und bis zum Rundenende +1 Schutzbonus."
	},
	{
		id: "jaeger",
		name: "Jäger",
		line: "Verfolgen",
		kraft: 7,
		schutz: 4,
		bewegung: 5,
		kontrolle: 4,
		tempo: 7,
		cores: [
			"attack",
			"move",
			"influence"
		],
		passive: "Verlässt der Gegner sein Feld, +1 Angriffswert gegen ihn bis zum Rundenende. Der erste Treffer des Kampfes ist auf 2 Körper gedeckelt.",
		ability: "Markieren",
		abilityCost: 1,
		abilityAction: "influence",
		abilityText: "Ziel in Reichweite 3 markieren. Der nächste Angriff: +2 Angriffswert, ignoriert die Rüstung, Angriffs-Echo mit 2 Ladungen."
	}
];
var WEAPONS = [
	{
		id: "kurzschwert",
		name: "Kurzschwert",
		value: 3,
		range: 1,
		tempo: 2,
		text: "Nach Treffer 1 Feld zurück. Keine Angriffe durch Barrieren."
	},
	{
		id: "hammer",
		name: "Schwerer Hammer",
		value: 6,
		range: 1,
		tempo: -2,
		text: "Treffer: +1 Bruch. Verfehlt: Träger +1 Bruch."
	},
	{
		id: "speer",
		name: "Speer",
		value: 4,
		range: 2,
		tempo: 0,
		text: "Darf durch einen Kämpfer hindurch treffen. Ignoriert den Bewegungsbonus. Auf demselben Feld −1 Rohschaden."
	},
	{
		id: "bogen",
		name: "Bogen",
		value: 4,
		range: 3,
		tempo: 1,
		text: "Ignoriert den ersten Bewegungsbonus des Ziels. Aus der Distanz ignoriert 2 Rüstung. Nicht bei Gebunden."
	},
	{
		id: "kette",
		name: "Kettenklinge",
		value: 3,
		range: 2,
		tempo: 1,
		text: "Bei Treffer das Ziel 1 Feld näher ziehen, kostet 1 Energie."
	}
];
var ARMORS = [
	{
		id: "leder",
		name: "Leder",
		value: 1,
		body: 1,
		tempo: 1,
		kontrolle: 0,
		text: "Die erste Bewegung der Runde kostet 1 Energie weniger."
	},
	{
		id: "ketten",
		name: "Kettenrüstung",
		value: 2,
		body: 3,
		tempo: -1,
		kontrolle: 0,
		text: "Der erste Bruch der Runde ist um 1 niedriger."
	},
	{
		id: "platte",
		name: "Plattenrüstung",
		value: 3,
		body: 5,
		tempo: -2,
		kontrolle: 0,
		text: "Höchstens 1 Feld verschoben. Bewegungsweite −1."
	},
	{
		id: "spiegel",
		name: "Spiegelfaser",
		value: 1,
		body: 1,
		tempo: 0,
		kontrolle: 1,
		text: "Einmal pro Runde +1 Verteidigung gegen einen Echo-Angriff."
	}
];
var GEAR = [
	{
		id: "greifhaken",
		name: "Greifhaken",
		slot: "tool",
		text: "Bewegungsbonus +1, Tempo +1, +1 Feld Weite."
	},
	{
		id: "rauch",
		name: "Rauchkapsel",
		slot: "tool",
		text: "Kontrollbonus +1. Nebel auf dem eigenen Feld, 2 Energie."
	},
	{
		id: "brecheisen",
		name: "Brecheisen",
		slot: "tool",
		text: "Kraftbonus +1. Einfluss gegen Barrieren und Schutzmarker trifft doppelt."
	},
	{
		id: "anker",
		name: "Ankerring",
		slot: "tool",
		text: "Schutzbonus +1, Bewegungsbonus −1. Nicht durch gegnerische Züge verschiebbar."
	},
	{
		id: "spiegelkern",
		name: "Spiegelkern",
		slot: "artifact",
		text: "Kontrolle +2, maximale Energie −1. Einmal ohne Energie umwandeln."
	},
	{
		id: "zeitnadel",
		name: "Zeitnadel",
		slot: "artifact",
		text: "Tempo +2, Körper −2. Einmal pro Kampf +2 Aktionswert."
	},
	{
		id: "bruchstein",
		name: "Bruchstein",
		slot: "artifact",
		text: "Bruchmaximum +2, Kontrolle −1. Einmal pro Runde 1 Bruch gegen 2 Energie."
	},
	{
		id: "maske",
		name: "Leere Maske",
		slot: "artifact",
		text: "Bewegungsbonus +1, Kontrolle +1. Einmal das Ziel um ein Feld verschieben."
	}
];
var ITEMS = [
	{
		id: "heil",
		name: "Heilmittel",
		text: "4 Körper. Entfernt Verletzt."
	},
	{
		id: "zelle",
		name: "Energiezelle",
		text: "3 Energie, nicht über das Maximum."
	},
	{
		id: "binde",
		name: "Bruchbinde",
		text: "2 Bruch weniger. Gebunden bis Ende der nächsten Runde."
	},
	{
		id: "splitter",
		name: "Echo-Splitter",
		text: "Ein eigenes Echo erhält 2 Ladungen, höchstens 3."
	},
	{
		id: "blend",
		name: "Blendpulver",
		text: "Ziel wird Verwirrt. Ist es das schon, 1 Bruch."
	}
];
var ACTIONS = [
	{
		id: "attack",
		name: "Angriff",
		tempo: 0,
		text: "Treffer nach Würfel und Kraft. Schaden ist die Waffe minus die Rüstung."
	},
	{
		id: "guard",
		name: "Schutz",
		tempo: -1,
		text: "Der nächste Treffer sinkt um den Schutzbonus, mindestens um 2."
	},
	{
		id: "move",
		name: "Ausweichen",
		tempo: 2,
		text: "Kein Stellungswechsel. Ein Treffer gegen dich ist um 2 niedriger."
	},
	{
		id: "influence",
		name: "Einfluss",
		tempo: 0,
		text: "Echos, Kerne und Spuren."
	}
];
var REACTIONS = [
	{
		id: "dodge",
		name: "Ausweichen",
		cost: 2,
		text: "Wenn du nicht schon ausgewichen bist: 2 Energie, 2 Schaden weniger. Kein Stellungswechsel."
	},
	{
		id: "riposte",
		name: "Gegenstoß",
		cost: 2,
		text: "Nach Treffer, wenn du Angriff gewählt hast: Gegenangriff, −2 Rohschaden, kein Krit."
	},
	{
		id: "stabilize",
		name: "Stabilisieren",
		cost: 1,
		text: "Wenn du mindestens 2 Bruch erhieltest: 1 verhindern. Nächste Runde −1 Energie."
	},
	{
		id: "secure",
		name: "Echo sichern",
		cost: 2,
		text: "Ein Echo, das zerstört würde, bleibt mit 1 Ladung. Du erhältst 1 Bruch."
	}
];
var EDGES = [
	[1, 2],
	[1, 3],
	[2, 3],
	[2, 4],
	[2, 5],
	[3, 4],
	[3, 5],
	[4, 5],
	[4, 6],
	[4, 7],
	[5, 6],
	[5, 7],
	[6, 7]
];
var POS = {
	1: [500, 160],
	2: [290, 400],
	3: [710, 400],
	4: [230, 700],
	5: [770, 700],
	6: [320, 1010],
	7: [680, 1010]
};
var STARTS = {
	A: [2, 4],
	B: [3, 5]
};
var ECHO_LABEL = {
	attack: "Angriff",
	guard: "Schutz",
	move: "Ausweichen",
	influence: "Einfluss",
	trap: "Falle",
	barrier: "Barriere",
	mist: "Nebel",
	rift: "Riss"
};
function byId(list, id) {
	const found = list.find((x) => x.id === id);
	if (!found) throw new Error(`Unbekannt: ${id}`);
	return found;
}
var SUGGESTED = {
	brecher: {
		weaponId: "hammer",
		armorId: "platte",
		toolId: "brecheisen",
		artifactId: "anker",
		items: ["heil", "binde"]
	},
	laeuferin: {
		weaponId: "kurzschwert",
		armorId: "leder",
		toolId: "greifhaken",
		artifactId: "maske",
		items: ["zelle", "blend"]
	},
	archivar: {
		weaponId: "kette",
		armorId: "spiegel",
		toolId: "rauch",
		artifactId: "spiegelkern",
		items: ["splitter", "zelle"]
	},
	waechter: {
		weaponId: "speer",
		armorId: "ketten",
		toolId: "anker",
		artifactId: "bruchstein",
		items: ["heil", "binde"]
	},
	jaeger: {
		weaponId: "bogen",
		armorId: "leder",
		toolId: "greifhaken",
		artifactId: "zeitnadel",
		items: ["blend", "splitter"]
	}
};
var NEIGHBORS = {};
for (let i = 1; i <= 7; i++) NEIGHBORS[i] = [];
for (const [a, b] of EDGES) {
	NEIGHBORS[a].push(b);
	NEIGHBORS[b].push(a);
}
function neighbors(id) {
	return NEIGHBORS[id];
}
function other(side) {
	return side === "A" ? "B" : "A";
}
function clone(value) {
	return JSON.parse(JSON.stringify(value));
}
function bonus(value) {
	if (value <= 2) return 0;
	if (value <= 4) return 1;
	if (value <= 6) return 2;
	if (value <= 8) return 3;
	return 4;
}
function roll(state) {
	state.seed = state.seed + 1831565813 | 0;
	let t = Math.imul(state.seed ^ state.seed >>> 15, 1 | state.seed);
	t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
	return ((t ^ t >>> 14) >>> 0) / 4294967296;
}
function d6(state) {
	return 1 + Math.floor(roll(state) * 6);
}
function uid(state, prefix) {
	state.nextId += 1;
	return `${prefix}${state.nextId}`;
}
function characterOf(id) {
	return byId(CHARACTERS, id);
}
function hasStatus(f, kind) {
	return f.statuses.some((s) => s.kind === kind);
}
function isOpen(f) {
	return f.bruch >= Math.ceil(f.bruchMax / 2) || hasStatus(f, "open");
}
function liveStats(f) {
	const c = characterOf(f.characterId);
	const weapon = byId(WEAPONS, f.weaponId);
	const armor = byId(ARMORS, f.armorId);
	let kraft = c.kraft;
	let schutz = c.schutz;
	let bewegung = c.bewegung;
	let kontrolle = c.kontrolle + armor.kontrolle;
	let tempo = c.tempo + weapon.tempo + armor.tempo;
	let kraftB = bonus(kraft);
	let schutzB = bonus(schutz) + f.guardBonus;
	let moveB = bonus(bewegung);
	let konB = bonus(kontrolle);
	let moveRange = 1 + Math.floor(bewegung / 3);
	if (f.armorId === "platte") moveRange -= 1;
	if (f.toolId === "greifhaken" || f.artifactId === "greifhaken") {
		moveB += 1;
		tempo += 1;
		moveRange += 1;
	}
	if (f.toolId === "rauch" || f.artifactId === "rauch") konB += 1;
	if (f.toolId === "brecheisen" || f.artifactId === "brecheisen") kraftB += 1;
	if (f.toolId === "anker" || f.artifactId === "anker") {
		schutzB += 1;
		moveB -= 1;
	}
	if (f.toolId === "spiegelkern" || f.artifactId === "spiegelkern") konB += 2;
	if (f.toolId === "zeitnadel" || f.artifactId === "zeitnadel") tempo += 2;
	if (f.toolId === "bruchstein" || f.artifactId === "bruchstein") konB -= 1;
	if (f.toolId === "maske" || f.artifactId === "maske") {
		moveB += 1;
		konB += 1;
	}
	if (f.toolId === "greifhaken") {}
	moveB = Math.max(0, moveB);
	konB = Math.max(0, konB);
	return {
		kraft,
		schutz,
		bewegung,
		kontrolle,
		tempo,
		kraftB,
		schutzB,
		moveB,
		konB,
		weapon: weapon.value,
		range: weapon.range,
		armor: armor.value,
		moveRange: Math.max(1, moveRange)
	};
}
function derivedMax(setup) {
	const c = characterOf(setup.characterId);
	const armor = byId(ARMORS, setup.armorId);
	const gear = [setup.toolId, setup.artifactId];
	let body = 12 + c.schutz + armor.body;
	let energy = 4 + Math.floor(c.bewegung / 3);
	let bruch = 4 + Math.floor(c.schutz / 2);
	if (gear.includes("spiegelkern")) energy -= 1;
	if (gear.includes("zeitnadel")) body -= 2;
	if (gear.includes("bruchstein")) bruch += 2;
	energy = Math.max(3, Math.min(8, energy));
	return {
		body,
		energy,
		bruch
	};
}
function suggestedSetup(characterId, side) {
	const kit = SUGGESTED[characterId];
	return {
		characterId,
		weaponId: kit.weaponId,
		armorId: kit.armorId,
		toolId: kit.toolId,
		artifactId: kit.artifactId,
		items: [...kit.items],
		field: side === "A" ? 2 : 5
	};
}
function createFighter(setup, side) {
	const max = derivedMax(setup);
	const c = characterOf(setup.characterId);
	const gear = [setup.toolId, setup.artifactId];
	return {
		side,
		characterId: setup.characterId,
		weaponId: setup.weaponId,
		armorId: setup.armorId,
		toolId: setup.toolId,
		artifactId: setup.artifactId,
		items: setup.items.map((id) => ({
			id,
			spent: false
		})),
		field: setup.field,
		body: max.body,
		bodyMax: max.body,
		energy: 2,
		energyMax: max.energy,
		bruch: 0,
		bruchMax: max.bruch,
		statuses: [],
		echoes: [],
		cores: c.cores.map((kind) => ({
			kind,
			points: 3,
			revealed: false
		})),
		lastAction: null,
		pattern: {
			attack: 0,
			guard: 0,
			move: 0,
			influence: 0
		},
		ruleBreak: true,
		collapse: false,
		stabilizeNext: false,
		marked: false,
		pursued: false,
		guardBonus: 0,
		abilityRound: 0,
		stoneRound: 0,
		maskReady: gear.includes("maske"),
		nadelReady: gear.includes("zeitnadel"),
		convertReady: gear.includes("spiegelkern"),
		braceLeft: 0,
		predictStrike: false,
		ketteUsed: false,
		spiegelUsed: false,
		leatherUsed: false,
		ignoreUsed: false,
		moved: false,
		flank: false,
		sheltered: false,
		holdReady: true
	};
}
function createGame(a, b, seed = Date.now() % 1e6) {
	return {
		round: 0,
		startSide: "A",
		fighters: {
			A: createFighter(a, "A"),
			B: createFighter(b, "B")
		},
		markers: [],
		log: [],
		winner: null,
		winReason: null,
		over: false,
		seed,
		nextId: 1,
		updatedRound: 0
	};
}
function emptyPlan() {
	return {
		action: "guard",
		energy: 0,
		targetField: null,
		reaction: null,
		itemId: null,
		ability: false,
		influence: "spur",
		echoId: null,
		ruleBreak: null,
		retargetField: null,
		prediction: null,
		zeitnadel: false,
		mist: false,
		mask: false,
		freeConvert: false
	};
}
function distance(from, to) {
	if (from === to) return 0;
	const seen = /* @__PURE__ */ new Set([from]);
	let edge = [from];
	let steps = 0;
	while (edge.length) {
		steps += 1;
		const next = [];
		for (const id of edge) for (const n of neighbors(id)) {
			if (seen.has(n)) continue;
			if (n === to) return steps;
			seen.add(n);
			next.push(n);
		}
		edge = next;
	}
	return 99;
}
function shortestPath(from, to, blocked) {
	if (from === to) return [from];
	const prev = /* @__PURE__ */ new Map();
	const seen = /* @__PURE__ */ new Set([from]);
	let edge = [from];
	while (edge.length) {
		const next = [];
		for (const id of edge) for (const n of neighbors(id)) {
			if (seen.has(n)) continue;
			if (blocked != null && n === blocked && n !== to) continue;
			seen.add(n);
			prev.set(n, id);
			if (n === to) {
				const path = [to];
				let cur = to;
				while (cur !== from) {
					cur = prev.get(cur);
					path.push(cur);
				}
				return path.reverse();
			}
			next.push(n);
		}
		edge = next;
	}
	return null;
}
function reachable(from, steps, blocked) {
	const found = /* @__PURE__ */ new Set();
	let edge = [from];
	const seen = /* @__PURE__ */ new Set([from]);
	for (let i = 0; i < steps; i++) {
		const next = [];
		for (const id of edge) for (const n of neighbors(id)) {
			if (seen.has(n) || n === blocked) continue;
			seen.add(n);
			found.add(n);
			next.push(n);
		}
		edge = next;
	}
	return [...found].sort((a, b) => a - b);
}
function pathInteriors(from, to) {
	const path = shortestPath(from, to, null);
	if (!path || path.length < 3) return [];
	return path.slice(1, -1);
}
function note(state, line) {
	state.log.unshift(line);
}
function addStatus(f, kind, rounds, power = 0) {
	const existing = f.statuses.find((s) => s.kind === kind);
	if (existing) {
		existing.rounds = Math.max(existing.rounds, rounds);
		existing.power = Math.max(existing.power, power);
		return;
	}
	f.statuses.push({
		kind,
		rounds,
		power
	});
}
function removeStatus(f, kind) {
	f.statuses = f.statuses.filter((s) => s.kind !== kind);
}
function markerAt(state, field) {
	return state.markers.find((m) => m.field === field);
}
function placeMarker(state, owner, kind, field, duration) {
	state.markers = state.markers.filter((m) => m.field !== field);
	state.markers.push({
		id: uid(state, "m"),
		owner,
		kind,
		field,
		duration
	});
}
function pushEcho(state, echo) {
	const owner = state.fighters[echo.owner];
	if (owner.echoes.length >= 4) {
		owner.echoes.sort((a, b) => a.charges - b.charges);
		owner.echoes.shift();
	}
	owner.echoes.push({
		id: uid(state, "e"),
		used: true,
		ttl: echo.ttl ?? 0,
		...echo
	});
}
function influenceRange(state, f) {
	return f.echoes.find((e) => e.kind === "influence" && e.field === f.field && e.charges > 0) ? 4 : 3;
}
function moveSteps(f, energy, ability) {
	if (ability && f.characterId === "laeuferin") return 2;
	let steps = liveStats(f).moveRange;
	if (energy >= 1) steps += 1;
	if (energy >= 2) steps += 1;
	if (hasStatus(f, "bound")) steps -= 1;
	return Math.max(0, steps);
}
function actionTempo(action) {
	if (action === "guard") return -1;
	if (action === "move") return 2;
	return 0;
}
function actionValue(f, plan) {
	let value = liveStats(f).tempo + actionTempo(plan.action) + plan.energy;
	if (plan.zeitnadel) value += 2;
	if (f.predictStrike && plan.action) value += 2;
	return value;
}
function botSetup(player, difficulty) {
	if (difficulty === "brutal") return suggestedSetup("brecher", "B");
	if (difficulty === "bedacht") return suggestedSetup("waechter", "B");
	const c = characterOf(player.characterId);
	if (c.bewegung >= 7) return suggestedSetup("jaeger", "B");
	if (c.kraft >= 7) return suggestedSetup("waechter", "B");
	if (c.kontrolle >= 8) return suggestedSetup("laeuferin", "B");
	return suggestedSetup("archivar", "B");
}
var CONVERT = {
	attack: "trap",
	guard: "barrier",
	move: "mist",
	influence: "rift"
};
function name(f) {
	return {
		brecher: "Brecher",
		laeuferin: "Läuferin",
		archivar: "Archivar",
		waechter: "Wächter",
		jaeger: "Jäger"
	}[f.characterId] ?? f.characterId;
}
function push(frames, state, frame) {
	frames.push({
		...frame,
		state: clone(state)
	});
}
function livingCores(f) {
	return f.cores.filter((c) => c.points > 0);
}
function killBody(state, side) {
	if (state.fighters[side].body > 0) return false;
	state.over = true;
	state.winner = other(side);
	state.winReason = "Körper";
	return true;
}
function killEcho(state, side) {
	if (livingCores(state.fighters[side]).length > 0) return false;
	state.over = true;
	state.winner = other(side);
	state.winReason = "Echo";
	return true;
}
function gainBruch(state, f, amount, plan) {
	let n = amount;
	if (n <= 0) return 0;
	if (f.armorId === "ketten" && !f.ketteUsed) {
		n = Math.max(0, n - 1);
		f.ketteUsed = true;
	}
	if (plan?.reaction === "stabilize" && n >= 2 && f.energy >= 1) {
		n -= 1;
		f.energy -= 1;
		f.stabilizeNext = true;
		note(state, `${name(f)} stabilisiert und verhindert 1 Bruch.`);
	}
	if (f.braceLeft > 0 && n > 0) {
		const prevented = Math.min(f.braceLeft, n, 2);
		n -= prevented;
		f.braceLeft -= prevented;
		if (prevented) note(state, `${name(f)} bricht die Regel und hält ${prevented} Bruch ab.`);
	}
	f.bruch = Math.min(f.bruchMax, f.bruch + n);
	if (f.bruch >= f.bruchMax) f.collapse = true;
	return n;
}
function hurt(state, f, amount) {
	const dealt = Math.max(0, amount);
	f.body = Math.max(0, f.body - dealt);
	return dealt;
}
function tickStatuses(f, kinds) {
	f.statuses = f.statuses.map((s) => kinds.includes(s.kind) ? {
		...s,
		rounds: s.rounds - 1
	} : s).filter((s) => s.rounds > 0);
}
function beginRound(input) {
	const state = clone(input);
	if (state.over) return {
		state,
		line: "Das Duell ist entschieden."
	};
	state.round += 1;
	const lines = [];
	for (const side of ["A", "B"]) {
		const f = state.fighters[side];
		const gain = f.stabilizeNext ? 1 : 2;
		f.stabilizeNext = false;
		f.energy = Math.min(f.energyMax, f.energy + gain);
		f.guardBonus = 0;
		f.braceLeft = 0;
		f.predictStrike = false;
		f.ketteUsed = false;
		f.spiegelUsed = false;
		f.leatherUsed = false;
		f.ignoreUsed = false;
		f.pursued = false;
		f.holdReady = true;
		f.moved = false;
		for (const echo of f.echoes) echo.used = false;
		tickStatuses(f, [
			"bound",
			"confused",
			"open",
			"guarded"
		]);
		lines.push(`${name(f)} +${gain} Energie`);
	}
	state.markers = state.markers.map((m) => ({
		...m,
		duration: m.duration - 1
	})).filter((m) => m.duration > 0);
	state.updatedRound = state.round;
	const line = `Runde ${state.round}. ${lines.join(" · ")}.`;
	note(state, line);
	return {
		state,
		line
	};
}
function spendEchoSecure(state, f, echo, plan) {
	if (echo.charges > 0) return false;
	if (plan?.reaction === "secure" && f.energy >= 2) {
		f.energy -= 2;
		echo.charges = 1;
		gainBruch(state, f, 1, null);
		note(state, `${name(f)} sichert ein Echo und nimmt 1 Bruch.`);
		return true;
	}
	return false;
}
function dropDeadEchoes(state, f, plan) {
	const kept = [];
	for (const echo of f.echoes) {
		if (echo.charges <= 0) {
			if (spendEchoSecure(state, f, echo, plan)) kept.push(echo);
			continue;
		}
		kept.push(echo);
	}
	f.echoes = kept;
}
function ownEcho(f, id) {
	if (!id) return f.echoes[0];
	return f.echoes.find((e) => e.id === id) ?? f.echoes[0];
}
function applyItem(state, f, foe, plan) {
	if (!plan.itemId) return;
	const item = f.items.find((i) => i.id === plan.itemId && !i.spent);
	if (!item) return;
	item.spent = true;
	if (item.id === "heil") {
		f.body = Math.min(f.bodyMax, f.body + 4);
		removeStatus(f, "wounded");
		note(state, `${name(f)} nimmt das Heilmittel. +4 Körper.`);
	} else if (item.id === "zelle") {
		f.energy = Math.min(f.energyMax, f.energy + 3);
		note(state, `${name(f)} setzt die Energiezelle ein.`);
	} else if (item.id === "binde") {
		f.bruch = Math.max(0, f.bruch - 2);
		if (f.bruch < f.bruchMax) f.collapse = false;
		addStatus(f, "bound", 2);
		note(state, `${name(f)} bindet den Bruch und wird gebunden.`);
	} else if (item.id === "splitter") {
		const echo = ownEcho(f, plan.echoId);
		if (echo) {
			echo.charges = Math.min(3, echo.charges + 2);
			echo.used = true;
			note(state, `${name(f)} speist ein Echo mit dem Splitter.`);
		}
	} else if (item.id === "blend") {
		if (hasStatus(foe, "confused")) gainBruch(state, foe, 1, null);
		else addStatus(foe, "confused", 2);
		note(state, `${name(f)} wirft Blendpulver.`);
	}
}
function freeNeighbor(f, foe, awayFrom) {
	const options = neighbors(f.field).filter((n) => n !== foe.field);
	if (!options.length) return null;
	if (awayFrom == null) return options[0];
	options.sort((a, b) => distance(b, awayFrom) - distance(a, awayFrom));
	return options[0];
}
function attackEchoBonus(f) {
	const echo = f.echoes.find((e) => e.kind === "attack" && e.field === f.field && e.charges > 0);
	if (!echo) return {
		raw: 0,
		bruch: 0,
		echo: false
	};
	echo.used = true;
	return {
		raw: 1,
		bruch: echo.charges >= 2 ? 1 : 0,
		echo: true
	};
}
function guardEchoSoak(f) {
	const echo = f.echoes.find((e) => e.kind === "guard" && e.field === f.field && e.charges > 0);
	if (!echo) return {
		dmg: 0,
		bruch: 0
	};
	echo.used = true;
	return {
		dmg: 2,
		bruch: echo.charges >= 2 ? 1 : 0
	};
}
function resolveAttack(state, attacker, defender, plan, defenderPlan, opts) {
	const aStats = liveStats(attacker);
	const dStats = liveStats(defender);
	const range = plan.ability && attacker.characterId === "brecher" ? 1 : aStats.range;
	const dist = distance(attacker.field, defender.field);
	const blockedByBarrier = pathInteriors(attacker.field, defender.field).some((field) => [...attacker.echoes, ...defender.echoes].some((e) => e.kind === "barrier" && e.field === field && e.charges > 0));
	if (attacker.weaponId === "bogen" && hasStatus(attacker, "bound")) {
		note(state, `${name(attacker)} kann gebunden den Bogen nicht spannen.`);
		return {
			hit: false,
			ended: false
		};
	}
	if (dist > range || attacker.weaponId === "kurzschwert" && blockedByBarrier) {
		pushEcho(state, {
			owner: attacker.side,
			kind: "attack",
			field: attacker.field,
			charges: 1
		});
		note(state, `${name(attacker)} verfehlt. Das Ziel ist außer Reichweite, das Echo bleibt.`);
		return {
			hit: false,
			ended: false
		};
	}
	let attack = aStats.kraftB + (plan.energy > 0 ? 1 : 0) + opts.attackMod + (attacker.pursued ? 1 : 0);
	const marked = defender.marked && attacker.characterId === "jaeger";
	if (marked) attack += 2;
	let flankArmor = 0;
	if (attacker.characterId === "laeuferin" && attacker.flank) {
		attack += 2;
		flankArmor = 2;
	}
	const echoB = attackEchoBonus(attacker);
	let defense = 2 + dStats.schutzB + dStats.moveB;
	if (attacker.weaponId === "bogen") defense -= Math.min(dStats.moveB, 1);
	if (attacker.weaponId === "speer") defense -= dStats.moveB;
	if (markerAt(state, defender.field)?.kind === "mist" || defender.echoes.some((e) => e.kind === "mist" && e.field === defender.field && e.charges > 0)) defense += 2;
	if (defender.characterId === "archivar" && defender.echoes.some((e) => e.field === defender.field && e.charges > 0)) defense += 2;
	if (echoB.echo && defender.armorId === "spiegel" && !defender.spiegelUsed) {
		defense += 1;
		defender.spiegelUsed = true;
	}
	const die = d6(state);
	const hit = die + attack >= defense;
	const diceNote = `Würfel ${die}. Angriff ${attack} gegen Verteidigung ${defense}.`;
	if (!hit) {
		pushEcho(state, {
			owner: attacker.side,
			kind: "attack",
			field: attacker.field,
			charges: 1
		});
		if (attacker.weaponId === "hammer") {
			gainBruch(state, attacker, 1, plan);
			note(state, `${name(attacker)} verfehlt mit dem Hammer, nimmt 1 Bruch, das Echo bleibt. ${diceNote}`);
		} else note(state, `${name(attacker)} verfehlt. Das Echo bleibt. ${diceNote}`);
		return {
			hit: false,
			ended: false
		};
	}
	const energyRaw = plan.energy >= 3 ? 2 : plan.energy >= 1 ? 1 : 0;
	const energyBruch = plan.energy >= 2 ? 1 : 0;
	let ignore = opts.ignoreSchutz + (marked ? 2 : 0) + (flankArmor ? 2 : 0);
	const brand = markerAt(state, defender.field)?.kind === "brand" ? 1 : 0;
	const raw = aStats.weapon + energyRaw + echoB.raw + brand + opts.rawMod + (flankArmor ? 2 : 0) - (dist === 0 && attacker.weaponId === "speer" ? 1 : 0);
	let armorCut = flankArmor + (marked ? aArmor(defender) : 0);
	if (attacker.weaponId === "bogen" && dist > 1) armorCut += 2;
	let end = Math.max(0, raw - Math.max(0, aArmor(defender) - armorCut));
	const bits = [`Roh ${raw}`, `nach Rüstung ${end}`];
	if (blockedByBarrier) {
		end = Math.max(0, end - 2);
		bits.push("Barriere −2");
	}
	const soak = guardEchoSoak(defender);
	end = Math.max(0, end - soak.dmg);
	if (soak.dmg) bits.push(`Schutz-Echo −${soak.dmg}`);
	const guarded = defender.statuses.find((s) => s.kind === "guarded");
	let bruchMod = energyBruch + echoB.bruch - soak.bruch;
	if (guarded) {
		const cut = Math.max(2, guarded.power || Math.max(2, dStats.schutzB - ignore));
		end = Math.max(0, end - cut);
		bruchMod -= 1;
		bits.push(`Block −${cut}`);
		removeStatus(defender, "guarded");
	}
	const fieldGuard = markerAt(state, defender.field);
	if (fieldGuard?.kind === "guard") {
		end = Math.max(0, end - 2);
		bits.push("Feld −2");
		state.markers = state.markers.filter((m) => m.id !== fieldGuard.id);
	}
	if (defender.characterId === "waechter" && defender.holdReady) {
		const cut = Math.max(2, dStats.schutzB);
		end = Math.max(0, end - cut);
		defender.holdReady = false;
		bits.push(`Standhalten −${cut}`);
	}
	if (isOpen(defender)) {
		end += 1;
		bruchMod += 1;
		bits.push("Offen +1");
	}
	const crit = die === 6 && !opts.noCrit;
	if (crit) {
		end *= 2;
		bruchMod += 1;
		bits.push("Kritisch");
	}
	if (attacker.weaponId === "hammer") bruchMod += 1;
	if (attacker.characterId === "brecher" && end >= 5) bruchMod += 1;
	if (plan.ability && attacker.characterId === "brecher") {
		removeStatus(defender, "guarded");
		const shield = defender.echoes.find((e) => e.kind === "guard");
		if (shield) shield.charges = Math.max(0, shield.charges - 1);
	}
	if (defenderPlan?.action === "move") {
		end = Math.max(0, end - 2);
		bits.push("Ausweichen −2");
	} else if (defenderPlan?.reaction === "dodge" && defender.energy >= 2) {
		defender.energy -= 2;
		end = Math.max(0, end - 2);
		bits.push("Ausweichen −2");
		note(state, `${name(defender)} weicht aus.`);
	}
	if (!defender.sheltered && end > 0 && (defender.characterId === "archivar" || defender.characterId === "jaeger")) {
		const capped = Math.min(end, 2);
		if (capped < end) bits.push(`Ersttreffer auf ${capped}`);
		end = capped;
		bruchMod = Math.min(bruchMod, 1);
		defender.sheltered = true;
		if (defender.characterId === "archivar") {
			pushEcho(state, {
				owner: defender.side,
				kind: "guard",
				field: defender.field,
				charges: 2
			});
			note(state, `${name(defender)} speichert den ersten Treffer. Gedeckelt auf 2, Schutz-Echo.`);
		} else note(state, `${name(defender)} gibt dem ersten Treffer nach. Gedeckelt auf 2.`);
	}
	const dealt = hurt(state, defender, end);
	const bruch = gainBruch(state, defender, Math.max(0, bruchMod), defenderPlan);
	if (defender.characterId === "archivar" && dealt > 0 && defender.echoes.some((echo) => echo.field === defender.field && echo.charges > 0)) {
		gainBruch(state, attacker, 1, plan);
		note(state, `${name(defender)} gibt den Treffer an das Echo zurück. ${name(attacker)} nimmt 1 Bruch.`);
	}
	if (marked) pushEcho(state, {
		owner: attacker.side,
		kind: "attack",
		field: attacker.field,
		charges: 2
	});
	defender.marked = false;
	if (crit) pushEcho(state, {
		owner: attacker.side,
		kind: "attack",
		field: attacker.field,
		charges: 2
	});
	if (attacker.weaponId === "kurzschwert") {
		const back = freeNeighbor(attacker, defender, defender.field);
		if (back != null) attacker.field = back;
	}
	if (attacker.weaponId === "kette" && attacker.energy >= 1 && defender.artifactId !== "anker" && defender.toolId !== "anker") {
		const closer = neighbors(defender.field).filter((n) => n !== attacker.field && distance(n, attacker.field) < distance(defender.field, attacker.field)).sort((a, b) => distance(a, attacker.field) - distance(b, attacker.field))[0];
		if (closer != null && closer !== attacker.field) {
			attacker.energy -= 1;
			defender.field = closer;
			note(state, `${name(attacker)} zieht ${name(defender)} heran.`);
		}
	}
	note(state, `${name(attacker)} trifft ${name(defender)}${opts.tag}. ${diceNote} ${bits.join(", ")}. ${dealt} Körper, ${bruch} Bruch${crit ? ". Kritisch" : ""}.`);
	dropDeadEchoes(state, defender, defenderPlan);
	if (killBody(state, defender.side)) return {
		hit: true,
		ended: true
	};
	if (defenderPlan?.reaction === "riposte" && defenderPlan.action === "attack" && defender.energy >= 2 && defender.body > 0) {
		defender.energy -= 2;
		if (resolveAttack(state, defender, attacker, {
			...defenderPlan,
			energy: 0,
			ability: false
		}, null, {
			rawMod: -2,
			attackMod: 0,
			ignoreSchutz: 0,
			noCrit: true,
			tag: " im Gegenstoß"
		}).ended) return {
			hit: true,
			ended: true
		};
	}
	return {
		hit: true,
		ended: false
	};
}
function aArmor(f) {
	return byId(ARMORS, f.armorId).value;
}
function doGuard(state, f, plan) {
	if (plan.ability && f.characterId === "waechter") {
		placeMarker(state, f.side, "guard", f.field, 1);
		f.guardBonus += 1;
		note(state, `${name(f)} sperrt das Feld und steht fester.`);
		return;
	}
	const cut = Math.max(2, liveStats(f).schutzB);
	const power = plan.energy >= 1 ? cut + 1 : cut;
	addStatus(f, "guarded", 1, power);
	if (plan.energy >= 2) {
		const bad = f.statuses.find((s) => s.kind === "wounded" || s.kind === "bound" || s.kind === "confused");
		if (bad) removeStatus(f, bad.kind);
	}
	if (plan.energy >= 3) {
		pushEcho(state, {
			owner: f.side,
			kind: "guard",
			field: f.field,
			charges: 2
		});
		note(state, `${name(f)} steht geschützt und setzt ein Schutz-Echo.`);
	} else note(state, `${name(f)} steht geschützt. Nächster Treffer −${power}.`);
}
function crackCore(state, attacker, defender, points) {
	const target = defender.cores.filter((c) => c.revealed && c.points > 0)[0] ?? null;
	if (!target) return false;
	target.points = Math.max(0, target.points - points);
	note(state, `${name(attacker)} bricht ein Kern-Echo. Noch ${target.points} ${target.points === 1 ? "Punkt" : "Punkte"}.`);
	if (target.points === 0) {
		defender.energyMax = Math.max(3, defender.energyMax - 1);
		defender.energy = Math.min(defender.energy, defender.energyMax);
		gainBruch(state, defender, 1, null);
		addStatus(defender, "open", 1);
		note(state, `Ein Kern von ${name(defender)} zerbricht.`);
		if (killEcho(state, defender.side)) return true;
	}
	return false;
}
function doInfluence(state, f, foe, plan) {
	const dist = distance(f.field, foe.field);
	const inReach = dist <= influenceRange(state, f);
	if (inReach) foe.cores.forEach((c) => c.revealed = true);
	if (plan.ability && f.characterId === "archivar") {
		if (f.echoes.length < 2) pushEcho(state, {
			owner: f.side,
			kind: "guard",
			field: f.field,
			charges: 2
		});
		const echoes = f.echoes.slice(0, 2);
		for (const echo of echoes) {
			echo.charges = Math.min(3, echo.charges + 1);
			echo.used = true;
		}
		note(state, `${name(f)} verbindet die eigenen Echos.`);
		return false;
	}
	if (plan.ability && f.characterId === "jaeger") {
		if (dist <= 3) {
			foe.marked = true;
			note(state, `${name(f)} markiert ${name(foe)}.`);
		} else note(state, `${name(f)} verliert die Markierung aus den Augen.`);
		return false;
	}
	if (plan.influence === "kern" && plan.energy >= 1 && inReach) {
		if (crackCore(state, f, foe, plan.energy >= 3 ? 2 : 1)) return true;
	} else if (plan.influence === "weaken" && inReach) {
		const loss = plan.energy >= 3 ? 2 : 1;
		const echo = foe.echoes.find((e) => e.charges > 0);
		if (echo) {
			echo.charges = Math.max(0, echo.charges - loss);
			echo.used = true;
			note(state, `${name(f)} schwächt ein Echo von ${name(foe)}.`);
			dropDeadEchoes(state, foe, null);
		} else if (f.toolId === "brecheisen" || f.artifactId === "brecheisen") {
			const marker = state.markers.find((m) => m.field === foe.field && (m.kind === "guard" || m.kind === "mist"));
			if (marker) {
				state.markers = state.markers.filter((m) => m.id !== marker.id);
				note(state, `${name(f)} bricht einen Feldmarker auf.`);
			}
		}
	} else if (plan.influence === "convert" || plan.freeConvert) {
		const echo = ownEcho(f, plan.echoId);
		const next = echo ? CONVERT[echo.kind] : void 0;
		if (echo && next && (plan.energy >= 1 || plan.freeConvert)) {
			if (plan.freeConvert) f.convertReady = false;
			echo.kind = next;
			echo.charges = Math.max(1, echo.charges - (plan.freeConvert ? 0 : 1));
			echo.used = true;
			if (next === "barrier") echo.ttl = 2;
			note(state, `${name(f)} wandelt ein Echo in ${ECHO_LABEL[next]}.`);
		}
	} else {
		let charges = 1 + (plan.energy >= 2 ? 1 : 0);
		if (f.characterId === "archivar" && !plan.itemId) charges += 1;
		const mirror = markerAt(state, f.field);
		if (mirror?.kind === "mirror") {
			charges += 1;
			state.markers = state.markers.filter((m) => m.id !== mirror.id);
		}
		pushEcho(state, {
			owner: f.side,
			kind: "influence",
			field: f.field,
			charges: Math.min(3, charges)
		});
		note(state, `${name(f)} legt ein Einfluss-Echo auf Feld ${f.field}.`);
	}
	if (plan.energy >= 2 && plan.influence !== "spur") {
		const echo = f.echoes[0];
		if (echo) {
			echo.charges = Math.min(3, echo.charges + 1);
			echo.used = true;
		}
	}
	return false;
}
function perform(state, side, plan, foePlan) {
	const f = state.fighters[side];
	const foe = state.fighters[other(side)];
	if (f.body <= 0) return {
		ended: true,
		tone: "win",
		title: `${name(f)} fällt`,
		detail: "Die Aktion verfällt.",
		dice: null
	};
	if (plan.energy > f.energy) plan.energy = f.energy;
	f.energy -= plan.energy;
	if (plan.ability) f.abilityRound = state.round;
	applyItem(state, f, foe, plan);
	if (plan.mist && (f.toolId === "rauch" || f.artifactId === "rauch") && f.energy >= 2) {
		f.energy -= 2;
		placeMarker(state, f.side, "mist", f.field, 2);
		note(state, `${name(f)} öffnet die Rauchkapsel.`);
	}
	if (plan.action === "attack") {
		const result = resolveAttack(state, f, foe, plan, foePlan, {
			rawMod: plan.ability && f.characterId === "brecher" ? 2 : 0,
			attackMod: 0,
			ignoreSchutz: 0,
			noCrit: false,
			tag: plan.ability ? " mit Aufbrechen" : ""
		});
		const detail = state.log[0] ?? "Angriff.";
		return {
			ended: result.ended || state.over,
			tone: result.hit ? "hit" : "miss",
			title: result.hit ? `${name(f)} trifft` : `${name(f)} verfehlt`,
			detail,
			dice: null
		};
	}
	if (plan.action === "guard") {
		doGuard(state, f, plan);
		return {
			ended: false,
			tone: "guard",
			title: `${name(f)} schützt sich`,
			detail: state.log[0] ?? "",
			dice: null
		};
	}
	if (plan.action === "move") {
		if (plan.ability && f.characterId === "laeuferin") {
			f.flank = true;
			pushEcho(state, {
				owner: f.side,
				kind: "move",
				field: f.field,
				charges: 1
			});
			note(state, `${name(f)} weicht im Seitenwechsel aus. Der nächste Angriff ist offen.`);
		} else note(state, `${name(f)} weicht aus. Ein Treffer ist um 2 niedriger.`);
		return {
			ended: false,
			tone: "move",
			title: `${name(f)} weicht aus`,
			detail: state.log[0] ?? "",
			dice: null
		};
	}
	return {
		ended: doInfluence(state, f, foe, plan) || state.over,
		tone: "echo",
		title: `${name(f)} nimmt Einfluss`,
		detail: state.log[0] ?? "",
		dice: null
	};
}
function endRound(state) {
	for (const side of ["A", "B"]) {
		const f = state.fighters[side];
		if (hasStatus(f, "wounded")) {
			hurt(state, f, 1);
			note(state, `${name(f)} blutet. −1 Körper.`);
		}
		tickStatuses(f, ["wounded"]);
		f.echoes = f.echoes.flatMap((echo) => {
			let charges = echo.charges;
			let ttl = echo.ttl;
			if (!echo.used) charges -= 1;
			if (ttl > 0) ttl -= 1;
			if (charges <= 0 || echo.kind === "barrier" && ttl === 0 && echo.ttl > 0) return [];
			return [{
				...echo,
				charges,
				ttl
			}];
		});
	}
	for (const side of ["A", "B"]) {
		if (killBody(state, side)) return;
		if (killEcho(state, side)) return;
	}
	const losers = ["A", "B"].filter((s) => state.fighters[s].collapse && state.fighters[s].bruch >= state.fighters[s].bruchMax);
	if (losers.length === 1) {
		state.over = true;
		state.winner = other(losers[0]);
		state.winReason = "Bruch";
		note(state, `${name(state.fighters[losers[0]])} bricht zusammen.`);
	} else if (losers.length === 2) {
		state.over = true;
		state.winner = null;
		state.winReason = "Bruch";
		note(state, "Beide Kämpfer brechen zusammen.");
	}
	if (!state.over) {
		state.startSide = other(state.startSide);
		removeRoundFlags(state);
	}
}
function removeRoundFlags(state) {
	for (const side of ["A", "B"]) {
		state.fighters[side].moved = false;
		state.fighters[side].pursued = false;
	}
}
function resolveRound(input, planA, planB) {
	const state = clone(input);
	const plans = {
		A: clone(planA),
		B: clone(planB)
	};
	const frames = [];
	for (const side of ["A", "B"]) {
		const f = state.fighters[side];
		const plan = plans[side];
		const foePlan = plans[other(side)];
		if (plan.prediction && f.pattern[plan.prediction] >= 3) {
			if (foePlan.action === plan.prediction) {
				f.predictStrike = true;
				f.pattern[plan.prediction] = 0;
				gainBruch(state, state.fighters[other(side)], 1, null);
				note(state, `${name(f)} liest ${foePlan.action} richtig.`);
			} else {
				f.pattern = {
					attack: 0,
					guard: 0,
					move: 0,
					influence: 0
				};
				const foe = state.fighters[other(side)];
				foe.energy = Math.min(foe.energyMax, foe.energy + 1);
				note(state, `${name(f)} liest falsch. Die Muster fallen.`);
			}
		}
	}
	for (const side of ["A", "B"]) {
		const f = state.fighters[side];
		const plan = plans[side];
		if (f.lastAction === plan.action) {
			const foe = state.fighters[other(side)];
			foe.pattern[plan.action] = Math.min(3, foe.pattern[plan.action] + 1);
		}
		f.lastAction = plan.action;
		if (plan.ruleBreak && f.ruleBreak) {
			f.ruleBreak = false;
			if (plan.ruleBreak === "refund" && plan.energy > 0) {
				plan.energy -= 1;
				note(state, `${name(f)} nimmt eine Energiestufe zurück.`);
			}
			if (plan.ruleBreak === "brace") f.braceLeft = 2;
			if (plan.ruleBreak === "retarget" && plan.retargetField) plan.targetField = plan.retargetField;
		}
		if (plan.mask && f.maskReady && plan.retargetField) {
			f.maskReady = false;
			plan.targetField = plan.retargetField;
			note(state, `${name(f)} verschiebt das Ziel mit der Maske.`);
		}
		if (plan.zeitnadel && f.nadelReady) f.nadelReady = false;
		else plan.zeitnadel = false;
		if (plan.freeConvert && !f.convertReady) plan.freeConvert = false;
	}
	const order = orderSides(state, plans);
	push(frames, state, {
		kicker: `Runde ${state.round} · Aufdecken`,
		title: `${label(plans[order[0]].action)} vor ${label(plans[order[1]].action)}`,
		detail: `${name(state.fighters[order[0]])} handelt zuerst. Aktionswert ${actionValue(state.fighters[order[0]], plans[order[0]])} gegen ${actionValue(state.fighters[order[1]], plans[order[1]])}.`,
		tone: "idle",
		focus: [state.fighters[order[0]].field, state.fighters[order[1]].field],
		actor: order[0],
		dice: null
	});
	for (const side of order) {
		if (state.over) break;
		const result = perform(state, side, plans[side], plans[other(side)]);
		const die = extractDie(result.detail);
		push(frames, state, {
			kicker: `Runde ${state.round} · ${label(plans[side].action)}`,
			title: result.title,
			detail: result.detail,
			tone: state.over ? "win" : result.tone,
			focus: [state.fighters[side].field, state.fighters[other(side)].field],
			actor: side,
			dice: die
		});
		if (result.ended || state.over) break;
	}
	if (!state.over && state.round >= 28) {
		const left = state.fighters.A.body;
		const right = state.fighters.B.body;
		state.over = true;
		state.winReason = "Zeit";
		state.winner = left === right ? null : left > right ? "A" : "B";
		note(state, "Die Zeit ist um. Es zählt der Körper.");
	}
	if (!state.over) {
		endRound(state);
		push(frames, state, {
			kicker: `Runde ${state.round} · Ende`,
			title: state.over ? winTitle(state) : "Die Spur kühlt ab",
			detail: state.over ? winDetail(state) : "Ungenutzte Echos verlieren Ladung. Der Start wechselt.",
			tone: state.over ? "win" : "break",
			focus: [state.fighters.A.field, state.fighters.B.field],
			actor: null,
			dice: null
		});
	} else push(frames, state, {
		kicker: `Runde ${state.round} · Entscheidung`,
		title: winTitle(state),
		detail: winDetail(state),
		tone: "win",
		focus: [state.fighters.A.field, state.fighters.B.field],
		actor: state.winner,
		dice: null
	});
	return frames;
}
function orderSides(state, plans) {
	const score = (side) => actionValue(state.fighters[side], plans[side]);
	const first = state.startSide;
	const pair = [first, other(first)];
	pair.sort((a, b) => {
		const va = score(a);
		const vb = score(b);
		if (va !== vb) return vb - va;
		if (plans[a].energy !== plans[b].energy) return plans[a].energy - plans[b].energy;
		const ta = liveStats(state.fighters[a]).tempo;
		const tb = liveStats(state.fighters[b]).tempo;
		if (ta !== tb) return tb - ta;
		if (state.fighters[a].body !== state.fighters[b].body) return state.fighters[a].body - state.fighters[b].body;
		const ra = d6(state);
		return d6(state) - ra;
	});
	return [pair[0], pair[1]];
}
function label(action) {
	if (action === "attack") return "Angriff";
	if (action === "guard") return "Schutz";
	if (action === "move") return "Ausweichen";
	return "Einfluss";
}
function extractDie(detail) {
	const match = detail.match(/Würfel (\d)/);
	return match ? Number(match[1]) : null;
}
function winTitle(state) {
	if (!state.winner) return state.winReason === "Zeit" ? "Unentschieden" : "Beide brechen";
	return `${name(state.fighters[state.winner])} siegt`;
}
function winDetail(state) {
	if (state.winReason === "Körper") return "Der Körper des Gegners ist auf 0.";
	if (state.winReason === "Echo") return "Alle drei Kern-Echos sind zerstört.";
	if (state.winReason === "Bruch") return "Das Bruchmaximum ist erreicht, die letzte Runde ist vorbei.";
	if (state.winReason === "Zeit") return "Nach 28 Runden zählt der verbleibende Körper.";
	return "Das Duell endet.";
}
function preparePlan(state, side, plan) {
	const next = clone(plan);
	const f = state.fighters[side];
	const foe = state.fighters[other(side)];
	const stats = liveStats(f);
	if (next.ability) {
		const cost = f.characterId === "brecher" ? 3 : f.characterId === "laeuferin" || f.characterId === "waechter" ? 2 : f.characterId === "jaeger" ? 1 : 3;
		const action = f.characterId === "brecher" ? "attack" : f.characterId === "laeuferin" ? "move" : f.characterId === "waechter" ? "guard" : "influence";
		if (f.energy < cost || f.abilityRound === state.round) next.ability = false;
		else {
			next.action = action;
			next.energy = cost;
		}
	}
	next.energy = Math.max(0, Math.min(3, next.energy, f.energy));
	if (next.itemId && !f.items.some((i) => i.id === next.itemId && !i.spent)) next.itemId = null;
	if (next.prediction && f.pattern[next.prediction] < 3) next.prediction = null;
	if (next.ruleBreak && !f.ruleBreak) next.ruleBreak = null;
	if (next.zeitnadel && !f.nadelReady) next.zeitnadel = false;
	if (next.mask && !f.maskReady) next.mask = false;
	if (next.freeConvert && !f.convertReady) next.freeConvert = false;
	if (!f.toolId.includes("rauch") && f.artifactId !== "rauch" && f.toolId !== "rauch") next.mist = false;
	if (next.action === "attack") {
		const range = next.ability && f.characterId === "brecher" ? 1 : stats.range;
		if ((distance(f.field, foe.field) > range || f.weaponId === "bogen" && hasStatus(f, "bound")) && !next.ability) {
			next.action = "guard";
			next.targetField = f.field;
		} else next.targetField = foe.field;
	}
	if (next.action === "move") next.targetField = f.field;
	if (next.action === "guard") next.targetField = f.field;
	if (next.action === "influence") {
		if (next.influence === "kern" && (next.energy < 1 || distance(f.field, foe.field) > influenceRange(state, f))) next.influence = "spur";
		next.targetField = foe.field;
	}
	if (next.reaction) {
		const cost = next.reaction === "stabilize" ? 1 : 2;
		if (f.energy - next.energy < cost) next.reaction = null;
	}
	return next;
}
function useStone(input, side) {
	const state = clone(input);
	const f = state.fighters[side];
	if (!(f.toolId === "bruchstein" || f.artifactId === "bruchstein") || f.stoneRound === state.round || f.bruch >= f.bruchMax) return state;
	f.stoneRound = state.round;
	gainBruch(state, f, 1, null);
	f.energy = Math.min(f.energyMax, f.energy + 2);
	note(state, `${name(f)} drückt den Bruchstein. +2 Energie, +1 Bruch.`);
	return state;
}
function bestPattern(state, side) {
	const pattern = state.fighters[side].pattern;
	return Object.keys(pattern).filter((key) => pattern[key] >= 3)[0] ?? null;
}
function choosePlan(state, side, difficulty) {
	const me = state.fighters[side];
	const foe = state.fighters[other(side)];
	const stats = liveStats(me);
	const foeStats = liveStats(foe);
	const dist = distance(me.field, foe.field);
	const candidates = [];
	const energyCap = Math.min(3, me.energy);
	for (let energy = 0; energy <= energyCap; energy++) {
		if (dist <= stats.range && !(me.weaponId === "bogen" && me.statuses.some((s) => s.kind === "bound"))) candidates.push({
			...emptyPlan(),
			action: "attack",
			energy,
			targetField: foe.field
		});
		candidates.push({
			...emptyPlan(),
			action: "guard",
			energy,
			targetField: me.field
		});
		candidates.push({
			...emptyPlan(),
			action: "move",
			energy: 0,
			targetField: me.field
		});
		candidates.push({
			...emptyPlan(),
			action: "influence",
			energy,
			influence: "spur",
			targetField: me.field
		});
		if (energy >= 1 && dist <= 3) candidates.push({
			...emptyPlan(),
			action: "influence",
			energy,
			influence: "kern",
			targetField: foe.field
		});
	}
	if (me.characterId === "brecher" && me.energy >= 3 && dist <= 1 && me.abilityRound !== state.round) candidates.push({
		...emptyPlan(),
		action: "attack",
		energy: 3,
		ability: true,
		targetField: foe.field
	});
	if (me.characterId === "laeuferin" && me.energy >= 2 && me.abilityRound !== state.round && !me.flank) candidates.push({
		...emptyPlan(),
		action: "move",
		energy: 0,
		ability: true,
		targetField: me.field
	});
	if (me.characterId === "waechter" && me.energy >= 2 && me.abilityRound !== state.round) candidates.push({
		...emptyPlan(),
		action: "guard",
		energy: 2,
		ability: true,
		targetField: me.field
	});
	if (me.characterId === "jaeger" && me.energy >= 1 && dist <= 3 && me.abilityRound !== state.round && !foe.marked) candidates.push({
		...emptyPlan(),
		action: "influence",
		energy: 1,
		ability: true,
		influence: "spur",
		targetField: foe.field
	});
	if (me.characterId === "archivar" && me.energy >= 3 && me.echoes.length >= 2 && me.abilityRound !== state.round) candidates.push({
		...emptyPlan(),
		action: "influence",
		energy: 3,
		ability: true,
		influence: "spur",
		targetField: me.field
	});
	let best = candidates[0] ?? emptyPlan();
	let bestScore = -Infinity;
	for (const plan of candidates) {
		let score = Math.random() * (difficulty === "brutal" ? 4 : 8);
		if (plan.action === "attack") {
			score += 18 + stats.weapon + stats.kraftB + plan.energy * 2;
			if (foe.body <= foe.bodyMax * .45) score += 16;
			if (isOpen(foe)) score += 8;
			if (foe.marked) score += 10;
			if (difficulty === "brutal") score += 14;
			if (difficulty === "bedacht" && me.body < me.bodyMax * .35) score -= 8;
		}
		if (plan.action === "guard") {
			score += dist <= foeStats.range ? 12 : 2;
			if (me.body < me.bodyMax * .4) score += 18;
			if (isOpen(me) || me.bruch >= me.bruchMax - 2) score += 10;
			if (difficulty === "bedacht") score += 8;
			if (difficulty === "brutal") score -= 8;
			score -= plan.energy;
		}
		if (plan.action === "move") {
			score += 6 + stats.moveB * 5;
			if (dist <= foeStats.range) score += 12;
			if (me.body < me.bodyMax * .45) score += 14;
			if (me.characterId === "laeuferin" && !me.flank) score += 30;
			if (plan.ability) score += 8;
		}
		if (plan.action === "influence") {
			score += stats.konB * 2;
			if (plan.influence === "kern" && foe.cores.some((c) => c.revealed)) score += 20;
			if (plan.influence === "kern") score += 6;
			if (difficulty === "taktisch") score += 7;
			if (me.echoes.length === 0 && plan.influence === "spur") score += 5;
		}
		if (plan.ability && plan.action === "attack") score += 8;
		if (plan.ability && plan.action !== "attack") score += plan.action === "guard" ? 6 : 8;
		if (me.characterId === "jaeger" && plan.ability && foeStats.schutzB + foeStats.armor >= 4) score += 16;
		if (me.characterId === "laeuferin" && me.flank && plan.action === "attack") score += 24;
		if (me.characterId === "laeuferin" && !me.flank && foeStats.schutzB + foeStats.armor >= 4 && plan.action === "move") score += 32;
		if (me.characterId === "laeuferin" && dist > stats.range && plan.action === "move") score += 12;
		if (me.characterId === "archivar" && me.body < me.bodyMax * .55 && plan.action === "guard") score += 16;
		if (me.characterId === "archivar" && plan.influence === "kern") score += 8;
		if (difficulty === "bedacht") score -= plan.energy * 1.5;
		if (score > bestScore) {
			bestScore = score;
			best = plan;
		}
	}
	const ready = preparePlan(state, side, best);
	const heal = me.items.find((i) => i.id === "heil" && !i.spent);
	const cell = me.items.find((i) => i.id === "zelle" && !i.spent);
	const brace = me.items.find((i) => i.id === "binde" && !i.spent);
	const dust = me.items.find((i) => i.id === "blend" && !i.spent);
	if (heal && me.body <= me.bodyMax * .45) ready.itemId = "heil";
	else if (brace && me.bruch >= me.bruchMax - 2) ready.itemId = "binde";
	else if (cell && me.energy <= 1) ready.itemId = "zelle";
	else if (dust && difficulty !== "bedacht" && ready.action === "attack") ready.itemId = "blend";
	if (difficulty !== "brutal") {
		if (ready.action === "move" && me.energy - ready.energy >= 2) ready.reaction = "dodge";
		else if (me.bruch >= 2 && me.energy - ready.energy >= 1) ready.reaction = "stabilize";
	} else if (ready.action === "attack" && me.energy - ready.energy >= 2) ready.reaction = "riposte";
	const predicted = bestPattern(state, side);
	if (predicted && difficulty !== "brutal") ready.prediction = predicted;
	if (me.nadelReady && difficulty === "brutal" && ready.action === "attack") ready.zeitnadel = true;
	if ((me.toolId === "rauch" || me.artifactId === "rauch") && me.energy - ready.energy >= 2 && dist <= 2) ready.mist = difficulty !== "brutal";
	return preparePlan(state, side, ready);
}
var ECHO_CLASS = {
	attack: "var(--color-accent)",
	guard: "var(--color-steel)",
	move: "var(--color-olive)",
	influence: "var(--color-soft)",
	trap: "var(--color-accent)",
	barrier: "var(--color-steel)",
	mist: "var(--color-muted)",
	rift: "var(--color-soft)"
};
function Board({ state, legal, selected, focus, shake, onPick, captions = {} }) {
	const marks = /* @__PURE__ */ new Map();
	for (let id = 1; id <= 7; id++) marks.set(id, { echoes: [] });
	for (const side of ["A", "B"]) for (const echo of state.fighters[side].echoes) marks.get(echo.field)?.echoes.push(echo);
	for (const marker of state.markers) {
		const slot = marks.get(marker.field);
		if (slot) slot.marker = marker.kind;
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 1000 1200",
		className: `h-full w-full ${shake ? "shake" : ""}`,
		role: "img",
		"aria-label": "Spielfeld mit sieben Feldern",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				width: "1000",
				height: "1200",
				fill: "transparent"
			}),
			EDGES.map(([a, b]) => {
				const hot = a === selected || b === selected || focus.includes(a) || focus.includes(b);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
					x1: POS[a][0],
					y1: POS[a][1],
					x2: POS[b][0],
					y2: POS[b][1],
					stroke: hot ? "var(--color-soft)" : "var(--color-line)",
					strokeWidth: hot ? 8 : 4,
					strokeLinecap: "round"
				}, `${a}-${b}`);
			}),
			[
				1,
				2,
				3,
				4,
				5,
				6,
				7
			].map((id) => {
				const [x, y] = POS[id];
				const hereA = state.fighters.A.field === id;
				const hereB = state.fighters.B.field === id;
				const fighter = hereA ? state.fighters.A : hereB ? state.fighters.B : null;
				const isLegal = legal.includes(id);
				const isSel = selected === id;
				const isFocus = focus.includes(id);
				const slot = marks.get(id);
				const fill = fighter ? fighter.side === "A" ? "var(--color-fg)" : "var(--color-accent)" : isSel ? "var(--color-soft)" : "var(--color-raised)";
				const ink = fighter?.side === "B" || isSel ? "var(--color-ink)" : "var(--color-fg)";
				const label = fighter ? fighter.characterId === "laeuferin" ? "L" : fighter.characterId === "waechter" ? "W" : fighter.characterId === "archivar" ? "A" : fighter.characterId === "brecher" ? "B" : "J" : String(id);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
					onClick: () => onPick?.(id),
					className: onPick ? "cursor-pointer" : "",
					role: onPick ? "button" : void 0,
					"aria-label": `Feld ${id}${fighter ? `, ${fighter.side}` : ""}`,
					children: [
						(isLegal || isFocus) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
							cx: x,
							cy: y,
							r: "58",
							fill: "none",
							stroke: isFocus ? "var(--color-fg)" : "var(--color-soft)",
							strokeWidth: "2",
							strokeDasharray: isLegal && !isFocus ? "4 6" : void 0
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
							cx: x,
							cy: y,
							r: "46",
							fill,
							stroke: "var(--color-line)",
							strokeWidth: "3"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
							x,
							y: y + 2,
							textAnchor: "middle",
							dominantBaseline: "central",
							fill: fighter ? ink : "var(--color-fg)",
							fontFamily: "Fraunces, Palatino, serif",
							fontSize: fighter ? 28 : 26,
							fontWeight: 600,
							children: label
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
							x,
							y: y + 34,
							textAnchor: "middle",
							fill: "var(--color-muted)",
							fontFamily: "Outfit, sans-serif",
							fontSize: "13",
							children: captions[id] ?? (fighter ? "" : "")
						}),
						slot.echoes.slice(0, 4).map((echo, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
							cx: x - 30 + index * 16,
							cy: y + 62,
							r: "6",
							fill: ECHO_CLASS[echo.kind],
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("title", { children: [
								ECHO_LABEL[echo.kind],
								" ",
								echo.charges
							] })
						}, `${echo.kind}-${index}`)),
						slot.marker && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
							x,
							y: y - 62,
							textAnchor: "middle",
							fill: "var(--color-muted)",
							fontFamily: "Outfit, sans-serif",
							fontSize: "13",
							children: slot.marker === "brand" ? "Brand" : slot.marker === "mist" ? "Nebel" : slot.marker === "guard" ? "Schutz" : slot.marker === "bind" ? "Fessel" : slot.marker === "rift" ? "Riss" : "Spiegel"
						})
					]
				}, id);
			})
		]
	});
}
var CLASSIC_STATE = {
	waffe: null,
	block: "08_block.jpg",
	ausweichen: "09_ausweichen.jpg",
	offen: "10_offen.jpg",
	gebrochen: "13_zusammenbruch.jpg"
};
function plateSrc(id, weaponId, look) {
	if ((id === "brecher" && weaponId === "hammer" || id === "jaeger" && weaponId === "bogen") && (id === "brecher" || id === "jaeger")) {
		if (look === "waffe") return `/kampf/hd/${id}/01_gegenueber.jpg`;
		const file = CLASSIC_STATE[look];
		if (file) return `/kampf/hd/${id}/${file}`;
	}
	if (look === "waffe") return `/kampf/v2/${id}/${weaponId}.jpg`;
	return `/kampf/v2/${id}/${look}.jpg`;
}
function backdrop(beat) {
	if (!beat) return "/kampf/v2/bg/halle.jpg";
	if (beat.tone === "win" || beat.tone === "break") return "/kampf/v2/bg/bruch.jpg";
	if (beat.tone === "miss" || /ausweich/i.test(beat.detail)) return "/kampf/v2/bg/nebel.jpg";
	if (beat.tone === "hit" || beat.tone === "guard") return "/kampf/v2/bg/funken.jpg";
	return "/kampf/v2/bg/halle.jpg";
}
function lookOf(state, side, beat) {
	const f = state.fighters[side];
	if (f.body <= 0 || f.collapse) return "gebrochen";
	if (beat?.tone === "win" && beat.state.winner && beat.state.winner !== side) return "gebrochen";
	const blob = beat ? `${beat.title} ${beat.detail}` : "";
	const defender = beat?.actor && beat.actor !== side;
	if (defender && /Block −|blockt|steht geschützt|Standhalten/i.test(blob)) return "block";
	if (defender && /Ausweichen −|weicht aus/i.test(blob)) return "ausweichen";
	if (beat?.actor === side && beat.tone === "guard") return "block";
	if (isOpen(f)) return "offen";
	return "waffe";
}
function lookLabel(look) {
	if (look === "block") return "Geblockt";
	if (look === "ausweichen") return "Ausgewichen";
	if (look === "offen") return "Offen";
	if (look === "gebrochen") return "Gebrochen";
	return "Bereit";
}
function KampfKarte({ f, tag, look, featured = false, className = "" }) {
	const c = CHARACTERS.find((item) => item.id === f.characterId);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: `rounded-2xl border border-white/10 bg-black/55 p-3 backdrop-blur-md ${featured ? "ring-1 ring-white/40" : ""} ${className}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-baseline justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "display truncate text-2xl",
					children: c.name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[10px] uppercase tracking-wide text-white/50",
					children: tag
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 truncate text-xs text-white/70",
				children: [
					weaponName(f.weaponId),
					" · ",
					armorName(f.armorId)
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-[10px] uppercase tracking-wide text-white/80",
				children: lookLabel(look)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 flex flex-col gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meter, {
						label: "Körper",
						value: f.body,
						max: f.bodyMax,
						tone: "bg-white"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meter, {
						label: "Bruch",
						value: f.bruch,
						max: f.bruchMax,
						tone: "bg-[#c4523a]"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[10px] uppercase tracking-wide text-white/50",
							children: "Energie"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "flex gap-1",
							children: Array.from({ length: f.energyMax }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `h-1.5 w-3 rounded-full ${i < f.energy ? "bg-white" : "bg-white/20"}` }, i))
						})]
					})
				]
			})
		]
	});
}
function Meter({ label, value, max, tone }) {
	const pct = max > 0 ? Math.max(0, Math.min(100, value / max * 100)) : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-1 flex justify-between text-[10px] uppercase tracking-wide text-white/50",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "tabular-nums",
			children: [
				value,
				"/",
				max
			]
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "h-1.5 overflow-hidden rounded-full bg-white/15",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: `h-full ${tone}`,
			style: { width: `${pct}%` }
		})
	})] });
}
function weaponName(id) {
	return {
		kurzschwert: "Kurzschwert",
		hammer: "Hammer",
		speer: "Speer",
		bogen: "Bogen",
		kette: "Kettenklinge"
	}[id] ?? id;
}
function armorName(id) {
	return {
		leder: "Leder",
		ketten: "Kettenrüstung",
		platte: "Platte",
		spiegel: "Spiegelfaser"
	}[id] ?? id;
}
var SAVE_KEY = "echo-bruch";
var LOG_KEY = "echo-bruch-logs";
function readLogs() {
	try {
		const raw = localStorage.getItem(LOG_KEY);
		if (!raw) return [];
		const data = JSON.parse(raw);
		return Array.isArray(data) ? data.filter((entry) => Array.isArray(entry.lines)) : [];
	} catch {
		return [];
	}
}
function storeLog(game) {
	const names = {
		A: CHARACTERS.find((c) => c.id === game.fighters.A.characterId)?.name ?? "A",
		B: CHARACTERS.find((c) => c.id === game.fighters.B.characterId)?.name ?? "B"
	};
	const winner = game.winner ? names[game.winner] : "Unentschieden";
	const entry = {
		id: `${game.seed}-${game.round}-${game.log.length}`,
		title: `${names.A} gegen ${names.B} · ${winner} · Runde ${game.round} · ${game.winReason ?? "offen"}`,
		lines: [...game.log].reverse()
	};
	const prev = readLogs().filter((item) => item.id !== entry.id);
	localStorage.setItem(LOG_KEY, JSON.stringify([entry, ...prev].slice(0, 16)));
}
function downloadText(filename, text) {
	const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	link.click();
	window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
function initial() {
	return {
		screen: "title",
		mode: "bot",
		difficulty: "taktisch",
		focus: "A",
		afterCover: "plan",
		setup: {
			A: suggestedSetup("jaeger", "A"),
			B: suggestedSetup("waechter", "B")
		},
		game: null,
		draft: emptyPlan(),
		locked: {},
		frames: [],
		frame: 0,
		auto: true,
		muted: false,
		codex: false,
		banner: "",
		wins: 0,
		losses: 0
	};
}
function openBattle(state, setup) {
	const begun = beginRound(createGame(setup.A, setup.B));
	return {
		...state,
		setup,
		game: begun.state,
		banner: begun.line,
		screen: state.mode === "hotseat" ? "cover" : "plan",
		afterCover: "plan",
		focus: "A",
		draft: emptyPlan(),
		locked: {},
		frames: [],
		frame: 0,
		codex: false
	};
}
function finishScenes(state) {
	const game = state.frames[state.frames.length - 1]?.state ?? state.game;
	if (!game) return state;
	if (game.over) {
		const bot = state.mode === "bot";
		return {
			...state,
			game,
			screen: "end",
			frames: [],
			wins: bot && game.winner === "A" ? state.wins + 1 : state.wins,
			losses: bot && game.winner === "B" ? state.losses + 1 : state.losses
		};
	}
	const begun = beginRound(game);
	return {
		...state,
		game: begun.state,
		banner: begun.line,
		screen: state.mode === "hotseat" ? "cover" : "plan",
		afterCover: "plan",
		focus: "A",
		draft: emptyPlan(),
		locked: {},
		frames: [],
		frame: 0
	};
}
function reduce(state, act) {
	switch (act.type) {
		case "prefs": return {
			...state,
			auto: act.auto,
			muted: act.muted,
			wins: act.wins,
			losses: act.losses,
			difficulty: act.difficulty
		};
		case "difficulty": return {
			...state,
			difficulty: act.value
		};
		case "boot": return {
			...state,
			mode: act.mode,
			focus: "A",
			screen: "roster"
		};
		case "quick": {
			const a = suggestedSetup("jaeger", "A");
			const b = botSetup(a, state.difficulty);
			b.field = 5;
			return openBattle({
				...state,
				mode: "bot"
			}, {
				A: a,
				B: b
			});
		}
		case "character": {
			const next = suggestedSetup(act.id, state.focus);
			next.field = state.setup[state.focus].field;
			return {
				...state,
				setup: {
					...state.setup,
					[state.focus]: next
				}
			};
		}
		case "kit": return {
			...state,
			screen: "kit"
		};
		case "slot": return {
			...state,
			setup: {
				...state.setup,
				[state.focus]: {
					...state.setup[state.focus],
					[act.slot]: act.id
				}
			}
		};
		case "item": {
			const current = state.setup[state.focus];
			if (current.items.includes(act.id)) return state;
			return {
				...state,
				setup: {
					...state.setup,
					[state.focus]: {
						...current,
						items: [current.items[1], act.id]
					}
				}
			};
		}
		case "field":
			if (!STARTS[state.focus].includes(act.id)) return state;
			return {
				...state,
				setup: {
					...state.setup,
					[state.focus]: {
						...state.setup[state.focus],
						field: act.id
					}
				}
			};
		case "advance":
			if (state.screen === "roster") return {
				...state,
				screen: "kit"
			};
			if (state.screen === "kit") {
				if (state.mode === "hotseat" && state.focus === "A") return {
					...state,
					screen: "cover",
					afterCover: "roster",
					focus: "B"
				};
				return {
					...state,
					screen: "deploy",
					focus: "A"
				};
			}
			if (state.screen === "deploy") {
				if (state.mode === "hotseat" && state.focus === "A") return {
					...state,
					screen: "cover",
					afterCover: "deploy",
					focus: "B"
				};
				const setup = {
					A: state.setup.A,
					B: { ...state.setup.B }
				};
				if (state.mode === "bot") {
					const bot = botSetup(setup.A, state.difficulty);
					bot.field = setup.A.field === 4 ? 3 : 5;
					setup.B = bot;
				}
				return openBattle(state, setup);
			}
			return state;
		case "back":
			if (state.screen === "roster") return {
				...state,
				screen: "title",
				focus: "A"
			};
			if (state.screen === "kit") return {
				...state,
				screen: "roster"
			};
			if (state.screen === "deploy") return {
				...state,
				screen: "kit",
				focus: state.mode === "bot" ? "A" : state.focus
			};
			return state;
		case "ready": return {
			...state,
			screen: state.afterCover,
			draft: emptyPlan()
		};
		case "draft": return {
			...state,
			draft: act.plan
		};
		case "stone":
			if (!state.game) return state;
			return {
				...state,
				game: useStone(state.game, state.focus)
			};
		case "lock": {
			if (!state.game || state.game.over) return state;
			const plan = preparePlan(state.game, state.focus, state.draft);
			if (state.mode === "bot") {
				const bot = choosePlan(state.game, "B", state.difficulty);
				return {
					...state,
					frames: resolveRound(state.game, plan, bot),
					frame: 0,
					screen: "scene",
					locked: {
						A: plan,
						B: bot
					}
				};
			}
			const locked = {
				...state.locked,
				[state.focus]: plan
			};
			if (state.focus === "A") return {
				...state,
				locked,
				screen: "cover",
				afterCover: "plan",
				focus: "B",
				draft: emptyPlan()
			};
			return {
				...state,
				locked,
				frames: resolveRound(state.game, locked.A ?? plan, plan),
				frame: 0,
				screen: "scene"
			};
		}
		case "step":
			if (state.frame < state.frames.length - 1) return {
				...state,
				frame: state.frame + 1
			};
			return finishScenes(state);
		case "skip": return finishScenes({
			...state,
			frame: Math.max(0, state.frames.length - 1)
		});
		case "auto": return {
			...state,
			auto: !state.auto
		};
		case "mute": return {
			...state,
			muted: !state.muted
		};
		case "codex": return {
			...state,
			codex: !state.codex
		};
		case "rematch": return openBattle(state, state.setup);
		case "title": return {
			...initial(),
			wins: state.wins,
			losses: state.losses,
			muted: state.muted,
			auto: state.auto,
			difficulty: state.difficulty
		};
		case "ledger": return {
			...state,
			screen: "ledger",
			codex: false
		};
		default: return state;
	}
}
var audioCtx = null;
function cue(kind, muted) {
	if (muted || typeof window === "undefined") return;
	const Ctx = window.AudioContext;
	if (!Ctx) return;
	if (!audioCtx) audioCtx = new Ctx();
	if (audioCtx.state === "suspended") audioCtx.resume();
	const osc = audioCtx.createOscillator();
	const gain = audioCtx.createGain();
	osc.connect(gain);
	gain.connect(audioCtx.destination);
	const freq = kind === "hit" ? 128 : kind === "win" ? 196 : kind === "guard" ? 240 : kind === "move" ? 180 : kind === "echo" ? 300 : 96;
	osc.type = kind === "hit" || kind === "win" ? "triangle" : "sine";
	osc.frequency.value = freq;
	const now = audioCtx.currentTime;
	gain.gain.setValueAtTime(1e-4, now);
	gain.gain.exponentialRampToValueAtTime(.04, now + .02);
	gain.gain.exponentialRampToValueAtTime(1e-4, now + .18);
	osc.start(now);
	osc.stop(now + .2);
}
var ACTION_ICON = {
	attack: Swords,
	guard: Shield,
	move: Footprints,
	influence: Orbit
};
function GameApp({ onBasis }) {
	const [duel, dispatch] = (0, import_react.useReducer)(reduce, void 0, initial);
	(0, import_react.useEffect)(() => {
		const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		const raw = localStorage.getItem(SAVE_KEY);
		if (!raw) {
			if (reduced) dispatch({
				type: "prefs",
				auto: false,
				muted: false,
				wins: 0,
				losses: 0,
				difficulty: "taktisch"
			});
			return;
		}
		try {
			const data = JSON.parse(raw);
			dispatch({
				type: "prefs",
				auto: typeof data.auto === "boolean" ? data.auto : !reduced,
				muted: Boolean(data.muted),
				wins: Number(data.wins) || 0,
				losses: Number(data.losses) || 0,
				difficulty: data.difficulty === "bedacht" || data.difficulty === "brutal" ? data.difficulty : "taktisch"
			});
		} catch {}
	}, []);
	(0, import_react.useEffect)(() => {
		localStorage.setItem(SAVE_KEY, JSON.stringify({
			auto: duel.auto,
			muted: duel.muted,
			wins: duel.wins,
			losses: duel.losses,
			difficulty: duel.difficulty
		}));
	}, [
		duel.auto,
		duel.muted,
		duel.wins,
		duel.losses,
		duel.difficulty
	]);
	(0, import_react.useEffect)(() => {
		if (duel.screen === "end" && duel.game?.over) storeLog(duel.game);
	}, [duel.screen, duel.game]);
	(0, import_react.useEffect)(() => {
		if (duel.screen !== "scene" || !duel.auto) return;
		const timer = window.setTimeout(() => dispatch({ type: "step" }), 3200);
		return () => window.clearTimeout(timer);
	}, [
		duel.screen,
		duel.frame,
		duel.auto,
		duel.frames.length
	]);
	(0, import_react.useEffect)(() => {
		if (duel.screen !== "scene") return;
		const beat = duel.frames[duel.frame];
		if (beat) cue(beat.tone, duel.muted);
	}, [
		duel.screen,
		duel.frame,
		duel.frames,
		duel.muted
	]);
	(0, import_react.useEffect)(() => {
		const onKey = (event) => {
			if (event.key === " " && duel.screen === "scene") {
				event.preventDefault();
				dispatch({ type: "step" });
			}
			if (event.key === "Enter" && duel.screen === "plan") dispatch({ type: "lock" });
			if (duel.screen === "plan" && duel.game && event.key >= "1" && event.key <= "4") {
				const action = ACTIONS[Number(event.key) - 1].id;
				dispatch({
					type: "draft",
					plan: withAction(duel.draft, action, duel.game, duel.focus)
				});
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [
		duel.screen,
		duel.draft,
		duel.game,
		duel.focus
	]);
	const beat = duel.screen === "scene" ? duel.frames[duel.frame] : null;
	const view = shownState(duel, beat);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-bg text-fg",
		children: [
			duel.screen === "title" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Title, {
				duel,
				dispatch,
				onBasis
			}),
			duel.screen === "roster" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Roster, {
				duel,
				dispatch
			}),
			duel.screen === "kit" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kit, {
				duel,
				dispatch
			}),
			duel.screen === "cover" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cover, {
				duel,
				dispatch
			}),
			duel.screen === "end" && duel.game && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ending, {
				duel,
				dispatch
			}),
			duel.screen === "ledger" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ledger, { onBack: () => dispatch({ type: "title" }) }),
			(duel.screen === "deploy" || duel.screen === "plan" || duel.screen === "scene") && view && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Battle, {
				duel,
				view,
				beat,
				dispatch
			}),
			duel.codex && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Codex, { onClose: () => dispatch({ type: "codex" }) })
		]
	});
}
function Title({ duel, dispatch, onBasis }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-dvh w-full max-w-5xl flex-col justify-center gap-8 px-4 py-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "max-w-xl",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "Endversion 1.0"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "display mt-2 text-5xl sm:text-6xl",
						children: "ECHO//BRUCH"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 max-w-md text-muted",
						children: "Plane verdeckt. Lies deinen Gegner. Hinterlasse eine Spur. Sieben Felder, vier Aktionen, drei Wege zum Sieg."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-3 sm:grid-cols-3",
				children: [
					{
						id: "bedacht",
						name: "Bedacht",
						text: "Hält Abstand, liest Muster, spielt den Wächter."
					},
					{
						id: "taktisch",
						name: "Taktisch",
						text: "Kontert dein Set und mischt Einfluss mit Druck."
					},
					{
						id: "brutal",
						name: "Rücksichtslos",
						text: "Der Brecher. Volle Energie, kein Schritt zurück."
					}
				].map((level) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: `panel p-4 text-left ${duel.difficulty === level.id ? "border-fg" : ""}`,
					onClick: () => dispatch({
						type: "difficulty",
						value: level.id
					}),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "display text-2xl",
						children: level.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mt-2 block text-sm text-muted",
						children: level.text
					})]
				}, level.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn btn-primary",
						onClick: () => {
							cue("idle", duel.muted);
							dispatch({
								type: "boot",
								mode: "bot"
							});
						},
						children: "Gegen den Bot"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn",
						onClick: () => {
							cue("idle", duel.muted);
							dispatch({
								type: "boot",
								mode: "hotseat"
							});
						},
						children: "Zu zweit am Gerät"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn",
						onClick: () => {
							cue("idle", duel.muted);
							dispatch({ type: "quick" });
						},
						children: "Sofort kämpfen"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn",
						onClick: () => dispatch({ type: "ledger" }),
						children: "Protokolle"
					}),
					onBasis && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn",
						onClick: onBasis,
						children: "Zum neuen Kampf"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-faint tabular-nums",
				children: [
					"Gegen den Bot: ",
					duel.wins,
					" Siege · ",
					duel.losses,
					" Niederlagen"
				]
			})
		]
	});
}
function Roster({ duel, dispatch }) {
	const current = duel.setup[duel.focus].characterId;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-6 px-4 py-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScreenHead, {
			kicker: duel.focus === "A" ? "Spieler A" : "Spieler B",
			title: "Wer tritt an",
			action: "Weiter zur Ausrüstung",
			onBack: () => dispatch({ type: "back" }),
			onNext: () => dispatch({ type: "advance" })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-5",
			children: CHARACTERS.map((c) => {
				const on = c.id === current;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => dispatch({
						type: "character",
						id: c.id
					}),
					className: `panel flex flex-col gap-3 p-4 text-left ${on ? "border-fg" : ""}`,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sigil, { id: c.id }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "display block text-2xl",
							children: c.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm text-muted",
							children: c.line
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatLine, {
							label: "Kraft",
							value: c.kraft
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatLine, {
							label: "Schutz",
							value: c.schutz
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatLine, {
							label: "Bewegung",
							value: c.bewegung
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatLine, {
							label: "Kontrolle",
							value: c.kontrolle
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatLine, {
							label: "Tempo",
							value: c.tempo
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm text-muted",
							children: c.passive
						})
					]
				}, c.id);
			})
		})]
	});
}
function Kit({ duel, dispatch }) {
	const setup = duel.setup[duel.focus];
	const max = derivedMax(setup);
	const c = CHARACTERS.find((item) => item.id === setup.characterId);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-5 px-4 py-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScreenHead, {
				kicker: c.name,
				title: "Ausrüstung legen",
				action: duel.mode === "hotseat" && duel.focus === "A" ? "Weiter zu Spieler B" : "Aufstellung",
				onBack: () => dispatch({ type: "back" }),
				onNext: () => dispatch({ type: "advance" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "panel flex flex-wrap items-end justify-between gap-4 p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "display text-3xl",
					children: c.name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted",
					children: [
						c.ability,
						" · ",
						c.abilityCost,
						" Energie"
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm tabular-nums text-muted",
					children: [
						"Körper ",
						max.body,
						" · Energie max ",
						max.energy,
						" · Bruch ",
						max.bruch
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GearRow, {
				title: "Waffe",
				selected: setup.weaponId,
				options: WEAPONS.map((w) => ({
					id: w.id,
					name: w.name,
					text: `Wert ${w.value} · Reichweite ${w.range} · ${w.text}`
				})),
				onPick: (id) => dispatch({
					type: "slot",
					slot: "weaponId",
					id
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GearRow, {
				title: "Rüstung",
				selected: setup.armorId,
				options: ARMORS.map((w) => ({
					id: w.id,
					name: w.name,
					text: `Wert ${w.value} · Körper +${w.body} · ${w.text}`
				})),
				onPick: (id) => dispatch({
					type: "slot",
					slot: "armorId",
					id
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GearRow, {
				title: "Werkzeug",
				selected: setup.toolId,
				options: GEAR.filter((g) => g.slot === "tool").map((w) => ({
					id: w.id,
					name: w.name,
					text: w.text
				})),
				onPick: (id) => dispatch({
					type: "slot",
					slot: "toolId",
					id
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GearRow, {
				title: "Artefakt",
				selected: setup.artifactId,
				options: GEAR.filter((g) => g.slot === "artifact").map((w) => ({
					id: w.id,
					name: w.name,
					text: w.text
				})),
				onPick: (id) => dispatch({
					type: "slot",
					slot: "artifactId",
					id
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GearRow, {
				title: "Verbrauch · zwei",
				selected: setup.items[0],
				also: setup.items[1],
				options: ITEMS.map((w) => ({
					id: w.id,
					name: w.name,
					text: w.text
				})),
				onPick: (id) => dispatch({
					type: "item",
					id
				})
			})
		]
	});
}
function Cover({ duel, dispatch }) {
	const who = duel.focus === "A" ? "Spieler A" : "Spieler B";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Verdecktes Planen"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "display text-5xl",
				children: who
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-sm text-muted",
				children: "Gib das Gerät weiter. Der andere Plan bleibt zu."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn btn-primary",
				onClick: () => dispatch({ type: "ready" }),
				children: "Ich bin bereit"
			})
		]
	});
}
function Ending({ duel, dispatch }) {
	const game = duel.game;
	const winner = game.winner ? CHARACTERS.find((c) => c.id === game.fighters[game.winner].characterId)?.name : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center gap-6 px-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-muted",
				children: ["Runde ", game.round]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "display text-5xl",
				children: winner ? `${winner} siegt` : "Beide brechen"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-muted",
				children: [
					game.winReason === "Körper" && "Der Körper des Gegners ist auf 0.",
					game.winReason === "Echo" && "Alle drei Kern-Echos sind zerstört.",
					game.winReason === "Bruch" && "Das Bruchmaximum hat die letzte Runde beendet.",
					game.winReason === "Zeit" && "Die Zeit ist um."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "flex max-h-80 flex-col gap-2 overflow-auto text-sm text-muted",
				children: [...game.log].reverse().map((line, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: line }, `${index}-${line}`))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn btn-primary",
						onClick: () => dispatch({ type: "rematch" }),
						children: "Nochmal"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn",
						onClick: () => downloadText(`echo-bruch-${game.seed}.txt`, [...game.log].reverse().join("\n")),
						children: "Protokoll speichern"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn",
						onClick: () => dispatch({ type: "ledger" }),
						children: "Alle Protokolle"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn",
						onClick: () => dispatch({ type: "title" }),
						children: "Neues Duell"
					})
				]
			})
		]
	});
}
function Ledger({ onBack }) {
	const [logs, setLogs] = (0, import_react.useState)([]);
	const [open, setOpen] = (0, import_react.useState)(null);
	const [bilanz, setBilanz] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		setLogs(readLogs());
		fetch("/bilanz.txt").then((response) => response.ok ? response.text() : "").then(setBilanz).catch(() => setBilanz(""));
	}, []);
	const current = logs.find((entry) => entry.id === open) ?? null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-5 px-4 py-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex flex-wrap items-end justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Vollständig, nichts gekürzt"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "display text-4xl",
					children: "Protokolle"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "btn",
					onClick: onBack,
					children: "Zurück"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					className: "btn",
					role: "button",
					href: "/protokoll.txt",
					download: "echo-bruch-protokoll.txt",
					children: "Simulationsprotokoll"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					className: "btn",
					role: "button",
					href: "/bilanz.txt",
					download: "echo-bruch-bilanz.txt",
					children: "Bilanz"
				})]
			}),
			bilanz && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
				className: "panel max-h-80 overflow-auto whitespace-pre-wrap p-4 text-xs leading-relaxed text-muted",
				children: bilanz
			}),
			logs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Gespeicherte Duelle erscheinen hier, sobald eines endet. Bis zu sechzehn bleiben auf diesem Gerät."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "flex flex-col gap-2",
				children: logs.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "panel w-full px-4 py-3 text-left text-sm",
					onClick: () => setOpen(entry.id === open ? null : entry.id),
					children: [entry.title, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "mt-1 block text-xs text-faint",
						children: [entry.lines.length, " Zeilen"]
					})]
				}) }, entry.id))
			}),
			current && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "panel flex flex-col gap-3 p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "display text-2xl",
						children: current.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn",
						onClick: () => downloadText(`echo-bruch-${current.id}.txt`, current.lines.join("\n")),
						children: "Diese Datei"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "flex max-h-[28rem] flex-col gap-1 overflow-auto text-sm text-muted",
					children: current.lines.map((line, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: line }, `${current.id}-${index}`))
				})]
			})
		]
	});
}
function Battle({ duel, view, beat, dispatch }) {
	const legal = legalFields(duel, view);
	const selected = duel.screen === "deploy" ? duel.setup[duel.focus].field : duel.draft.targetField;
	const lookA = lookOf(view, "A", beat);
	const lookB = lookOf(view, "B", beat);
	const otherSide = beat?.actor === "A" ? "B" : "A";
	const stageSide = (otherSide === "A" ? lookA : lookB) !== "waffe" ? otherSide : beat?.actor ?? otherSide;
	const stageFighter = view.fighters[stageSide];
	const stageLook = stageSide === "A" ? lookA : lookB;
	const stageSrc = plateSrc(stageFighter.characterId, stageFighter.weaponId, beat?.tone === "hit" && stageLook === "waffe" ? "waffe" : stageLook);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative flex h-dvh flex-col overflow-hidden bg-[#0c0e12] text-white",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: backdrop(beat),
				alt: "",
				className: "pointer-events-none absolute inset-0 h-full w-full object-cover opacity-60"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative z-10 flex min-h-0 flex-1 flex-col",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "flex items-center justify-between gap-3 px-4 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "display text-xl",
						children: "ECHO//BRUCH"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-white/60",
						children: duel.screen === "deploy" ? "Aufstellung" : beat ? beat.kicker : `Runde ${view.round} · Planen`
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "btn",
								"aria-label": duel.muted ? "Ton an" : "Ton aus",
								onClick: () => dispatch({ type: "mute" }),
								children: duel.muted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { size: 18 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { size: 18 })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "btn",
								"aria-label": "Regeln",
								onClick: () => dispatch({ type: "codex" }),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, { size: 18 })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "btn",
								onClick: () => dispatch({ type: "title" }),
								children: "Menü"
							})
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-auto px-3 pb-3 lg:grid-cols-[minmax(240px,300px)_minmax(0,1fr)_minmax(240px,300px)] lg:overflow-hidden",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KampfKarte, {
							className: "order-2 lg:order-1",
							f: view.fighters.A,
							tag: duel.mode === "hotseat" ? "Spieler A" : "Du",
							look: lookA,
							featured: duel.focus === "A" && duel.screen !== "scene"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "order-1 flex min-h-0 flex-col gap-3 lg:order-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: `relative min-h-[220px] flex-1 overflow-hidden rounded-2xl border border-white/10 ${beat?.tone === "hit" ? "shake" : ""}`,
									children: duel.screen === "scene" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: stageSrc,
										alt: "",
										className: "plate-in h-full w-full object-cover"
									}, stageSrc) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Board, {
										state: view,
										legal,
										selected,
										focus: beat?.focus ?? [],
										shake: false,
										captions: fieldCaptions(duel, view),
										onPick: (field) => {
											if (duel.screen === "deploy") dispatch({
												type: "field",
												id: field
											});
											else if (legal.includes(field)) dispatch({
												type: "draft",
												plan: {
													...duel.draft,
													targetField: field
												}
											});
										}
									})
								}),
								duel.screen !== "scene" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldNote, {
									duel,
									view
								}),
								beat && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scene, {
									beat,
									duel,
									dispatch
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KampfKarte, {
							className: "order-3",
							f: view.fighters.B,
							tag: duel.mode === "bot" ? "Gegenüber" : "Spieler B",
							look: lookB,
							featured: duel.focus === "B" && duel.screen !== "scene"
						})
					]
				})]
			}),
			duel.screen === "deploy" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
				className: "relative z-10 flex flex-wrap items-center justify-between gap-3 px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-white/70",
					children: [duel.focus === "A" ? "Startfelder 2 oder 4." : "Startfelder 3 oder 5.", " Im Kampf wählst du bei Bewegung ein helles Feld. Der Abstand entscheidet, ob die Waffen reichen."]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn",
						onClick: () => dispatch({ type: "back" }),
						children: "Zurück"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn btn-primary",
						onClick: () => dispatch({ type: "advance" }),
						children: "Duell beginnen"
					})]
				})]
			}),
			duel.screen === "plan" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "relative z-10",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Planner, {
					duel,
					view,
					dispatch
				})
			})
		]
	});
}
function Planner({ duel, view, dispatch }) {
	const f = view.fighters[duel.focus];
	const c = CHARACTERS.find((item) => item.id === f.characterId);
	const draft = duel.draft;
	const ready = preparePlan(view, duel.focus, draft);
	const abilityUsed = f.abilityRound === view.round;
	const canAbility = f.energy >= c.abilityCost && !abilityUsed;
	const predict = Object.entries(f.pattern).filter(([, n]) => n >= 3).map(([k]) => k);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
		className: "relative z-10 max-h-[48vh] overflow-auto border-t border-white/10 bg-black/80 px-3 py-3",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex max-w-5xl flex-col gap-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl border border-white/10 bg-white/5 p-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[10px] uppercase tracking-wide text-white/50",
						children: "Das bewirkt diese Wahl"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-white",
						children: planHint(c, draft, ready, f, view)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-2 gap-2 sm:grid-cols-4",
					children: ACTIONS.map((action) => {
						const Icon = ACTION_ICON[action.id];
						const on = draft.action === action.id && !draft.ability;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: `btn h-auto flex-col gap-1 py-3 ${on ? "btn-on" : ""}`,
							onClick: () => dispatch({
								type: "draft",
								plan: withAction(draft, action.id, view, duel.focus)
							}),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { size: 18 }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: action.name }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-faint",
									children: action.text
								})
							]
						}, action.id);
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-sm text-muted",
							children: ["Energie · ", energyLine(draft.action, draft.energy)]
						}),
						[
							0,
							1,
							2,
							3
						].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							disabled: draft.ability || n > f.energy,
							className: `btn min-w-11 ${draft.energy === n ? "btn-on" : ""}`,
							onClick: () => {
								const next = {
									...draft,
									energy: n,
									ability: false
								};
								if (draft.action === "move") {
									const fields = reachable(f.field, moveSteps(f, n, false), view.fighters[other(f.side)].field);
									if (!fields.includes(next.targetField ?? -1)) next.targetField = fields.sort((a, b) => distance(a, view.fighters[other(f.side)].field) - distance(b, view.fighters[other(f.side)].field))[0] ?? f.field;
								}
								dispatch({
									type: "draft",
									plan: next
								});
							},
							children: n
						}, n)),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							disabled: !canAbility,
							className: `btn ${draft.ability ? "btn-on" : ""}`,
							onClick: () => dispatch({
								type: "draft",
								plan: {
									...draft,
									ability: !draft.ability,
									action: c.abilityAction,
									energy: c.abilityCost
								}
							}),
							children: [
								c.ability,
								" · ",
								c.abilityCost
							]
						})
					]
				}),
				draft.action === "influence" && !draft.ability && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-wrap gap-2",
					children: [
						[
							"spur",
							"Spur",
							"Echo auf dein Feld. Der Archivar verteidigt damit besser."
						],
						[
							"kern",
							"Kern",
							"Zerstört gegnerische Kernpunkte. Drei Kerne sind der Sieg."
						],
						[
							"weaken",
							"Schwächen",
							"Nimmt einem gegnerischen Echo Ladungen."
						],
						[
							"convert",
							"Wandeln",
							"Angriff wird Falle, Schutz Barriere, Bewegung Nebel."
						]
					].map(([id, label, text]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: `btn h-auto max-w-xs flex-col items-start py-2 text-left ${draft.influence === id ? "btn-on" : ""}`,
						onClick: () => dispatch({
							type: "draft",
							plan: {
								...draft,
								influence: id,
								targetField: id === "spur" || id === "convert" ? f.field : view.fighters[other(f.side)].field
							}
						}),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-faint",
							children: text
						})]
					}, id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2 overflow-x-auto",
					children: [REACTIONS.map((reaction) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: `btn h-auto shrink-0 flex-col items-start py-2 text-left ${draft.reaction === reaction.id ? "btn-on" : ""}`,
						onClick: () => dispatch({
							type: "draft",
							plan: {
								...draft,
								reaction: draft.reaction === reaction.id ? null : reaction.id
							}
						}),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							reaction.name,
							" · ",
							reaction.cost
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-faint",
							children: reaction.text
						})]
					}, reaction.id)), f.items.filter((item) => !item.spent).map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: `btn h-auto shrink-0 flex-col items-start py-2 ${draft.itemId === item.id ? "btn-on" : ""}`,
						onClick: () => dispatch({
							type: "draft",
							plan: {
								...draft,
								itemId: draft.itemId === item.id ? null : item.id
							}
						}),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: ITEMS.find((entry) => entry.id === item.id)?.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-faint",
							children: ITEMS.find((entry) => entry.id === item.id)?.text
						})]
					}, item.id))]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [
						f.ruleBreak && [
							"brace",
							"refund",
							"retarget"
						].map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: `btn ${draft.ruleBreak === id ? "btn-on" : ""}`,
							onClick: () => dispatch({
								type: "draft",
								plan: {
									...draft,
									ruleBreak: draft.ruleBreak === id ? null : id
								}
							}),
							children: id === "brace" ? "Regelbruch · 2 Bruch halten" : id === "refund" ? "Regelbruch · Stufe zurück" : "Regelbruch · Ziel ändern"
						}, id)),
						f.nadelReady && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: `btn ${draft.zeitnadel ? "btn-on" : ""}`,
							onClick: () => dispatch({
								type: "draft",
								plan: {
									...draft,
									zeitnadel: !draft.zeitnadel
								}
							}),
							children: "Zeitnadel"
						}),
						(f.toolId === "rauch" || f.artifactId === "rauch") && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: `btn ${draft.mist ? "btn-on" : ""}`,
							onClick: () => dispatch({
								type: "draft",
								plan: {
									...draft,
									mist: !draft.mist
								}
							}),
							children: "Rauchkapsel"
						}),
						(f.toolId === "bruchstein" || f.artifactId === "bruchstein") && f.stoneRound !== view.round && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "btn",
							onClick: () => dispatch({ type: "stone" }),
							children: "Bruchstein"
						}),
						predict.map((kind) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: `btn ${draft.prediction === kind ? "btn-on" : ""}`,
							onClick: () => dispatch({
								type: "draft",
								plan: {
									...draft,
									prediction: draft.prediction === kind ? null : kind
								}
							}),
							children: ["Vorhersage ", ACTIONS.find((a) => a.id === kind)?.name]
						}, kind))
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: planHint(c, draft, ready, f, view)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "sticky bottom-0 bg-surface pt-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn btn-primary w-full",
						onClick: () => {
							cue("idle", duel.muted);
							dispatch({ type: "lock" });
						},
						children: "Plan schließen"
					})
				})
			]
		})
	});
}
function Scene({ beat, duel, dispatch }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "rounded-2xl border border-white/10 bg-black/60 p-4 backdrop-blur-md",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs text-white/50",
				children: [
					"Schlag ",
					duel.frame + 1,
					" von ",
					duel.frames.length,
					" · ",
					beatPlain(beat)
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-1 flex items-end justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "display text-3xl",
					children: beat.title
				}), beat.dice != null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-right",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block text-[10px] uppercase tracking-wide text-white/50",
						children: "Würfel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "display text-5xl tabular-nums text-accent",
						children: beat.dice
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-white/80",
				children: beat.detail
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex flex-wrap items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex gap-1",
					"aria-hidden": "true",
					children: duel.frames.map((_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `pip ${index === duel.frame ? "on-attack" : ""}` }, index))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "btn",
							onClick: () => dispatch({ type: "auto" }),
							"aria-label": duel.auto ? "Szenen anhalten" : "Szenen automatisch",
							children: duel.auto ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { size: 16 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { size: 16 })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "btn",
							onClick: () => dispatch({ type: "step" }),
							children: "Weiter"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "btn",
							onClick: () => dispatch({ type: "skip" }),
							"aria-label": "Runde überspringen",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkipForward, { size: 16 })
						})
					]
				})]
			})
		]
	});
}
function StatLine({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "flex items-center justify-between gap-3 text-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-muted",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "tabular-nums",
			children: value
		})]
	});
}
function GearRow({ title, options, selected, also, onPick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
		className: "mb-2 text-sm text-muted",
		children: title
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid grid-cols-2 gap-2 lg:grid-cols-5",
		children: options.map((option) => {
			const on = option.id === selected || option.id === also;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: `panel p-3 text-left ${on ? "border-fg" : ""}`,
				onClick: () => onPick(option.id),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
						className: "gear-art",
						viewBox: "0 0 128 128",
						"aria-hidden": "true",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("use", { href: `/equipment.svg#${option.id}` })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block font-medium",
						children: option.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mt-1 block text-sm text-muted line-clamp-3",
						children: option.text
					})
				]
			}, option.id);
		})
	})] });
}
function ScreenHead({ kicker, title, action, onBack, onNext }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-wrap items-end justify-between gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted",
			children: kicker
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "display text-4xl",
			children: title
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn",
				onClick: onBack,
				children: "Zurück"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn btn-primary",
				onClick: onNext,
				children: action
			})]
		})]
	});
}
function Sigil({ id }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 48 48",
		className: "h-10 w-10 text-soft",
		"aria-hidden": "true",
		children: [
			id === "brecher" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M8 36 L24 8 L40 36 Z",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.6"
			}),
			id === "laeuferin" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M8 32 C16 8 32 8 40 32",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.6"
			}),
			id === "archivar" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: "10",
				y: "10",
				width: "28",
				height: "28",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.6"
			}),
			id === "waechter" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M8 16 H40 V28 C40 36 32 40 24 40 C16 40 8 36 8 28 Z",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.6"
			}),
			id === "jaeger" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "24",
				cy: "24",
				r: "12",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.6"
			})
		]
	});
}
function Codex({ onClose }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-20 flex items-end justify-center bg-bg/80 p-3 sm:items-center",
		role: "dialog",
		"aria-label": "Regelreferenz",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "panel max-h-[80dvh] w-full max-w-lg overflow-auto p-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "display text-3xl",
					children: "Regelreferenz"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "btn",
					onClick: onClose,
					children: "Schließen"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex flex-col gap-3 text-sm text-muted",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Sieg durch Körper 0, durch drei zerstörte Kern-Echos, oder wenn das Bruchmaximum die letzte Runde beendet." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Jede Runde: Energie +2, verdeckt planen, aufdecken, höherer Aktionswert zuerst, dann Echos und die Schlussprüfung." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Angriff trifft, wenn Würfel plus Angriffswert mindestens die Verteidigung erreicht. Eine 6 verdoppelt den Endschaden." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Schutz mildert den nächsten Treffer. Ausweichen senkt einen Treffer um 2, ohne das Feld zu wechseln. Einfluss legt Spuren, schwächt Echos oder bricht Kerne." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Dieselbe Grundaktion zweimal hintereinander gibt dem Gegner einen Musterpunkt. Bei drei Punkten einer Farbe darfst du vorhersagen." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Ein Regelbruch pro Kampf. Ein Item und eine Reaktion pro Runde." })
				]
			})]
		})
	});
}
function shownState(duel, beat) {
	if (duel.screen === "scene") return beat?.state ?? duel.game;
	if (duel.screen === "deploy") {
		const b = duel.mode === "bot" ? botSetup(duel.setup.A, duel.difficulty) : { ...duel.setup.B };
		if (duel.mode === "bot") b.field = duel.setup.A.field === 4 ? 3 : 5;
		return createGame(duel.setup.A, b, 1);
	}
	return duel.game;
}
function legalFields(duel, view) {
	if (duel.screen === "deploy") return STARTS[duel.focus];
	if (duel.screen !== "plan") return [];
	const f = view.fighters[duel.focus];
	const foe = view.fighters[other(duel.focus)];
	const stats = liveStats(f);
	if (duel.draft.action === "attack") {
		const range = duel.draft.ability && f.characterId === "brecher" ? 1 : stats.range;
		if (f.weaponId === "bogen" && f.statuses.some((s) => s.kind === "bound")) return [];
		return distance(f.field, foe.field) <= range ? [foe.field] : [];
	}
	if (duel.draft.action === "move") {
		const steps = moveSteps(f, duel.draft.ability ? cCost(f) : duel.draft.energy, duel.draft.ability);
		return reachable(f.field, steps, foe.field);
	}
	if (duel.draft.action === "influence" && (duel.draft.influence === "spur" || duel.draft.influence === "convert")) return [f.field];
	if (duel.draft.action === "influence") return distance(f.field, foe.field) <= 3 ? [foe.field] : [];
	return [];
}
function withAction(draft, action, game, side) {
	const f = game.fighters[side];
	const foe = game.fighters[other(side)];
	const next = {
		...draft,
		action,
		ability: false
	};
	if (action === "attack") next.targetField = foe.field;
	if (action === "guard") next.targetField = f.field;
	if (action === "move") next.targetField = reachable(f.field, moveSteps(f, draft.energy, false), foe.field).sort((a, b) => distance(a, foe.field) - distance(b, foe.field))[0] ?? f.field;
	if (action === "influence") next.targetField = foe.field;
	return next;
}
function planHint(c, draft, ready, f, view) {
	const foe = view.fighters[other(f.side)];
	const stats = liveStats(f);
	const foeStats = liveStats(foe);
	const dist = distance(draft.action === "move" && draft.targetField ? draft.targetField : f.field, foe.field);
	if (draft.ability) return `${c.ability}. ${c.abilityText}`;
	if (draft.action === "attack") {
		if (ready.action !== "attack") return `Abstand ${distance(f.field, foe.field)}, deine Reichweite ist ${stats.range}. Der Schlag geht daneben und lässt ein Angriffs-Echo. Beweg dich auf ein helles Feld, das näher liegt.`;
		const raw = stats.weapon + (draft.energy >= 3 ? 2 : draft.energy >= 1 ? 1 : 0);
		return `Du schlägst auf Feld ${foe.field}. Wurf ist Würfel plus Kraftbonus ${stats.kraftB}${draft.energy > 0 ? " plus 1" : ""}. Rohschaden ist etwa ${raw} minus Rüstung ${foeStats.armor}. Ab 2 Energie gibt der Treffer 1 Bruch.`;
	}
	if (draft.action === "guard") return `Der nächste Treffer gegen dich sinkt um ${Math.max(2, stats.schutzB) + (draft.energy >= 1 ? 1 : 0)}. Das ist dein Schutzbonus, mindestens 2.${draft.energy >= 3 ? " Mit 3 Energie bleibt ein Schutz-Echo auf deinem Feld, der den nächsten Schlag noch einmal um 2 senkt." : ""}`;
	if (draft.action === "move") return `Bis zu ${moveSteps(f, draft.energy, false)} Felder. Helle Felder kannst du betreten, der Gegner nicht. Feld ${draft.targetField ?? f.field} lässt Abstand ${dist}: ${dist <= stats.range ? "deine Waffe reicht ihn" : "deine Waffe reicht ihn nicht"}, ${dist <= foeStats.range ? "seine Waffe reicht dich" : "seine Waffe reicht dich nicht"}.${draft.energy >= 2 ? " Mit 2 Energie bleibt dort ein Bewegungs-Echo." : ""} Ausweichen danach braucht noch 2 Energie und nimmt 2 Schaden, löscht den Schlag aber nicht.`;
	if (draft.influence === "kern") return `Kern brechen kostet mindestens 1 Energie und braucht Abstand bis 3. Jetzt ${distance(f.field, foe.field) <= 3 ? "reicht es" : "stehst du zu weit"}. Drei zerstörte Kern-Echos gewinnen, ohne den Körper auf 0 zu bringen.`;
	if (draft.influence === "weaken") return "Du nimmst einem gegnerischen Echo Ladungen. Liegt keins, bricht das Brecheisen einen Schutz- oder Nebelmarker.";
	if (draft.influence === "convert") return "Ein eigenes Echo wechselt die Art. Angriff wird Falle, Schutz wird Barriere, Bewegung wird Nebel, Einfluss wird Riss. Das kostet 1 Energie oder eine Ladung.";
	return "Spur legt ein Einfluss-Echo auf dein Feld. Jedes eigene Echo dort gibt dem Archivar +2 Verteidigung, und ein Treffer gibt dem Angreifer 1 Bruch zurück.";
}
function energyLine(action, energy) {
	if (action === "attack") return energy >= 3 ? "Rohschaden +2, Bruch +1" : energy >= 2 ? "Rohschaden +1, Bruch +1" : energy === 1 ? "Rohschaden +1, Wurf +1" : "kein Zusatz";
	if (action === "guard") return energy >= 3 ? "Schutz-Echo dazu" : energy >= 1 ? "der Abzug ist um 1 höher" : "nur der Schutzbonus";
	if (action === "move") return energy >= 2 ? "zwei Felder weiter und ein Echo" : energy === 1 ? "ein Feld weiter" : "nur die Grundweite";
	return energy >= 2 ? "das Echo bekommt eine Ladung mehr" : energy >= 1 ? "reicht für den Kern" : "nur eine einfache Spur";
}
function beatPlain(beat) {
	if (beat.kicker.includes("Aufdecken")) return "Beide Pläne liegen offen. Der höhere Aktionswert handelt zuerst.";
	if (beat.tone === "hit") return "Der Schlag ist angekommen. Darüber steht, was Waffe, Rüstung, Block oder Ausweichen daraus gemacht haben.";
	if (beat.tone === "miss") return "Vorbei. Die Energie ist weg, ein Angriffs-Echo bleibt auf dem Feld.";
	if (beat.tone === "guard") return "Der nächste Treffer in dieser Runde wird kleiner.";
	if (beat.tone === "move") return "Die Stellung wechselt. Ob die Waffen noch reichen, steht am neuen Abstand.";
	if (beat.tone === "echo") return "Ein Echo liegt jetzt auf einem Feld und ändert den nächsten Schlag.";
	if (beat.tone === "win") return "Das Duell ist entschieden.";
	return "Die Runde endet. Ungenutzte Echos verlieren eine Ladung.";
}
var ECHO_LINE = {
	attack: "Angriffs-Echo: +1 Rohschaden, ab 2 Ladungen auch +1 Bruch.",
	guard: "Schutz-Echo: nächster Treffer −2, ab 2 Ladungen auch −1 Bruch.",
	move: "Bewegungs-Echo: Markierung, dass hier gegangen wurde.",
	influence: "Einfluss-Echo: zählt als eigenes Echo auf diesem Feld.",
	trap: "Falle: wer das Feld betritt, nimmt 1 Bruch.",
	barrier: "Barriere: ein Schlag durch das Feld ist um 2 kleiner.",
	mist: "Nebel: +2 Verteidigung auf diesem Feld.",
	rift: "Riss: wer das Feld verlässt, nimmt 1 Bruch."
};
function fieldCaptions(duel, view) {
	if (duel.screen !== "plan" || duel.draft.action !== "move") return {};
	const foe = view.fighters[other(duel.focus)];
	const mine = liveStats(view.fighters[duel.focus]).range;
	const captions = {};
	for (const id of legalFields(duel, view)) {
		const dist = distance(id, foe.field);
		captions[id] = dist <= mine ? `${dist} nah` : `${dist} weit`;
	}
	return captions;
}
function FieldNote({ duel, view }) {
	const echoes = ["A", "B"].flatMap((side) => view.fighters[side].echoes.map((echo) => ({
		...echo,
		side
	})));
	const selected = duel.screen === "plan" ? duel.draft.targetField : duel.screen === "deploy" ? duel.setup[duel.focus].field : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl border border-white/10 bg-black/55 p-3 text-xs text-white/75",
		children: [
			duel.screen === "deploy" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Helle Felder sind die Startfelder. Näher am Gegner heißt, beide Waffen reichen früher." }),
			duel.screen === "plan" && duel.draft.action === "move" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["Tippe ein helles Feld. „Nah“ heißt, deine Waffe reicht von dort. „Weit“ heißt, du stehst außerhalb deiner Reichweite.", selected ? ` Gewählt ist Feld ${selected}.` : ""] }),
			duel.screen === "plan" && duel.draft.action !== "move" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Das Feld bleibt, bis du Bewegung wählst. Die Ringe zeigen nur, wohin der aktuelle Plan zeigt." }),
			echoes.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-2 flex flex-col gap-1",
				children: echoes.map((echo, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
					"Feld ",
					echo.field,
					" · ",
					ECHO_LINE[echo.kind] ?? echo.kind,
					" · ",
					echo.charges,
					" Ladungen"
				] }, `${echo.side}-${echo.field}-${index}`))
			})
		]
	});
}
function cCost(f) {
	if (f.characterId === "brecher") return 3;
	if (f.characterId === "jaeger") return 1;
	if (f.characterId === "archivar") return 3;
	return 2;
}
function Home() {
	const [archiv, setArchiv] = (0, import_react.useState)(false);
	if (archiv) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameApp, { onBasis: () => setArchiv(false) });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BreachApp, { onArchiv: () => setArchiv(true) });
}
//#endregion
export { Home as component };
