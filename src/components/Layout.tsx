import { ReactNode } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { data: session, status } = useSession();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header with gradient */}
      <header className="bg-gradient-to-r from-purple-800 via-purple-600 to-indigo-600 p-4 text-white shadow-md">
        <nav className="container mx-auto flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-2xl font-bold hover:text-gray-200"
          >
            TaskTracker
          </Link>
          <div>
            {status === "authenticated" ? (
              <>
                <Link href="/dashboard" className="mr-4 hover:underline">
                  Dashboard
                </Link>
                <Link href="/projects" className="mr-4 hover:underline">
                  Projects
                </Link>
                <Link href="/profile" className="mr-4 hover:underline">
                  Profile
                </Link>
                <Link href="/tags" className="mr-4 hover:underline">
                  Tags
                </Link>
                <button onClick={() => signOut()} className="hover:underline">
                  Sign out ({session?.user?.name})
                </button>
              </>
            ) : (
              <Link href="/api/auth/signin" className="hover:underline">
                Sign in
              </Link>
            )}
          </div>
        </nav>
      </header>

      {/* Main content */}
      <main className="container mx-auto flex-grow p-4">{children}</main>

      {/* Footer with gradient */}
      <footer className="bg-gradient-to-r from-purple-800 via-purple-600 to-indigo-600 p-4 text-center text-gray-100">
        &copy; {new Date().getFullYear()} TaskTracker. All rights reserved.
      </footer>
    </div>
  );
};

export default Layout;
