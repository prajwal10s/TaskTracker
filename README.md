TaskTracker: A Modern Task Management Application

TaskTracker is a robust and intuitive task management application built with the T3 Stack, designed to help individuals and teams organize, track, and manage their tasks efficiently. From creating new tasks with rich details to categorizing them with tags and assigning them to projects or team members, TaskTracker provides a streamlined workflow for productivity.

✨ Features

    Task Creation & Management: Create new tasks with title, description, status (Todo, In Progress, Done, Blocked), priority (Low, Medium, High, Urgent), setting deadline, assigned project, assignee and multiple tags.

    Task Details View: View details of any task by using view button.

    Task Status Toggling: Quickly change task status to the next one in heirarchy using toggle.

    Task Deletion: Easily delete task

    Tag Management: Create, view, and manage custom tags to categorize tasks.

    User & Project Assignment: Assign tasks to specific users and associate them with projects.

    User able to view only the projeccts they are part of.

    Projects link shows all the tasks associated with that particular projects.

    From the task view user can move back to where the user came from(dashboard/projects) accordingly.

    Responsive Design: Optimized for a seamless experience across various devices (desktop, tablet, mobile).

    Real-time Updates: Utilizes tRPC and React Query for efficient data fetching and updates, ensuring the UI reflects changes promptly.

    Each Project can be seen in Project Tab

    Once you click on Project tab you can view all task associated with that particular project

✨ Future Features

    Dashboard that lets you filter your tasks based on deadlines, tags, and many more
    Project tasks filtering based on status

🖥️ Usage
Dashboard (/dashboard)

This is your main task overview. This will show all your tasks from all the projects

    Create New Task: Click the + Create New Task button to open a modal form. Fill in the task details (title, description, status, priority, deadline, project, assignee, tags) and click "Create Task".

    View Tasks: All tasks accessible to you will be displayed as compact cards.

    View Task Details: Click the "View" button on any task card to navigate to a read-only page with full task information.

    Toggle Status: Click the "Mark In Progress" / "Mark Done" button on a task card to quickly cycle its status.

    Edit Task: Click the "Edit" icon (pencil) on a task card to open the task form pre-filled with the task's current data. Make changes and click "Save Changes".

    Delete Task: Click the "Delete" icon (trash can) on a task card to delete the task (requires confirmation).

    Add tags: You can multi select Tags

    On fly create tags: In the form itself you can create new tags and those will be populated in the tags list

Task Detail Page (/tasks/[id])

    Access this page by clicking the "View" button on a task card. It provides a comprehensive, read-only view of a single task.

    Click the "← Back to Dashboard" button to return to the main task list.

Project Management (/projects)

    Navigate to this page to create and manage your projects.

    View Details of the project by clicking on view button.

    Click on the view Tasks button to see all tasks associated with that project

Tag Management (/tags)

    Navigate to this page to create and manage your task tags.

Technologies

Initial Project Setup

    npm create t3-app@7.37.0
    below options:

        ◇ Will you be using TypeScript or JavaScript?
        │ TypeScript
        │
        ◇ Will you be using Tailwind CSS for styling?
        │ Yes
        │
        ◇ Would you like to use tRPC?
        │ Yes
        │
        ◇ What authentication provider would you like to use?
        │ NextAuth.js
        │
        ◇ What database ORM would you like to use?
        │ Prisma
        │
        ◇ Would you like to use Next.js App Router?
        │ No
        │
        ◇ What database provider would you like to use?
        │ PostgreSQL

    Rest:

    Date-fns: For efficient date manipulation and formatting.

    React Datepicker: A flexible and customizable date picker component.

    Font Awesome: For scalable vector icons.

🌐 Deployment:

    This Next.js application is deployed using SST (https://sst.dev/). We've completely configured it for deployment with SST (Serverless Stack) to AWS.

    When deploying with SST  we strategically choose Lambda, CloudFront, and S3 for distinct but complementary reasons:

    AWS Lambda: This is chosen for its serverless nature and scalability. TaskTracker require a server environment for API routes. Server-Side Rendering (SSR), and Image Optimization. Lambda allows us to run this backend code without provisioning or managing servers, automatically scaling up or down based on demand, and you only pay for the compute time consumed.

    Amazon CloudFront: This acts as a Content Delivery Network (CDN), essential for global reach(if to be scaled) and performance. CloudFront caches your application's static assets and SSR responses at edge locations worldwide, delivering content to users from the nearest location. This drastically reduces latency, improves loading times, and enhances user experience, while also handling SSL certificates for secure connections.

    Amazon S3: This provides highly durable, scalable, and cost-effective storage for all your application's static files (HTML, CSS        JavaScript bundles, images, fonts). S3 is ideal for serving static content because it's designed for massive scale and reliability,     making it a perfect origin for CloudFront.

    Instructions:
        For the deployment part you can take example for sst.example.config to setup your config and there are a lot more options that can be set which can be found on docs from(https://sst.dev/).
        Then you have to setup two different IAM profiles for dev and production for separation of concern. These can be setup by following th guide from AWS.
        Once the profiles are set you are about ready and please make sure to force the region of the application from the sst config as that can drastically impact the speed and responsiveness of your application.
        Before deployment make sure you uninstall all dependencies and freshly install them for a fresh deployment.
        To check out the console from sst you have to create a stack in aws which needs to be only in us-east-1 but this is just for the console
        and your application will still be in the region you chose so no need to get confused there.

        Now you can depoy using npx sst deploy --stage production command

🏛️ Architecture

TaskTracker follows a modern full-stack architecture based on the T3 Stack principles:

    Frontend (Client-side):

        Built with Next.js and React, providing a rich user interface.

        Tailwind CSS is used for all styling, enabling rapid UI development and ensuring responsiveness.

        tRPC Client (~/utils/api.ts) handles type-safe communication with the backend API.

        React Query manages server state, caching, background refetching, and data synchronization for an optimal user experience.

        Components are modular (e.g., TaskManager, TaskList, TaskCard, TaskDetailView), promoting reusability and maintainability.

    Backend (API Layer - Server-side):

        Leverages Next.js API Routes (/api/trpc).

        tRPC Routers (src/server/api/routers/) define the API endpoints (task, project, user, tag). These procedures enforce input/output validation using Zod schemas.

        Prisma is the ORM used for interacting with the database. All database operations (create, read, update, delete) are handled securely and type-safely through Prisma clients within tRPC procedures.

        Authentication: NextAuth.js (if fully integrated) handles user authentication and session management, protecting API routes and ensuring only authenticated users can access protected resources (protectedProcedure).

    Database:

        A PostgreSQL database (or other compatible relational database) stores all application data (tasks, projects, users, tags, etc.).

        Prisma Migrations manage the database schema, ensuring smooth updates as the application evolves.

Data Flow Overview:

    User Interaction: User interacts with the React components on the frontend (e.g., clicks "Create New Task").

    tRPC Call: A tRPC client hook (e.g., api.task.create.useMutation()) is invoked on the frontend.

    API Request: This triggers an HTTP request to the Next.js API route (/api/trpc/task.create).

    Backend Processing: The corresponding tRPC procedure in src/server/api/routers/task.ts is executed.

    Database Interaction: The tRPC procedure uses Prisma to perform the necessary database operation (e.g., ctx.db.task.create()).

    Response: The result from the database is returned through Prisma, then tRPC, back to the frontend.

    UI Update: React Query automatically updates the UI, and if a mutation was successful, it invalidates relevant queries, prompting other components (like TaskList) to refetch and display the freshest data.

📦 Prerequisites

Before you begin, ensure you have the following installed:

    Node.js (v18 or higher recommended)

    npm or yarn (npm recommended)

    Git

    Supabase(for serverless)

🛠️ Getting Started

Follow these steps to get TaskTracker up and running on your local machine:

    Clone the Repository:

    git clone https://github.com/YOUR_USERNAME/TaskTracker.git
    cd TaskTracker

    Install Dependencies:

    npm install
    # or yarn install

    Set Up Environment Variables:
    Create a .env file in the root of your project based on .env.example.

    DATABASE_URL="postgresql://user:password@host:port/database"
    # Example for Supabase: please check env example for details

    # For NextAuth.js
    NEXTAUTH_SECRET="YOUR_NEXTAUTH_SECRET" # Generate a strong secret using command openssl rand -base64 32
    NEXTAUTH_URL="http://localhost:3000"

        DATABASE_URL: Your database connection string.

        NEXTAUTH_SECRET: A random string used to hash tokens, sign cookies, and encrypt.

        NEXTAUTH_URL: The base URL of your application.

        DISCORD_CLIENT_ID & DISCORD_CLIENT_SECRET : Create a new application in DISCORD and setup which will generate the both these params

    Set Up Your Database with Prisma:

        Push the Prisma schema to your database (for initial setup):

        npx prisma db push

        This command will create the tables and relations defined in prisma/schema.prisma in your database.

        Generate Prisma Client:

        npx prisma generate

        This command generates the Prisma client that tRPC uses to interact with your database.

    Run the Development Server:

    npm run dev

    The application should now be running at http://localhost:3000.

📂 Project Structure -reference

    ./
    ├── .env
    ├── .env.example
    ├── .env.local
    ├── .env.production
    ├── .eslintrc.cjs
    ├── .gitignore
    ├── next-env.d.ts
    ├── next.config.js
    ├── package-lock.json
    ├── package.json
    ├── postcss.config.cjs
    ├── prettier.config.js
    ├── prisma/
    │   └── schema.prisma
    ├── public/
    │   └── favicon.ico
    ├── README.md
    ├── src/
    │   ├── components/
    │   │   ├── Layout.tsx
    │   │   ├── LoadingSpinner.tsx
    │   │   ├── ProjectCard.tsx
    │   │   ├── ProjectDetailView.tsx
    │   │   ├── ProjectForm.tsx
    │   │   ├── TagManager.tsx
    │   │   ├── TaskCard.tsx
    │   │   ├── TaskDetailView.tsx
    │   │   ├── TaskForm.tsx
    │   │   ├── TaskList.tsx
    │   │   ├── TaskManager.tsx
    │   │   └── UserProfileForm.tsx
    │   ├── env.js
    │   ├── lib/
    │   │   └── fontawesome.ts
    │   ├── pages/
    │   │   ├── _app.tsx
    │   │   ├── api/
    │   │   │   ├── auth/
    │   │   │   │   └── [...nextauth].ts
    │   │   │   └── trpc/
    │   │   │       └── [trpc].ts
    │   │   ├── dashboard.tsx
    │   │   ├── index.tsx
    │   │   ├── profile.tsx
    │   │   ├── projects/
    │   │   │   ├── [id]/
    │   │   │   │   └── tasks.tsx
    │   │   │   └── [id].tsx
    │   │   ├── projects.tsx
    │   │   ├── tags.tsx
    │   │   └── tasks/
    │   │       └── [id].tsx
    │   ├── server/
    │   │   ├── api/
    │   │   │   ├── root.ts
    │   │   │   ├── routers/
    │   │   │   │   ├── project.ts
    │   │   │   │   ├── tag.ts
    │   │   │   │   ├── task.ts
    │   │   │   │   └── user.ts
    │   │   │   └── trpc.ts
    │   │   ├── auth.ts
    │   │   └── db.ts
    │   ├── structure.txt
    │   ├── styles/
    │   │   └── globals.css
    │   ├── types/
    │   │   └── index.ts
    │   └── utils/
    │       ├── api.ts
    │       └── styleUtils.ts
    ├── sst-env.d.ts
    ├── sst.config.ts
    ├── sst.example.config
    ├── start-database.sh*
    ├── structure.txt
    ├── tailwind.config.ts
    └── tsconfig.json

Issues Faced

    Delay in queries:
        Solved by changing the region for Supabase and also adding an index on assigneedID in task to quickly view dashboard
