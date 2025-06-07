// src/types/index.ts
import {
  Project,
  Task,
  User,
  Tag,
  TaskStatus,
  Priority,
  Prisma,
} from "@prisma/client";

// Define a type for user without sensitive fields (like emailVerified from NextAuth)
export type UserWithoutSensitiveInfo = Omit<User, "emailVerified">;

//below type is for the necessary fields plus optional fields
// export type TaskWithRelations = Task & {
//   project?: Project | null;
//   assignee?: UserWithoutSensitiveInfo[] | [];
//   creator: UserWithoutSensitiveInfo;
//   tags: Tag[];
// };

export type TaskWithRelations = Prisma.TaskGetPayload<{
  include: {
    tags: true;
    project: true;
    assignee: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    creator: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
  };
}>;

export type ProjectWithRelations = Project & {
  creator: UserWithoutSensitiveInfo;
  members: UserWithoutSensitiveInfo[];
  tasks?: TaskWithRelations[]; // Tasks might not always be included
};

export interface TaskWithTags extends Task {
  tags: Tag[];
}

export { TaskStatus, Priority }; // Re-export enums
