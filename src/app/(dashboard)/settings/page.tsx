import { Suspense } from "react";
import SettingsClient from "@/components/features/settings/settings-client";
import { getSettingsData } from "./actions";
import SettingsLoading from "./loading";
async function SettingsContent() {
  const { org, session } = await getSettingsData();

  return <SettingsClient org={org} session={session} />;
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsContent />
    </Suspense>
  );
}
