/**
 * Example server function: generate a pixel-art asset via the fixed EU BFL client.
 *
 * Runs only on the server. Requires BFL_API_KEY.
 *
 * Default prompt is taken from docs/art/pixel-art-prompts.md (Duelist character).
 * Result URL is temporary — download and store it right away.
 *
 * Usage from a route loader or client component:
 *   const result = await generatePixelArt({ data: { variant: "duelist" } });
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createBflClient, type FluxModel } from "./bfl-client";

const InputSchema = z.object({
  variant: z.enum(["duelist", "warden", "echo", "ground-path", "status-icon"]).default("duelist"),
  model: z.custom<FluxModel>().default("flux-2-klein-4b"),
  width: z.number().int().min(256).max(2048).default(1024),
  height: z.number().int().min(256).max(2048).default(1024),
  seed: z.number().int().optional(),
});

const PROMPTS: Record<z.infer<typeof InputSchema>["variant"], string> = {
  duelist:
    "pixel art character, side view, standing idle, agile duelist, light leather and cloth, short blade, focused stance, readable silhouette, limited color palette (max 12 colors), subtle breathing idle, clean pixel edges, dark fantasy, grounded, high contrast, mobile-readable, no blur, 64x64 or 96x96 sprite sheet ready",
  warden:
    "pixel art character, side view, standing idle, heavy warden, layered cloth and metal plates, shield on back, grounded stance, readable silhouette, limited color palette (max 12 colors), clean pixel edges, dark fantasy, high contrast, mobile-readable, no blur",
  echo:
    "pixel art character, side view, standing idle, echo mystic, layered robes with faint glowing threads, staff or focus, calm presence, readable silhouette, limited color palette (max 12 colors), clean pixel edges, dark fantasy, high contrast, mobile-readable, no blur",
  "ground-path":
    "pixel art tileset, side-view ground layer, packed earth with subtle wooden planks, seamless horizontal, readable height variation, limited palette, dark fantasy, subtle wear, mobile-friendly contrast, 16x16 or 32x32 base",
  "status-icon":
    "pixel art status icon, small, poison, clear at 16x16, limited palette, high contrast, no text, readable on dark background",
};

export const generatePixelArt = createServerFn({ method: "POST" })
  .validator(InputSchema)
  .handler(async ({ data }) => {
    const client = createBflClient();
    const prompt = PROMPTS[data.variant];

    const result = await client.generate({
      model: data.model,
      prompt,
      width: data.width,
      height: data.height,
      seed: data.seed,
    });

    return {
      id: result.id,
      status: result.status,
      sampleUrl: result.sample,
      seed: result.seed,
      variant: data.variant,
      model: data.model,
      note: "sampleUrl is temporary (expires in minutes). Download immediately and store in your asset pipeline.",
    };
  });

/**
 * Optional: download the sample on the server and return base64 (for small assets).
 * Prefer streaming or direct storage for production.
 */
export const generateAndDownloadPixelArt = createServerFn({ method: "POST" })
  .validator(InputSchema)
  .handler(async ({ data }) => {
    const client = createBflClient();
    const prompt = PROMPTS[data.variant];

    const result = await client.generate({
      model: data.model,
      prompt,
      width: data.width,
      height: data.height,
      seed: data.seed,
    });

    if (!result.sample) {
      throw new Error("No sample URL returned");
    }

    const buffer = await client.downloadSample(result.sample);
    const base64 = Buffer.from(buffer).toString("base64");

    return {
      id: result.id,
      seed: result.seed,
      variant: data.variant,
      mime: "image/png",
      base64,
    };
  });
