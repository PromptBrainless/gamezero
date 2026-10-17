/**
 * Completely free image generation client via Pollinations Classic API.
 * No API key, no account, no credits, no BFL.
 *
 * Endpoint: https://image.pollinations.ai/prompt/{encoded-prompt}
 * Returns the image directly as ArrayBuffer.
 *
 * Rate limits apply for anonymous use (roughly one request every 15–45 seconds).
 * Optional small watermark on free tier.
 */

const BASE_URL = "https://image.pollinations.ai/prompt";

export interface PollinationsParams {
  prompt: string;
  width?: number;
  height?: number;
  seed?: number;
  model?: string; // e.g. "flux"
  nologo?: boolean;
}

export class PollinationsClient {
  async generate(params: PollinationsParams): Promise<ArrayBuffer> {
    const {
      prompt,
      width = 1024,
      height = 1024,
      seed,
      model = "flux",
      nologo = true,
    } = params;

    const encoded = encodeURIComponent(prompt);
    const url = new URL(`${BASE_URL}/${encoded}`);
    url.searchParams.set("width", String(width));
    url.searchParams.set("height", String(height));
    url.searchParams.set("model", model);
    if (seed !== undefined) url.searchParams.set("seed", String(seed));
    if (nologo) url.searchParams.set("nologo", "true");

    const res = await fetch(url.toString());
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Pollinations failed (${res.status}): ${text}`);
    }

    return res.arrayBuffer();
  }
}

export function createPollinationsClient(): PollinationsClient {
  return new PollinationsClient();
}
