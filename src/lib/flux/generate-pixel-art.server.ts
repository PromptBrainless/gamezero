import "@tanstack/react-start/server-only";

// FLUX.2-dev (https://github.com/black-forest-labs/flux2) braucht CUDA und ein
// freigeschaltetes Hugging-Face-Gewicht. Beides fehlt in diesem Web-Runtime.
// Dieselbe Aufrufform — generatePixelArt({ data: { variant, width, height } }) —
// liefert das Sprite als Base64 über die xAI-Bildschnittstelle.

const prompts = {
  duelist: "Single full-body pixel-art sprite of a slender dusk duelist, three-quarter side view facing right, rapier held low, cream and gold cloth, dark hair, hard 16-bit pixels, limited palette of ink, gold, and muted teal, flat background #1a201e, no scenery, no text, no watermark, centered character",
  mercenary: "Single full-body pixel-art sprite of a broad frontline mercenary, side view facing right, iron sword and round buckler, leather jerkin, moss and ember colors, hard 16-bit pixels, limited palette, flat background #1a201e, no scenery, no text, no watermark, centered character",
  scholar_mage: "Single full-body pixel-art sprite of a focused scholar mage, side view facing right, oak staff with a pale teal flame, grey-green robe, hard 16-bit pixels, limited palette of ink, gold, and mint, flat background #1a201e, no scenery, no text, no watermark, centered character",
} as const;

export type PixelVariant = keyof typeof prompts;

const cache = new Map<string, string>();

export async function renderPixelArt(data: { variant: PixelVariant; width: number; height: number }) {
  const key = `${data.variant}:${data.width}x${data.height}`;
  const cached = cache.get(key);
  if (cached) return { base64: cached };

  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error("Bildgenerator ist in dieser Umgebung nicht verfügbar.");

  const resolution = data.width >= 1536 || data.height >= 1536 ? "2k" : "1k";
  const aspectRatio = data.width === data.height ? "1:1" : data.width > data.height ? "3:2" : "2:3";
  const response = await fetch("https://api.x.ai/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-imagine-image",
      prompt: prompts[data.variant],
      n: 1,
      resolution,
      aspect_ratio: aspectRatio,
      response_format: "b64_json",
    }),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 160);
    throw new Error(`Bildgenerator ${response.status}: ${detail}`);
  }

  const body = (await response.json()) as { data?: { b64_json?: string; url?: string }[] };
  const first = body.data?.[0];
  let base64 = first?.b64_json;
  if (!base64 && first?.url) {
    const image = await fetch(first.url);
    if (!image.ok) throw new Error("Bildadresse ließ sich nicht laden.");
    base64 = Buffer.from(await image.arrayBuffer()).toString("base64");
  }
  if (!base64) throw new Error("Kein Bild zurückgekommen.");
  cache.set(key, base64);
  return { base64 };
}
