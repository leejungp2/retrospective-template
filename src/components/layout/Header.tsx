import { auth, signOut } from "@/lib/auth";
import Link from "next/link";

export async function Header() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="text-lg font-bold text-gray-900">
          회고
        </Link>
        {session?.user && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:inline">
              {session.user.name}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                로그아웃
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
