import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/ui/Navbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={session.user?.name ?? session.user?.email ?? ""} />
      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
    </div>
  );
}
