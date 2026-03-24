import { defineCollection, z } from "astro:content";

const placeholder = defineCollection({
  schema: z.object({
    title: z.string().optional(),
  }),
});

export const collections = {
  placeholder,
};
