import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";

export default function Home() {
  const { data: session } = useSession();

  return (
    <>
      <Head>
        <title>Welcome to TaskTracker</title>
        <meta
          name="description"
          content="Track, manage, and succeed with your tasks"
        />
      </Head>

      <div className="flex flex-col items-center justify-center gap-8 py-24 text-center">
        <h1 className="text-5xl font-extrabold text-slate-800 sm:text-[4rem]">
          Welcome to <span className="text-purple-600">TaskTracker</span>
        </h1>

        <p className="max-w-xl text-lg text-gray-600">
          Manage your tasks, projects, and productivity from one place. Your
          organized work life starts here.
        </p>

        <button
          onClick={session ? () => signOut() : () => signIn()}
          className="rounded-full bg-purple-600 px-8 py-3 text-lg font-semibold text-white transition hover:bg-purple-700"
        >
          {session ? "Sign out" : "Get Started"}
        </button>
      </div>
    </>
  );
}
