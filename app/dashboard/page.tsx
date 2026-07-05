import { KromedWorkspace } from "@/components/kromed-workspace";
import { createCollaboratorAction } from "@/app/dashboard/actions";
import { signOut } from "@/lib/auth-actions";
import { getDashboardData } from "@/lib/dashboard-data";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <KromedWorkspace
      createCollaboratorAction={createCollaboratorAction}
      data={data}
      signOutAction={signOut}
    />
  );
}
