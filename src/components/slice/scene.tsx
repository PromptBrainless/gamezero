export function Figure({ kind, enemy = false }: { kind: string; enemy?: boolean }) {
  const mage = kind === "scholar_mage" || kind === "hedge_cultist";
  const light = kind === "duelist" || kind === "alley_cutthroat";
  const boss = kind === "iron_captain";
  const cloak = enemy ? "#9e414c" : mage ? "#69aeae" : light ? "#d5b15e" : "#548e82";
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

export function Scene({ career, opponents, selected = 0, encounter = 0, impact = 0, defeated = [] }: { career: string; opponents: string[]; selected?: number; encounter?: number; impact?: number; defeated?: boolean[] }) {
  const forest = encounter === 2;
  return (
    <svg className="slice-scene" viewBox="0 0 1000 470" role="img" aria-label="Gezeichnetes zweidimensionales Schlachtfeld mit deiner Figur links und Gegnern rechts">
      <defs>
        <linearGradient id="slice-sky" x2="0" y2="1"><stop stopColor="#172e48" /><stop offset=".7" stopColor="#537c86" /><stop offset="1" stopColor="#b2ba9d" /></linearGradient>
        <linearGradient id="slice-ground" x2="0" y2="1"><stop stopColor="#506d63" /><stop offset="1" stopColor="#182d37" /></linearGradient>
        <pattern id="slice-grain" width="29" height="23" patternUnits="userSpaceOnUse"><path d="M3 4h2 M16 15h3" stroke="#f0ead1" opacity=".06" /></pattern>
      </defs>
      <rect width="1000" height="470" fill="url(#slice-sky)" />
      <circle cx="743" cy="92" r="42" fill="#e1dbac" opacity=".8" />
      <path d="M0 252 L104 175 L189 223 L295 143 L404 228 L538 166 L663 216 L813 156 L1000 234 V470 H0Z" fill="#35576a" />
      <path d="M0 285 L135 242 L267 285 L424 230 L598 278 L725 244 L866 279 L1000 243 V470 H0Z" fill="#294754" />
      {forest ? Array.from({ length: 12 }, (_, index) => <g key={index} transform={`translate(${index * 97 - 20} ${index % 2 * 19})`}>
        <path d="M43 332 L51 104 L68 100 L66 333Z" fill="#263f44" />
        <path d="M-12 206 L56 28 L117 212 L85 205 L130 257 L-27 255 L17 209Z" fill="#305959" />
        <path d="M17 183 L56 65 L95 185Z" fill="#406c62" />
      </g>) : <g fill="#354f56" stroke="#607a76" strokeWidth="2">
        <path d="M0 328V109H69V91H92V173H137V328Z" />
        <path d="M824 335V112H847V85H875V112H966V82H993V116H1000V335Z" />
        <path d="M315 316V155H342V140H365V155H391V318H369V196Q354 173 339 196V318Z" />
        <path d="M611 316V204H638V185H664V210H692V317Z" />
        <path d="M17 141H50V177H17Z M895 152H918V188H895Z" fill="#172f3c" />
        <path d="M10 208H73 M840 229H977 M323 235H382" fill="none" />
      </g>}
      <path d="M0 351 Q177 319 377 344 T1000 331V470H0Z" fill="url(#slice-ground)" />
      <path d="M0 384 Q287 345 513 386 T1000 365" fill="none" stroke="#97a38b" strokeWidth="3" opacity=".3" />
      {Array.from({ length: 24 }, (_, index) => <path key={index} d={`M${index * 47} ${409 + index % 4 * 12}l18 -3 13 5 -22 5Z`} fill={index % 2 ? "#3e5960" : "#607572"} opacity=".6" />)}
      <g className="slice-idle" transform="translate(194 128) scale(1.04)"><Figure kind={career} /></g>
      {opponents.map((kind, index) => <g key={`${kind}-${index}`} transform={`translate(${opponents.length > 1 ? 605 + index * 170 : 685} ${kind === "iron_captain" ? 82 : 130}) scale(${kind === "iron_captain" ? 1.24 : 1.04})`} opacity={defeated[index] ? .2 : selected === index ? 1 : .68}>
        <Figure kind={kind} enemy />
        {selected === index && <path d="M60 244 L80 254 L100 244" fill="none" stroke="#f2cf76" strokeWidth="3" />}
      </g>)}
      <g fill="#b8bc91"><path d="M93 396l-11-27 16 19 5-32 6 28 16-15-12 28Z" /><path d="M906 395l-8-28 13 19 12-30-4 32 14-17-10 30Z" /></g>
      <rect width="1000" height="470" fill="url(#slice-grain)" pointerEvents="none" />
      {impact > 0 && <g key={impact} className="slice-impact"><path d="M537 173l-12 60 44-28-31 61 36-7-68 70 19-54-37 12 31-47-31 7Z" fill="#f2cf76" /><circle cx="534" cy="257" r="60" fill="none" stroke="#e7dbc0" strokeWidth="2" /></g>}
    </svg>
  );
}