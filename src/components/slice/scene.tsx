export type SceneHit = { slot: "player" | number; amount: number; kind: "damage" | "heal" };
export type SceneFx = { seq: number; action: "strike" | "cast" | "guard" | "item" | "rest" | "skip" | null; target: number; hits: SceneHit[] };

const idleFx: SceneFx = { seq: 0, action: null, target: 0, hits: [] };

const enemyPalette: Record<string, string> = { alley_cutthroat: "#9e414c", rusted_deserter: "#8a6f48", hedge_cultist: "#6f4d84", iron_captain: "#4f6878" };

export function Figure({ kind, enemy = false }: { kind: string; enemy?: boolean }) {
  const mage = kind === "scholar_mage" || kind === "hedge_cultist";
  const light = kind === "duelist" || kind === "alley_cutthroat";
  const boss = kind === "iron_captain";
  const cloak = enemy ? enemyPalette[kind] ?? "#9e414c" : mage ? "#69aeae" : light ? "#d5b15e" : "#548e82";
  return (
    <g transform={enemy ? "translate(160 0) scale(-1 1)" : undefined}>
      <ellipse cx="80" cy="231" rx="58" ry="9" fill="#111d25" opacity=".55" />
      <path d="M58 85 Q25 124 24 213 L91 216 L119 91 Z" fill={cloak} />
      <path d="M55 93 L38 211 L61 209 L78 112 Z" fill="#101e2b" opacity=".4" />
      <path d="M57 151 L53 217 L70 224 L78 158 M85 157 L99 218 L116 223 L104 149" fill="none" stroke="#273747" strokeWidth="16" strokeLinejoin="round" />
      <path d="M47 219 L73 221 M96 221 L123 223" stroke="#111e29" strokeWidth="12" strokeLinecap="round" />
      <path d="M57 87 L96 84 L110 146 L55 155 Z" fill={mage ? "#345966" : "#657b85"} stroke="#1b303e" strokeWidth="3" />
      <path d="M63 99 L95 95 L96 132 L62 138 Z" fill={mage ? cloak : "#9cb0b2"} />
      <path d="M61 143 L107 140" stroke="#d2b676" strokeWidth="8" />
      <path d="M99 95 L119 119 L137 107" fill="none" stroke="#405763" strokeWidth="14" strokeLinecap="round" />
      <circle cx="139" cy="108" r="7" fill="#d6a588" />
      <path d="M57 99 L43 134 L62 150" fill="none" stroke="#405763" strokeWidth="14" strokeLinecap="round" />
      <path d="M69 83 L70 70 L91 68 L92 88" fill="#c0927c" />
      <path d="M60 46 Q63 22 83 24 Q109 25 103 55 L97 73 L79 80 L66 66 Z" fill="#d8aa8a" />
      <path d="M60 48 L60 32 L77 20 L98 25 L109 43 L100 59 L91 35 L68 43 L65 65 Z" fill={mage ? "#d3d8c7" : "#263746"} />
      <path d="M91 51 L99 53 M83 64 L94 65" stroke="#5e4e4b" strokeWidth="2" />
      {mage ? <g>
        <path d="M136 216 L146 52" stroke="#c2a66d" strokeWidth="6" />
        <path d="M134 47 L147 28 L158 49 L145 66 Z" fill="#96e0cf" stroke="#d6f4d9" strokeWidth="2" />
        <circle cx="146" cy="48" r="23" fill="#8cdccf" opacity=".1" />
      </g> : light ? <g>
        <path d="M127 123 L155 66" stroke="#e0e7d8" strokeWidth="4" />
        <path d="M123 111 L143 122" stroke="#d5b15e" strokeWidth="5" />
      </g> : <g>
        <path d="M136 122 L145 57 L157 66 L144 126 Z" fill="#e0e7d8" />
        <path d="M124 120 L156 126" stroke="#d5b15e" strokeWidth="5" />
        <path d={boss ? "M28 104 L78 93 L83 167 L55 199 L20 163 Z" : "M28 116 L70 105 L76 156 L53 178 L25 155 Z"} fill={cloak} stroke="#c1b687" strokeWidth="4" />
        <path d="M48 117 L54 158 M33 137 L66 131" stroke="#d1d8bd" strokeWidth="4" />
      </g>}
      {boss && <path d="M57 49 L60 23 L101 22 L113 50 L99 73 L67 74 Z M65 40 L103 39" fill="#617980" stroke="#c5bc99" strokeWidth="4" />}
    </g>
  );
}

const arenas = [
  { sky: ["#3a2340", "#99543f", "#d9a05f"], ground: ["#5d564a", "#231d20"], far: "#43304a", mid: "#352736", stoneA: "#4f4344", stoneB: "#6d5f55", path: "#b09a7c" },
  { sky: ["#2e4350", "#7d9697", "#c2bb9b"], ground: ["#566753", "#1c2a2b"], far: "#3e5660", mid: "#32464e", stoneA: "#45565a", stoneB: "#6b7a6f", path: "#a3ab8e" },
  { sky: ["#13302f", "#3f6e5f", "#9cb582"], ground: ["#3e6050", "#14272b"], far: "#24473f", mid: "#1d3a36", stoneA: "#34504a", stoneB: "#54705f", path: "#8aa07e" },
  { sky: ["#0b1527", "#1d3350", "#415972"], ground: ["#3c4f63", "#101b2b"], far: "#17293f", mid: "#20374e", stoneA: "#324256", stoneB: "#4e6072", path: "#8e9cab" },
];

function enemyAnchor(index: number, count: number, kind: string) {
  const boss = kind === "iron_captain";
  const s = boss ? 1.24 : 1.04;
  const x = count > 1 ? 605 + index * 170 : 685;
  const y = boss ? 82 : 130;
  return { x, y, s, cx: x + 80 * s, cy: y + 125 * s, top: y + 12 * s, ground: y + 231 * s };
}

const playerAnchor = { x: 194, y: 128, s: 1.04, cx: 277, cy: 258, top: 141, ground: 368 };

function AlleyDusk() {
  return (
    <g>
      <circle cx="500" cy="150" r="58" fill="#f3c17e" opacity=".85" />
      <circle cx="500" cy="150" r="90" fill="#f3c17e" opacity=".12" />
      <g fill="#2c2030" stroke="#54404e" strokeWidth="2">
        <path d="M0 330V96H58L70 72L84 96H128V330Z" />
        <path d="M128 330V180H196V150H238V330Z" />
        <path d="M818 330V120H872V88H906V120H1000V330Z" />
        <path d="M744 330V210H818V330Z" />
      </g>
      <g fill="#ffb45e" className="fx-window">
        <rect x="24" y="128" width="16" height="22" /><rect x="76" y="128" width="16" height="22" />
        <rect x="150" y="200" width="14" height="19" /><rect x="846" y="146" width="16" height="22" />
        <rect x="922" y="160" width="16" height="22" /><rect x="770" y="236" width="14" height="18" />
      </g>
      <path d="M128 110 Q400 180 744 128" fill="none" stroke="#1d1620" strokeWidth="3" />
      {[240, 420, 590, 700].map((x, index) => {
        const y = 110 + Math.round(48 * Math.sin((x - 128) / 616 * Math.PI));
        return <g key={x}><path d={`M${x} ${y} v12`} stroke="#1d1620" strokeWidth="3" /><rect x={x - 7} y={y + 12} width="14" height="18" rx="3" fill="#3a2a2c" stroke="#54404e" /><circle cx={x} cy={y + 21} r="5" fill="#ffc46e" className="fx-lantern" style={{ animationDelay: `${index * 0.9}s` }} /><circle cx={x} cy={y + 21} r="16" fill="#ffc46e" opacity=".14" className="fx-lantern" style={{ animationDelay: `${index * 0.9}s` }} /></g>;
      })}
      {Array.from({ length: 10 }, (_, index) => <circle key={index} className="fx-mote" style={{ animationDelay: `${-index * 1.3}s`, animationDuration: `${8 + index % 4}s` }} cx={(index * 137 + 60) % 1000} cy={180 + (index * 53) % 170} r={index % 3 ? 1.6 : 2.4} fill="#f3cf96" />)}
    </g>
  );
}

function RuinedRoad() {
  return (
    <g>
      <circle cx="790" cy="100" r="40" fill="#e7e3c4" opacity=".7" />
      <g fill="#8d9489" opacity=".8"><path d="M330 92 l9 -5 9 5 -9 2Z" /><path d="M380 74 l8 -4 8 4 -8 2Z" /><path d="M296 70 l7 -4 7 4 -7 2Z" /></g>
      <g fill="#50625f" stroke="#6d7f78" strokeWidth="3">
        <path d="M60 335 V150 h42 V335 Z M210 335 V150 h42 V335 Z" />
        <path d="M48 162 Q156 74 264 162 L246 176 Q156 104 66 176 Z" />
        <path d="M96 150 h120 l-8 -16 h-104 Z" fill="#43534f" />
      </g>
      <path d="M560 318 L720 300 L724 322 L564 342 Z M736 296 L800 288 L803 308 L739 317 Z" fill="#5c6e68" stroke="#73857c" strokeWidth="3" />
      <ellipse cx="640" cy="334" rx="96" ry="9" fill="#101e22" opacity=".35" />
      <path d="M884 338 V260 h34 l6 24 v54 Z" fill="#55675f" stroke="#73857c" strokeWidth="3" />
      <path d="M893 282 h16 M893 300 h16" stroke="#3b4c47" strokeWidth="3" />
      {Array.from({ length: 3 }, (_, index) => <ellipse key={index} className="fx-mist" style={{ animationDelay: `${-index * 4}s` }} cx={200 + index * 320} cy={344 + index * 14} rx="190" ry="17" fill="#cfd8c2" opacity=".09" />)}
    </g>
  );
}

function HedgeClearing() {
  return (
    <g>
      {Array.from({ length: 12 }, (_, index) => <g key={index} transform={`translate(${index * 97 - 20} ${index % 2 * 19})`}>
        <path d="M43 332 L51 104 L68 100 L66 333Z" fill="#263f44" />
        <path d="M-12 206 L56 28 L117 212 L85 205 L130 257 L-27 255 L17 209Z" fill="#305959" />
        <path d="M17 183 L56 65 L95 185Z" fill="#406c62" />
      </g>)}
      <path d="M0 340 Q60 296 130 338 Q200 292 280 336 Q350 298 430 338 Q510 294 590 336 Q660 298 740 338 Q820 294 900 336 Q950 306 1000 338 V380 H0 Z" fill="#2c4f3f" />
      <path d="M0 348 Q80 318 170 348 Q260 316 360 348 Q460 318 560 348 Q660 316 760 348 Q860 318 1000 348 V386 H0 Z" fill="#234236" opacity=".9" />
      {Array.from({ length: 8 }, (_, index) => <circle key={index} className="fx-firefly" style={{ animationDelay: `${-index * 1.7}s`, animationDuration: `${5 + index % 3}s` }} cx={(index * 173 + 90) % 1000} cy={240 + (index * 67) % 110} r="2.4" fill="#d8f2a0" />)}
    </g>
  );
}

function FortressGate() {
  return (
    <g>
      <circle cx="812" cy="84" r="34" fill="#dfe8ef" opacity=".9" />
      <circle cx="812" cy="84" r="58" fill="#dfe8ef" opacity=".1" />
      <g fill="#273d52" stroke="#3b5469" strokeWidth="3">
        <path d="M0 350 V160 h92 v-26 h30 v26 h756 v-26 h30 v26 h92 V350 Z" />
        <path d="M110 160 V96 h26 v-18 h22 v18 h26 v64 Z M816 160 V96 h26 v-18 h22 v18 h26 v64 Z" />
      </g>
      <path d="M0 160 h1000 M0 176 h1000" stroke="#1b2e40" strokeWidth="3" opacity=".7" />
      {Array.from({ length: 18 }, (_, index) => <rect key={index} x={index * 56 + 8} y={142} width="26" height="18" fill="#1b2e40" />)}
      <path d="M430 350 V218 Q500 168 570 218 V350 Z" fill="#101c2b" stroke="#3b5469" strokeWidth="4" />
      {Array.from({ length: 5 }, (_, index) => <path key={index} d={`M${452 + index * 24} 350 V${206 + Math.abs(index - 2) * 8}`} stroke="#45596c" strokeWidth="5" />)}
      <path d="M430 262 H570" stroke="#45596c" strokeWidth="5" />
      {[86, 914].map((x, side) => <g key={x}>
        <path d={`M${x - 5} 350 V268 h10 V350 Z`} fill="#22384c" stroke="#3b5469" strokeWidth="2" />
        <path d={`M${x - 20} 268 h40 l-7 -18 h-26 Z`} fill="#30465a" stroke="#3b5469" strokeWidth="2" />
        <path d={`M${x} 250 Q${x - 11} 232 ${x - 3} 216 Q${x + 2} 230 ${x + 9} 221 Q${x + 12} 240 ${x} 250`} fill="#f3a154" className="fx-flame" style={{ animationDelay: `${side * 0.4}s` }} />
        <circle cx={x} cy={236} r="26" fill="#f3a154" opacity=".12" className="fx-lantern" />
        {Array.from({ length: 4 }, (_, index) => <circle key={index} className="fx-ember" style={{ animationDelay: `${-index * 1.4 - side * 0.7}s` }} cx={x - 8 + index * 6} cy={240} r="1.8" fill="#ffc678" />)}
      </g>)}
      {Array.from({ length: 16 }, (_, index) => <circle key={index} className="fx-snow" style={{ animationDelay: `${-index * 1.1}s`, animationDuration: `${7 + index % 5}s` }} cx={(index * 131 + 45) % 1000} cy="-12" r={index % 3 ? 1.8 : 2.6} fill="#e8eef2" opacity=".8" />)}
    </g>
  );
}

function ImpactFx({ action, cx, cy }: { action: SceneFx["action"]; cx: number; cy: number }) {
  if (action === "strike") return (
    <g className="fx-burst" transform={`translate(${cx} ${cy})`}>
      <path d="M-58 -42 Q0 -72 58 -16" fill="none" stroke="#f6e6bd" strokeWidth="7" strokeLinecap="round" />
      <path d="M-50 -10 Q0 -44 52 12" fill="none" stroke="#f2cf76" strokeWidth="4" strokeLinecap="round" />
      <path d="M-20 -58 l-8 22 M26 -52 l2 24 M48 8 l18 10 M-44 18 l-20 6" stroke="#fff3d6" strokeWidth="3" strokeLinecap="round" />
    </g>);
  if (action === "cast") return (
    <g transform={`translate(${cx} ${cy - 20})`}>
      <g className="fx-cast">
        <circle r="34" fill="none" stroke="#9fe6da" strokeWidth="5" />
        <circle r="14" fill="#c9f4ec" opacity=".8" />
        {Array.from({ length: 6 }, (_, index) => { const angle = index * Math.PI / 3; return <path key={index} d={`M${Math.cos(angle) * 44} ${Math.sin(angle) * 44} l${Math.cos(angle) * 16} ${Math.sin(angle) * 16}`} stroke="#8cdccf" strokeWidth="4" strokeLinecap="round" />; })}
      </g>
    </g>);
  return null;
}

export function Scene({ career, opponents, selected = 0, encounter = 0, fx = idleFx, defeated = [], telegraphs = [], playerDown = false }: { career: string; opponents: string[]; selected?: number; encounter?: number; fx?: SceneFx; defeated?: boolean[]; telegraphs?: boolean[]; playerDown?: boolean }) {
  const arena = arenas[encounter] ?? arenas[0];
  const targetAnchor = enemyAnchor(fx.target, opponents.length, opponents[fx.target] ?? "");
  const playerHit = fx.hits.find((hit) => hit.slot === "player");
  const offensive = fx.action === "strike" || fx.action === "cast";
  return (
    <svg className="slice-scene" viewBox="0 0 1000 470" role="img" aria-label="Gezeichnetes zweidimensionales Schlachtfeld mit deiner Figur links und Gegnern rechts">
      <defs>
        <linearGradient id={`slice-sky-${encounter}`} x2="0" y2="1"><stop stopColor={arena.sky[0]} /><stop offset=".7" stopColor={arena.sky[1]} /><stop offset="1" stopColor={arena.sky[2]} /></linearGradient>
        <linearGradient id={`slice-ground-${encounter}`} x2="0" y2="1"><stop stopColor={arena.ground[0]} /><stop offset="1" stopColor={arena.ground[1]} /></linearGradient>
        <pattern id="slice-grain" width="29" height="23" patternUnits="userSpaceOnUse"><path d="M3 4h2 M16 15h3" stroke="#f0ead1" opacity=".06" /></pattern>
      </defs>
      <rect width="1000" height="470" fill={`url(#slice-sky-${encounter})`} />
      <path d="M0 252 L104 175 L189 223 L295 143 L404 228 L538 166 L663 216 L813 156 L1000 234 V470 H0Z" fill={arena.far} />
      <path d="M0 285 L135 242 L267 285 L424 230 L598 278 L725 244 L866 279 L1000 243 V470 H0Z" fill={arena.mid} />
      {encounter === 0 ? <AlleyDusk /> : encounter === 1 ? <RuinedRoad /> : encounter === 2 ? <HedgeClearing /> : <FortressGate />}
      <path d="M0 351 Q177 319 377 344 T1000 331V470H0Z" fill={`url(#slice-ground-${encounter})`} />
      <path d="M0 384 Q287 345 513 386 T1000 365" fill="none" stroke={arena.path} strokeWidth="3" opacity=".3" />
      {Array.from({ length: 24 }, (_, index) => <path key={index} d={`M${index * 47} ${409 + index % 4 * 12}l18 -3 13 5 -22 5Z`} fill={index % 2 ? arena.stoneA : arena.stoneB} opacity=".6" />)}

      <g transform={`translate(${playerAnchor.x} ${playerAnchor.y}) scale(1.04)`}>
        <g key={`stance-${offensive || playerHit ? fx.seq : "idle"}`} className={playerDown ? "fx-fall" : playerHit ? "fx-hit-l" : fx.action === "strike" ? "fx-lunge" : fx.action === "cast" ? "fx-channel" : "slice-idle"}>
          <Figure kind={career} />
        </g>
      </g>
      {fx.action === "guard" && <g key={`guard-${fx.seq}`} className="fx-guard"><path d="M332 170 Q364 228 332 300" fill="none" stroke="#9fe6da" strokeWidth="8" strokeLinecap="round" /><path d="M318 184 Q344 228 318 284" fill="none" stroke="#c9f4ec" strokeWidth="4" strokeLinecap="round" opacity=".7" /></g>}
      {(fx.action === "item" || fx.action === "rest") && <g key={`aid-${fx.seq}`}>{Array.from({ length: 3 }, (_, index) => <g key={index} className="fx-wisp" style={{ animationDelay: `${index * 0.14}s` }} transform={`translate(${playerAnchor.cx - 26 + index * 26} ${playerAnchor.cy - 20 - index % 2 * 14})`}>{fx.action === "item" ? <path d="M-6 0 h12 M0 -6 v12" stroke="#9fe3a8" strokeWidth="5" strokeLinecap="round" /> : <circle r="5" fill="#b5d78e" />}</g>)}</g>}

      {opponents.map((kind, index) => {
        const anchor = enemyAnchor(index, opponents.length, kind);
        const hit = fx.hits.find((entry) => entry.slot === index);
        return (
          <g key={`${kind}-${index}`} transform={`translate(${anchor.x} ${anchor.y}) scale(${anchor.s})`} opacity={defeated[index] ? undefined : selected === index ? 1 : .72}>
            <g key={`state-${defeated[index] ? "down" : hit ? fx.seq : "idle"}`} className={defeated[index] ? "fx-fall" : hit ? "fx-hit-r" : "slice-sway"} style={defeated[index] || hit ? undefined : { animationDelay: `${-index * 1.3}s` }}>
              <Figure kind={kind} enemy />
            </g>
          </g>
        );
      })}

      {opponents.map((kind, index) => {
        const anchor = enemyAnchor(index, opponents.length, kind);
        return (
          <g key={`marks-${kind}-${index}`}>
            {selected === index && !defeated[index] && <ellipse className="fx-ring" cx={anchor.cx} cy={anchor.ground} rx={62 * anchor.s} ry={10 * anchor.s} fill="none" stroke="#f2cf76" strokeWidth="3" />}
            {telegraphs[index] && !defeated[index] && <g className="fx-telegraph" transform={`translate(${anchor.cx} ${anchor.top - 26})`}><path d="M0 -15 L11 0 L0 15 L-11 0 Z" fill="#1a201e" stroke="#f2cf76" strokeWidth="2.5" /><path d="M0 -7 v8 M0 7 v.5" stroke="#f2cf76" strokeWidth="3" strokeLinecap="round" /></g>}
          </g>
        );
      })}

      {fx.seq > 0 && offensive && <g key={`impact-${fx.seq}`}><ImpactFx action={fx.action} cx={targetAnchor.cx} cy={targetAnchor.cy} /></g>}
      {fx.seq > 0 && playerHit && playerHit.kind === "damage" && <g key={`counter-${fx.seq}`} className="fx-burst" transform={`translate(${playerAnchor.cx} ${playerAnchor.cy})`}><path d="M48 -38 Q0 -62 -46 -10" fill="none" stroke="#e8795f" strokeWidth="6" strokeLinecap="round" /><path d="M20 -50 l4 20 M-34 -26 l-14 12" stroke="#f0a18b" strokeWidth="3" strokeLinecap="round" /></g>}

      {fx.seq > 0 && fx.hits.map((hit) => {
        const anchor = hit.slot === "player" ? playerAnchor : enemyAnchor(hit.slot, opponents.length, opponents[hit.slot] ?? "");
        const fill = hit.kind === "heal" ? "#9fe3a8" : hit.slot === "player" ? "#ff937b" : "#ffd98a";
        return <text key={`hit-${fx.seq}-${hit.slot}`} className="fx-float" x={anchor.cx} y={anchor.top - 8} textAnchor="middle" fill={fill} stroke="#141a18" strokeWidth="5" paintOrder="stroke" fontSize="34" fontWeight="700" fontFamily="Fraunces, serif">{hit.kind === "heal" ? `+${hit.amount}` : `−${hit.amount}`}</text>;
      })}

      <g fill={arena.path} opacity=".85"><path d="M93 396l-11-27 16 19 5-32 6 28 16-15-12 28Z" /><path d="M906 395l-8-28 13 19 12-30-4 32 14-17-10 30Z" /></g>
      <rect width="1000" height="470" fill="url(#slice-grain)" pointerEvents="none" />
    </svg>
  );
}
