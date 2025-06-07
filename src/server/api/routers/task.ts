import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Priority, TaskStatus, PrismaClient } from "@prisma/client";
import { TaskWithRelations } from "~/types";
const prisma = new PrismaClient();

export const taskRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z.object({
        projectId: z.string().optional(),
        status: z.nativeEnum(TaskStatus).optional(),
        assigneeId: z.string().optional(),
        // Add other filters as needed
      }),
    )
    .query(async ({ ctx, input }) => {
      const { projectId, status, assigneeId } = input;
      const tasks = await ctx.db.task.findMany({
        where: {
          creatorId: ctx.session.user.id, // Only show tasks created by the current user by default
          projectId: projectId || undefined,
          status: status || undefined,
          assigneeId: assigneeId || undefined,
          // Add conditions for other filters
        },
        include: {
          project: true,
          assignee: {
            select: { id: true, name: true, email: true, image: true },
          },
          creator: {
            select: { id: true, name: true, email: true, image: true },
          },
          tags: true,
        },
        orderBy: { createdAt: "desc" },
      });
      return tasks;
    }),
  getAllForGivenProjects: protectedProcedure
    .input(
      z.object({
        projectIds: z.array(z.string()),
      }),
    )
    .query(async ({ ctx, input }): Promise<TaskWithRelations[]> => {
      const tasks = await ctx.db.task.findMany({
        where: {
          projectId: {
            in: input.projectIds,
          },
        },
        include: {
          tags: true,
          project: true,
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return tasks;
    }),
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const task = await ctx.db.task.findUnique({
        where: { id: input.id },
        include: {
          project: true,
          assignee: {
            select: { id: true, name: true, email: true, image: true },
          },
          creator: {
            select: { id: true, name: true, email: true, image: true },
          },
          tags: true,
        },
      });

      if (!task) {
        // if task doesn't exist
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return task;
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, "Title is required"),
        description: z.string().optional(),
        status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
        priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
        deadline: z.string().datetime().nullable().optional(), // Using string for date from form
        projectId: z.string().optional().nullable(),
        assigneeId: z.string().optional().nullable(),
        tagIds: z.array(z.string()).optional(),
        newTagName: z.string().optional(), // For creating a new tag on the fly
      }),
    )
    .mutation(async ({ ctx, input }) => {
      let tagsToConnect: { id: string }[] =
        input.tagIds?.map((id) => ({ id })) || [];

      if (input.newTagName) {
        //check if the tagName
        const existingTag = await ctx.db.tag.findUnique({
          where: { name: input.newTagName },
        });

        let newTagId: string;
        if (existingTag) {
          newTagId = existingTag.id;
        } else {
          const newTag = await ctx.db.tag.create({
            data: { name: input.newTagName },
          });
          newTagId = newTag.id;
        }
        tagsToConnect.push({ id: newTagId });
      }

      const task = await ctx.db.task.create({
        data: {
          title: input.title,
          description: input.description,
          status: input.status,
          priority: input.priority,
          deadline: input.deadline ? new Date(input.deadline) : null,
          project: input.projectId
            ? { connect: { id: input.projectId } }
            : undefined,
          assignee: input.assigneeId
            ? { connect: { id: input.assigneeId } }
            : undefined,
          creator: { connect: { id: ctx.session.user.id } },
          tags: {
            connect: tagsToConnect,
          },
        },
      });
      return task;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1, "Title is required").optional(),
        description: z.string().optional(),
        status: z.nativeEnum(TaskStatus).optional(),
        priority: z.nativeEnum(Priority).optional(),
        deadline: z.string().datetime().nullable().optional(),
        projectId: z.string().optional().nullable(),
        assigneeId: z.string().optional().nullable(),
        tagIds: z.array(z.string()).optional(),
        newTagName: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingTask = await ctx.db.task.findUnique({
        where: { id: input.id },
      });

      if (!existingTask || existingTask.creatorId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to update this task.",
        });
      }

      let tagsToConnect: { id: string }[] = [];
      let tagsToDisconnect: { id: string }[] = [];

      if (input.tagIds) {
        const currentTags = await ctx.db.task.findUnique({
          where: { id: input.id },
          select: { tags: { select: { id: true } } },
        });
        const currentTagIds = new Set(currentTags?.tags.map((tag) => tag.id));

        tagsToConnect = input.tagIds
          .filter((tagId) => !currentTagIds.has(tagId))
          .map((id) => ({ id }));
        tagsToDisconnect = Array.from(currentTagIds)
          .filter((tagId) => !input.tagIds?.includes(tagId))
          .map((id) => ({ id }));
      }

      if (input.newTagName) {
        const existingTag = await ctx.db.tag.findUnique({
          where: { name: input.newTagName },
        });
        let newTagId: string;
        if (existingTag) {
          newTagId = existingTag.id;
        } else {
          const newTag = await ctx.db.tag.create({
            data: { name: input.newTagName },
          });
          newTagId = newTag.id;
        }
        if (!input.tagIds?.includes(newTagId)) {
          // Only add if not already selected
          tagsToConnect.push({ id: newTagId });
        }
      }

      const updatedTask = await ctx.db.task.update({
        where: { id: input.id },
        data: {
          title: input.title,
          description: input.description,
          status: input.status,
          priority: input.priority,
          deadline: input.deadline ? new Date(input.deadline) : null,
          project:
            input.projectId === null
              ? { disconnect: true }
              : input.projectId
                ? { connect: { id: input.projectId } }
                : undefined,
          assignee:
            input.assigneeId === null
              ? { disconnect: true }
              : input.assigneeId
                ? { connect: { id: input.assigneeId } }
                : undefined,
          tags: {
            connect: tagsToConnect,
            disconnect: tagsToDisconnect,
          },
        },
      });
      return updatedTask;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existingTask = await ctx.db.task.findUnique({
        where: { id: input.id },
      });

      if (!existingTask || existingTask.creatorId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to delete this task.",
        });
      }

      await ctx.db.task.delete({
        where: { id: input.id },
      });
      return { message: "Task deleted successfully" };
    }),
});
