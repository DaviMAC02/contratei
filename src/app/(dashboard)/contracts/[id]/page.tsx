import { Suspense } from "react";
import ContractDetailClient from "@/components/features/contracts/[id]/contract-detail-client";
import { getContractDetailData } from "./actions";
import { Box, Card, CardContent, Skeleton } from "@mui/material";

function ContractDetailLoading() {
  return (
    <div className="p-8">
      <Skeleton variant="text" width={100} height={40} sx={{ mb: 3 }} />
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 4 }}>
        <Box>
          <Skeleton variant="text" width={300} height={40} sx={{ mb: 1 }} />
          <Skeleton variant="text" width={200} height={24} />
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Skeleton variant="rectangular" width={100} height={36} />
          <Skeleton variant="rectangular" width={100} height={36} />
          <Skeleton variant="rectangular" width={100} height={36} />
        </Box>
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 3,
          mb: 4,
        }}
      >
        <Skeleton variant="rectangular" height={300} />
        <Skeleton variant="rectangular" height={300} />
      </Box>
      <Skeleton variant="rectangular" height={200} />
    </div>
  );
}

async function ContractDetailContent({ id }: { id: string }) {
  const { contract, files, orgs, orgId } = await getContractDetailData(id);

  return (
    <ContractDetailClient
      initialContract={contract}
      initialFiles={files}
      initialOrgs={orgs}
      initialOrgId={orgId}
    />
  );
}

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<ContractDetailLoading />}>
      <ContractDetailContent id={id} />
    </Suspense>
  );
}
