import { Suspense } from "react";
import ContractsClient from "@/components/features/contracts/contracts-client";
import { getContractsData } from "./actions";
import ContractsLoading from "./loading";

async function ContractsContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const { contracts, nextCursor, org } = await getContractsData(params);

  return (
    <ContractsClient
      initialContracts={contracts}
      initialNextCursor={nextCursor}
      org={org}
      initialSearch={params.search}
      initialStatus={params.status}
    />
  );
}

export default function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  return (
    <Suspense fallback={<ContractsLoading />}>
      <ContractsContent searchParams={searchParams} />
    </Suspense>
  );
}
