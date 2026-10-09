import { useState } from "react";
import { CHARAKTERE, type CharakterId } from "@/game/w100/charaktere";
import { neuerKampf, type Kampf } from "@/game/w100/kampf";
import { foundryPaket, roll20Paket } from "@/game/w100/export";
import { SeitenKampf } from "./seiten-kampf";

export function BreachApp({ onArchiv }: { onArchiv: () => void }) {
  const [kampf, setKampf] = useState<Kampf | null>(null);
  const [a, setA] = useState<CharakterId>("brecher");
  const [b, setB] = useState<CharakterId>("jaeger");
  const [modus, setModus] = useState<"bot" | "gegen">("bot");

  if (!kampf) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-4 py-8">
        <p className="text-xs uppercase tracking-wide text-muted">Neues Kampfsystem</p>
        <h1 className="display text-4xl">Gegenüber</h1>
        <p className="text-sm text-muted">Seitenansicht. Zwei Figuren stehen sich gegenüber. Schlagen, parieren, ausweichen.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Wahl label="Du" value={a} onChange={setA} />
          <Wahl label="Gegenüber" value={b} onChange={setB} />
        </div>
        <div className="flex gap-2">
          <button type="button" className={`btn ${modus === "bot" ? "btn-on" : ""}`} onClick={() => setModus("bot")}>
            Gegen den Bot
          </button>
          <button type="button" className={`btn ${modus === "gegen" ? "btn-on" : ""}`} onClick={() => setModus("gegen")}>
            Zu zweit
          </button>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setKampf(neuerKampf(a, b))}>
          Kampf beginnen
        </button>
        <div className="flex gap-2">
          <button type="button" className="btn" onClick={() => datei("echo-bruch-foundry.json", foundryPaket([]))}>
            Foundry
          </button>
          <button type="button" className="btn" onClick={() => datei("echo-bruch-roll20.json", roll20Paket())}>
            Roll20
          </button>
        </div>
        <button type="button" className="btn" onClick={onArchiv}>
          Altes System
        </button>
      </main>
    );
  }

  return (
    <SeitenKampf kampf={kampf} setKampf={setKampf} modus={modus} onNeu={() => setKampf(null)} onArchiv={onArchiv} />
  );
}

function datei(name: string, inhalt: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(inhalt, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}


function Wahl({ label, value, onChange }: { label: string; value: CharakterId; onChange: (id: CharakterId) => void }) {
  return (
    <label className="text-sm">
      {label}
      <select className="btn mt-1 w-full" value={value} onChange={(event) => onChange(event.target.value as CharakterId)}>
        {CHARAKTERE.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name} · {item.zeile}
          </option>
        ))}
      </select>
    </label>
  );
}
