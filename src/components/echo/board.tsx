import { EDGES, ECHO_LABEL, POS } from "@/game/content";
import type { EchoKind, Side } from "@/game/content";
import type { GameState } from "@/game/model";

const ECHO_CLASS: Record<EchoKind, string> = {
  attack: "var(--color-accent)",
  guard: "var(--color-steel)",
  move: "var(--color-olive)",
  influence: "var(--color-soft)",
  trap: "var(--color-accent)",
  barrier: "var(--color-steel)",
  mist: "var(--color-muted)",
  rift: "var(--color-soft)",
};

export function Board({
  state,
  legal,
  selected,
  focus,
  shake,
  onPick,
  captions = {},
}: {
  state: GameState;
  legal: number[];
  selected: number | null;
  focus: number[];
  shake: boolean;
  onPick?: (field: number) => void;
  captions?: Record<number, string>;
}) {
  const marks = new Map<number, { echoes: { kind: EchoKind; owner: Side; charges: number }[]; marker?: string }>();
  for (let id = 1; id <= 7; id++) marks.set(id, { echoes: [] });
  for (const side of ["A", "B"] as Side[]) {
    for (const echo of state.fighters[side].echoes) {
      marks.get(echo.field)?.echoes.push(echo);
    }
  }
  for (const marker of state.markers) {
    const slot = marks.get(marker.field);
    if (slot) slot.marker = marker.kind;
  }

  return (
    <svg
      viewBox="0 0 1000 1200"
      className={`h-full w-full ${shake ? "shake" : ""}`}
      role="img"
      aria-label="Spielfeld mit sieben Feldern"
    >
      <rect width="1000" height="1200" fill="transparent" />
      {EDGES.map(([a, b]) => {
        const hot = a === selected || b === selected || focus.includes(a) || focus.includes(b);
        return (
          <line
            key={`${a}-${b}`}
            x1={POS[a][0]}
            y1={POS[a][1]}
            x2={POS[b][0]}
            y2={POS[b][1]}
            stroke={hot ? "var(--color-soft)" : "var(--color-line)"}
            strokeWidth={hot ? 8 : 4}
            strokeLinecap="round"
          />
        );
      })}
      {[1, 2, 3, 4, 5, 6, 7].map((id) => {
        const [x, y] = POS[id];
        const hereA = state.fighters.A.field === id;
        const hereB = state.fighters.B.field === id;
        const fighter = hereA ? state.fighters.A : hereB ? state.fighters.B : null;
        const isLegal = legal.includes(id);
        const isSel = selected === id;
        const isFocus = focus.includes(id);
        const slot = marks.get(id)!;
        const fill = fighter
          ? fighter.side === "A"
            ? "var(--color-fg)"
            : "var(--color-accent)"
          : isSel
            ? "var(--color-soft)"
            : "var(--color-raised)";
        const ink = fighter?.side === "B" || isSel ? "var(--color-ink)" : "var(--color-fg)";
        const label = fighter
          ? fighter.characterId === "laeuferin"
            ? "L"
            : fighter.characterId === "waechter"
              ? "W"
              : fighter.characterId === "archivar"
                ? "A"
                : fighter.characterId === "brecher"
                  ? "B"
                  : "J"
          : String(id);
        return (
          <g
            key={id}
            onClick={() => onPick?.(id)}
            className={onPick ? "cursor-pointer" : ""}
            role={onPick ? "button" : undefined}
            aria-label={`Feld ${id}${fighter ? `, ${fighter.side}` : ""}`}
          >
            {(isLegal || isFocus) && (
              <circle
                cx={x}
                cy={y}
                r="58"
                fill="none"
                stroke={isFocus ? "var(--color-fg)" : "var(--color-soft)"}
                strokeWidth="2"
                strokeDasharray={isLegal && !isFocus ? "4 6" : undefined}
              />
            )}
            <circle cx={x} cy={y} r="46" fill={fill} stroke="var(--color-line)" strokeWidth="3" />
            <text
              x={x}
              y={y + 2}
              textAnchor="middle"
              dominantBaseline="central"
              fill={fighter ? ink : "var(--color-fg)"}
              fontFamily="Fraunces, Palatino, serif"
              fontSize={fighter ? 28 : 26}
              fontWeight={600}
            >
              {label}
            </text>
            <text
              x={x}
              y={y + 34}
              textAnchor="middle"
              fill="var(--color-muted)"
              fontFamily="Outfit, sans-serif"
              fontSize="13"
            >
              {captions[id] ?? (fighter ? "" : "")}
            </text>
            {slot.echoes.slice(0, 4).map((echo, index) => (
              <circle
                key={`${echo.kind}-${index}`}
                cx={x - 30 + index * 16}
                cy={y + 62}
                r="6"
                fill={ECHO_CLASS[echo.kind]}
              >
                <title>
                  {ECHO_LABEL[echo.kind]} {echo.charges}
                </title>
              </circle>
            ))}
            {slot.marker && (
              <text
                x={x}
                y={y - 62}
                textAnchor="middle"
                fill="var(--color-muted)"
                fontFamily="Outfit, sans-serif"
                fontSize="13"
              >
                {slot.marker === "brand"
                  ? "Brand"
                  : slot.marker === "mist"
                    ? "Nebel"
                    : slot.marker === "guard"
                      ? "Schutz"
                      : slot.marker === "bind"
                        ? "Fessel"
                        : slot.marker === "rift"
                          ? "Riss"
                          : "Spiegel"}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
