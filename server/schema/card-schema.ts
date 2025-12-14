import * as z from "zod";

export const cardSchema = z.object({
  value: z.number(),
  suit: z.enum(["hearts", "diamonds", "clubs", "spades"]),
  hidden: z.boolean(),
});
