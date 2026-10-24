import { redirect } from "next/navigation";
import { isAdminSessionValid } from "@/lib/admin-auth";
import AdminDashboard from "./dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdminSessionValid())) redirect("/admin/login");
  return <AdminDashboard />;
}
