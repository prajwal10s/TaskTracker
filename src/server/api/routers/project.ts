import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const projectRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    // Get projects where the user is either the creator or a member
    const projects = await ctx.db.project.findMany({
      where: {
        OR: [
          { creatorId: ctx.session.user.id },
          { members: { some: { id: ctx.session.user.id } } },
        ],
      },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        members: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return projects;
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { id: input.id },
        include: {
          creator: {
            select: { id: true, name: true, email: true, image: true },
          },
          members: {
            select: { id: true, name: true, email: true, image: true },
          },
          tasks: {
            // Include tasks, but only basic info
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              deadline: true,
              assigneeId: true,
              creatorId: true,
            },
          },
        },
      });

      // Basic access control: user must be creator or a member
      if (
        !project ||
        (project.creatorId !== ctx.session.user.id &&
          !project.members.some((member) => member.id === ctx.session.user.id))
      ) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return project;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Project name is required"),
        description: z.string().optional(),
        members: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      let usersToConnect: { id: string }[] =
        input.members?.map((id) => ({ id })) || [];
      if (!usersToConnect.includes({ id: ctx.session.user.id })) {
        usersToConnect.push({ id: ctx.session.user.id });
      }
      const project = await ctx.db.project.create({
        data: {
          name: input.name,
          description: input.description,
          creator: { connect: { id: ctx.session.user.id } },
          members: { connect: usersToConnect },
        },
      });
      return project;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Project name is required").optional(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingProject = await ctx.db.project.findUnique({
        where: { id: input.id },
      });

      if (
        !existingProject ||
        existingProject.creatorId !== ctx.session.user.id
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to update this project.",
        });
      }

      const updatedProject = await ctx.db.project.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
        },
      });
      return updatedProject;
    }),

  addMember: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingProject = await ctx.db.project.findUnique({
        where: { id: input.projectId },
      });

      if (
        !existingProject ||
        existingProject.creatorId !== ctx.session.user.id
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only project creator can add members.",
        });
      }

      const updatedProject = await ctx.db.project.update({
        where: { id: input.projectId },
        data: {
          members: {
            connect: { id: input.userId },
          },
        },
      });
      return updatedProject;
    }),

  removeMember: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingProject = await ctx.db.project.findUnique({
        where: { id: input.projectId },
      });

      if (
        !existingProject ||
        existingProject.creatorId !== ctx.session.user.id
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only project creator can remove members.",
        });
      }
      if (input.userId === existingProject.creatorId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot remove the project creator.",
        });
      }

      const updatedProject = await ctx.db.project.update({
        where: { id: input.projectId },
        data: {
          members: {
            disconnect: { id: input.userId },
          },
        },
      });
      return updatedProject;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existingProject = await ctx.db.project.findUnique({
        where: { id: input.id },
      });

      if (
        !existingProject ||
        existingProject.creatorId !== ctx.session.user.id
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to delete this project.",
        });
      }

      await ctx.db.project.delete({
        where: { id: input.id },
      });
      return { message: "Project deleted successfully" };
    }),
});
