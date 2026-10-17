import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  variant: z.enum(["duelist", "mercenary", "scholar_mage"]),
  width: z.number().int().min(512).max(2048).default(1024),
  height: z.number().int().min(512).max(2048).default(1024),
});

export const generatePixelArt = createServerFn({ method: "POST" })
  .validator((input: unknown) => schema.parse(input))
  .handler(async ({ data }) => {
    const { renderPixelArt } = await import("./generate-pixel-art.server");
    return renderPixelArt(data);
  });
