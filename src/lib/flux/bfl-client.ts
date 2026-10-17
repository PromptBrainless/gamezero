/**
 * Fixed EU BFL Flux API client for Gamezero asset pipeline.
 * Base URL is locked to https://api.eu.bfl.ai (GDPR / EU multi-cluster).
 *
 * Server-side only. Never expose BFL_API_KEY to the browser.
 *
 * Usage:
 *   const client = createBflClient();
 *   const result = await client.generate({
 *     model: "flux-2-pro",
 *     prompt: "pixel art character, cozy cottagecore, side view",
 *     width: 1024,
 *     height: 1024,
 *   });
 *   // result.sample is a temporary URL — download immediately.
 */

import { env } from "../env.server";

const BASE_URL = "https://api.eu.bfl.ai";

export type FluxModel =
  | "flux-2-pro"
  | "flux-2-flex"
  | "flux-2-max"
  | "flux-2-klein-4b"
  | "flux-2-klein-9b"
  | "flux-pro-1.1"
  | "flux-pro-1.1-ultra"
  | "flux-3-image"
  | "flux-3-image-klein";

export interface GenerateParams {
  model: FluxModel;
  prompt: string;
  width?: number;
  height?: number;
  aspect_ratio?: string;
  seed?: number;
  input_image?: string; // URL or base64
  // further model-specific fields can be passed through
  [key: string]: unknown;
}

export interface GenerationResult {
  id: string;
  status: string;
  sample?: string; // temporary delivery URL
  seed?: number;
  raw: Record<string, unknown>;
}

export class BflClient {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) throw new Error("BFL_API_KEY is required");
    this.apiKey = apiKey;
  }

  private headers(): HeadersInit {
    return {
      "x-key": this.apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  async generate(params: GenerateParams, timeoutMs = 180_000): Promise<GenerationResult> {
    const { model, ...body } = params;
    const endpoint = `${BASE_URL}/v1/${model}`;

    const submitRes = await fetch(endpoint, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });

    if (!submitRes.ok) {
      const text = await submitRes.text();
      if (submitRes.status === 402) {
        throw new Error("Insufficient BFL credits. Add credits at dashboard.bfl.ai");
      }
      throw new Error(`BFL submit failed (${submitRes.status}): ${text}`);
    }

    const submitData = (await submitRes.json()) as { id: string; polling_url: string };
    const pollingUrl = submitData.polling_url;
    if (!pollingUrl) throw new Error("No polling_url returned from BFL");

    return this.poll(pollingUrl, timeoutMs);
  }

  private async poll(pollingUrl: string, timeoutMs: number): Promise<GenerationResult> {
    const start = Date.now();
    let delay = 800;

    while (Date.now() - start < timeoutMs) {
      const res = await fetch(pollingUrl, { headers: this.headers() });
      if (!res.ok) {
        throw new Error(`BFL poll failed (${res.status})`);
      }

      const data = (await res.json()) as {
        status: string;
        result?: { sample?: string; seed?: number };
        [key: string]: unknown;
      };

      if (data.status === "Ready") {
        return {
          id: (data.id as string) ?? "unknown",
          status: data.status,
          sample: data.result?.sample,
          seed: data.result?.seed,
          raw: data,
        };
      }

      if (data.status === "Error" || data.status === "Failed" || data.status === "Request Moderated" || data.status === "Content Moderated") {
        throw new Error(`BFL generation failed: ${data.status}`);
      }

      await new Promise((r) => setTimeout(r, delay));
      delay = Math.min(delay * 1.4, 4000);
    }

    throw new Error(`BFL generation timed out after ${timeoutMs}ms`);
  }

  /** Download the temporary result URL to a Buffer (server-side). */
  async downloadSample(sampleUrl: string): Promise<ArrayBuffer> {
    const res = await fetch(sampleUrl);
    if (!res.ok) throw new Error(`Failed to download sample (${res.status})`);
    return res.arrayBuffer();
  }
}

/** Create a client from BFL_API_KEY environment variable. */
export function createBflClient(): BflClient {
  const key = env("BFL_API_KEY");
  if (!key) throw new Error("BFL_API_KEY not set");
  return new BflClient(key);
}
