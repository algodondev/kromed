import { KromedWorkspace } from "@/components/kromed-workspace";
import { signOut } from "@/lib/auth-actions";
import { getDashboardData } from "@/lib/dashboard-data";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return <KromedWorkspace data={data} signOutAction={signOut} />;
}
