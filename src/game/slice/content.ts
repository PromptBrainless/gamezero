import { loadContent } from "./validation";

const runtime = loadContent({
  careers: import.meta.glob<string>("../../../data/careers/*.json", { eager: true, import: "default", query: "?raw" }),
  skills: import.meta.glob<string>("../../../data/skills/*.json", { eager: true, import: "default", query: "?raw" }),
  statuses: import.meta.glob<string>("../../../data/statuses/*.json", { eager: true, import: "default", query: "?raw" }),
  enemies: import.meta.glob<string>("../../../data/enemies/*.json", { eager: true, import: "default", query: "?raw" }),
  bosses: import.meta.glob<string>("../../../data/bosses/*.json", { eager: true, import: "default", query: "?raw" }),
  encounters: import.meta.glob<string>("../../../data/encounters/*.json", { eager: true, import: "default", query: "?raw" }),
  items: import.meta.glob<string>("../../../data/items/*.json", { eager: true, import: "default", query: "?raw" }),
});
if (!runtime.ready) throw new Error(runtime.issues.map((issue) => `${issue.path} ${issue.field}: ${issue.message}`).join("\n"));
export const { careers, skills, statuses, enemies, bosses, items } = runtime.data;
export const encounters = Object.values(runtime.data.encounters).sort((left, right) => left.order - right.order);
export const registry = { skills, statuses, items };

export function resolveEncounter(index: number) {
  const encounter = encounters[index];
  if (!encounter) throw new Error(`Unbekannte Begegnung: ${index}`);
  const opponents = encounter.enemies.map((id) => encounter.type === "boss" ? bosses[id] : enemies[id]);
  return { encounter, opponents, rewards: encounter.rewards.items?.map((id) => items[id]) ?? [] };
}