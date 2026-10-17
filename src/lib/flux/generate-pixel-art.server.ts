/**
 * Free pixel-art generation server function (Pollinations Classic API).
 * No API key, no credits, no BFL.
 *
 * Returns the image as base64.
 *
 * Usage:
 *   const result = await generatePixelArt({ data: { variant: "duelist" } });
 *   // result.base64 is the image
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createPollinationsClient } from "./pollinations-client";

const InputSchema = z.object({
  variant: z.enum(["duelist", "warden", "echo", "ground-path", "status-icon"]).default("duelist"),
  width: z.number().int().min(256).max(1024).default(1024),
  height: z.number().int().min(256).max(1024).default(1024),
  seed: z.number().int().optional(),
  model: z.string().default("flux"),
});

const PROMPTS: Record<z.infer<typeof InputSchema>["variant"], string> = {
  duelist:
    "pixel art character, side view, standing idle, agile duelist, light leather and cloth, short blade, focused stance, readable silhouette, limited color palette (max 12 colors), clean pixel edges, dark fantasy, grounded, high contrast, mobile-readable, no blur",
  warden:
    "pixel art character, side view, standing idle, heavy warden, layered cloth and metal plates, shield on back, grounded stance, readable silhouette, limited color palette, clean pixel edges, dark fantasy, high contrast, mobile-readable, no blur",
  echo:
    "pixel art character, side view, standing idle, echo mystic, layered robes with faint glowing threads, staff or focus, calm presence, readable silhouette, limited color palette, clean pixel edges, dark fantasy, high contrast, mobile-readable, no blur",
  "ground-path":
    "pixel art tileset, side-view ground layer, packed earth with subtle wooden planks, seamless horizontal, readable height variation, limited palette, dark fantasy, subtle wear, mobile-friendly contrast",
  "status-icon":
    "pixel art status icon, small, poison, clear at 16x16, limited palette, high contrast, no text, readable on dark background",
};

export const generatePixelArt = createServerFn({ method: "POST" })
  .validator(InputSchema)
  .handler(async ({ data }) => {
    const client = createPollinationsClient();
    const prompt = PROMPTS[data.variant];

    const buffer = await client.generate({
      prompt,
      width: data.width,
      height: data.height,
      seed: data.seed,
      model: data.model,
      nologo: true,
    });

    const base64 = Buffer.from(buffer).toString("base64");

    return {
      variant: data.variant,
      model: data.model,
      seed: data.seed,
      mime: "image/jpeg",
      base64,
      note: "Free via Pollinations Classic API. No key, no BFL.",
    };
  });
