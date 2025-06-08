import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const userRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    // Return only necessary user info for assignees
    const allUsers = await ctx.db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: { name: "asc" },
    });
    return allUsers;
  }),

  getProfile: protectedProcedure.query(async ({ ctx }) => {
    // Get current user's full profile
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        // Add any other non-sensitive fields from your User model that can be viewed
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User profile not found.",
      });
    }
    return user;
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        // Add other fields you want to allow users to update
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updatedUser = await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          name: input.name,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });
      return updatedUser;
    }),
  getAllAssignedTasks: protectedProcedure.query(async ({ ctx }) => {
    // Return the assigned tasks for the user
    const tasks = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      include: {
        assignedTasks: true,
      },
    });
    return tasks;
  }),
});
