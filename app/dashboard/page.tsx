import { KromedWorkspace } from "@/components/kromed-workspace";
import {
  createCollaboratorAction,
  createInventoryOrEquipmentAction,
  createShiftCodeAction,
  createVisitAction,
} from "@/app/dashboard/actions";
import { signOut } from "@/lib/auth-actions";
import { getDashboardData } from "@/lib/dashboard-data";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <KromedWorkspace
      createCollaboratorAction={createCollaboratorAction}
      createInventoryOrEquipmentAction={createInventoryOrEquipmentAction}
      createShiftCodeAction={createShiftCodeAction}
      createVisitAction={createVisitAction}
      data={data}
      signOutAction={signOut}
    />
  );
}
