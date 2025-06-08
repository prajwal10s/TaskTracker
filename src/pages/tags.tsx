import { type NextPage } from "next";
import Head from "next/head";
import { TagManager } from "~/components/TagManager";

const TagsPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Manage Tags - TaskTracker</title>
        <meta
          name="description"
          content="Create and manage tags for your tasks"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="container mx-auto p-4">
        <h1 className="mb-6 text-4xl font-extrabold text-gray-800">
          Tags Management
        </h1>
        <div className="mx-auto max-w-lg">
          <TagManager />
        </div>
      </div>
    </>
  );
};

export default TagsPage;
