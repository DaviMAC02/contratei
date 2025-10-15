import { Suspense } from "react";
import NewContractClient from "@/components/features/contracts/new/new-contract-client";
import { getNewContractData } from "./actions";
import { Box, Card, CardContent, Skeleton } from "@mui/material";

function NewContractLoading() {
  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Skeleton variant="text" width={100} height={40} sx={{ mb: 3 }} />
      <Card
        sx={{
          maxWidth: "896px",
          mx: "auto",
          borderRadius: "12px",
        }}
      >
        <CardContent>
          <Skeleton variant="text" width="60%" height={40} sx={{ mb: 4 }} />
          <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={300} sx={{ mb: 2 }} />
          <Box
            sx={{
              display: "flex",
              gap: 2,
              justifyContent: "space-between",
              mt: 4,
            }}
          >
            <Skeleton variant="rectangular" width={100} height={40} />
            <Box sx={{ display: "flex", gap: 2 }}>
              <Skeleton variant="rectangular" width={100} height={40} />
              <Skeleton variant="rectangular" width={100} height={40} />
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

async function NewContractContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const { orgs, org, members, orgId } = await getNewContractData(params);

  return (
    <NewContractClient
      initialOrgs={orgs}
      initialOrg={org}
      initialMembers={members}
      initialOrgId={orgId}
    />
  );
}

export default function NewContractPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  return (
    <Suspense fallback={<NewContractLoading />}>
      <NewContractContent searchParams={searchParams} />
    </Suspense>
  );
}
