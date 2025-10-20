import { Suspense } from "react";
import TeamClient from "@/components/features/team/team-client";
import { getTeamData } from "./actions";
import TeamLoading from "./loading";

async function TeamContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const { members, nextCursor } = await getTeamData(params);

  return (
    <TeamClient
      initialMembers={members}
      initialNextCursor={nextCursor}
      initialSearch={params.search}
      initialRoleFilter={params.role}
    />
  );
}

export default function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  return (
    <Suspense fallback={<TeamLoading />}>
      <TeamContent searchParams={searchParams} />
    </Suspense>
  );
}
