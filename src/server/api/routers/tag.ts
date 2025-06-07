import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
export const tagRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.tag.findMany({
      orderBy: { name: "asc" },
    });
  }),

  create: protectedProcedure
    .input(
      z.object({ name: z.string().min(1, "Tag name is required").max(50) }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingTag = await ctx.db.tag.findUnique({
        where: { name: input.name },
      });

      if (existingTag) {
        // If tag already exists, return it instead of creating a duplicate
        return existingTag;
      }

      const newTag = await ctx.db.tag.create({
        data: { name: input.name },
      });
      return newTag;
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existingTag = await ctx.db.tag.findUnique({
        where: { id: input.id },
      });

      if (!existingTag) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to delete this Tag.",
        });
      }

      await ctx.db.tag.delete({
        where: { id: input.id },
      });
      return { message: "Tag deleted successfully" };
    }),
});
