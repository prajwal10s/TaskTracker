import { type NextPage } from "next";
import Head from "next/head";
import { TaskManager } from "~/components/TaskManager"; // Import the new TaskManager component
const DashboardPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Dashboard - TaskTracker</title>
        <meta name="description" content="Manage your tasks with TaskTracker" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="container mx-auto p-4">
        <TaskManager />
      </div>
    </>
  );
};

export default DashboardPage;
