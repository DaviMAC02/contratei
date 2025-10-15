import { Suspense } from "react";
import EditContractClient from "@/components/features/contracts/[id]/edit/edit-contract-client";
import { getEditContractData } from "./actions";
import { Box, Card, CardContent, Skeleton } from "@mui/material";

function EditContractLoading() {
  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-50/50 min-h-screen">
      {/* Back button skeleton */}
      <Box className="mb-6">
        <Skeleton variant="text" width={100} height={20} />
      </Box>

      {/* Page title skeleton */}
      <Box className="mb-8">
        <Skeleton variant="text" width="40%" height={48} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="60%" height={24} />
      </Box>

      {/* Two-column grid */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {/* Basic Information Card */}
        <Card sx={{ borderRadius: 2, border: "1px solid #e5e7eb" }}>
          <CardContent sx={{ p: 3 }}>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2.5 }}
            >
              <Skeleton
                variant="rectangular"
                width={32}
                height={32}
                sx={{ borderRadius: 1 }}
              />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="50%" height={24} />
                <Skeleton variant="text" width="70%" height={16} />
              </Box>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Skeleton
                variant="rectangular"
                height={40}
                sx={{ borderRadius: 1 }}
              />
              <Skeleton
                variant="rectangular"
                height={40}
                sx={{ borderRadius: 1 }}
              />
              <Skeleton
                variant="rectangular"
                height={40}
                sx={{ borderRadius: 1 }}
              />
              <Skeleton
                variant="rectangular"
                height={40}
                sx={{ borderRadius: 1 }}
              />
              <Skeleton
                variant="rectangular"
                height={40}
                sx={{ borderRadius: 1 }}
              />
            </Box>
          </CardContent>
        </Card>

        {/* Dates and Renewal Card */}
        <Card sx={{ borderRadius: 2, border: "1px solid #e5e7eb" }}>
          <CardContent sx={{ p: 3 }}>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2.5 }}
            >
              <Skeleton
                variant="rectangular"
                width={32}
                height={32}
                sx={{ borderRadius: 1 }}
              />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="50%" height={24} />
                <Skeleton variant="text" width="70%" height={16} />
              </Box>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Skeleton
                variant="rectangular"
                height={40}
                sx={{ borderRadius: 1 }}
              />
              <Skeleton
                variant="rectangular"
                height={80}
                sx={{ borderRadius: 2 }}
              />
            </Box>
          </CardContent>
        </Card>

        {/* Financial Information Card */}
        <Card sx={{ borderRadius: 2, border: "1px solid #e5e7eb" }}>
          <CardContent sx={{ p: 3 }}>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2.5 }}
            >
              <Skeleton
                variant="rectangular"
                width={32}
                height={32}
                sx={{ borderRadius: 1 }}
              />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="55%" height={24} />
                <Skeleton variant="text" width="60%" height={16} />
              </Box>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Skeleton
                variant="rectangular"
                height={40}
                sx={{ borderRadius: 1 }}
              />
              <Skeleton
                variant="rectangular"
                height={40}
                sx={{ borderRadius: 1 }}
              />
              <Skeleton
                variant="rectangular"
                height={40}
                sx={{ borderRadius: 1 }}
              />
              <Skeleton
                variant="rectangular"
                height={40}
                sx={{ borderRadius: 1 }}
              />
            </Box>
          </CardContent>
        </Card>

        {/* Additional Information Card */}
        <Card sx={{ borderRadius: 2, border: "1px solid #e5e7eb" }}>
          <CardContent sx={{ p: 3 }}>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2.5 }}
            >
              <Skeleton
                variant="rectangular"
                width={32}
                height={32}
                sx={{ borderRadius: 1 }}
              />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="55%" height={24} />
                <Skeleton variant="text" width="60%" height={16} />
              </Box>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Skeleton
                variant="rectangular"
                height={40}
                sx={{ borderRadius: 1 }}
              />
              <Skeleton
                variant="rectangular"
                height={120}
                sx={{ borderRadius: 1 }}
              />
            </Box>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        <Skeleton
          variant="rectangular"
          width={100}
          height={36}
          sx={{ borderRadius: 1.5 }}
        />
        <Skeleton
          variant="rectangular"
          width={100}
          height={36}
          sx={{ borderRadius: 1.5 }}
        />
      </div>
    </div>
  );
}

async function EditContractContent({ id }: { id: string }) {
  const { contract, members, orgs, orgId } = await getEditContractData(id);

  return (
    <EditContractClient
      initialContract={contract}
      initialMembers={members}
      initialOrgs={orgs}
      initialOrgId={orgId}
    />
  );
}

export default async function EditContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<EditContractLoading />}>
      <EditContractContent id={id} />
    </Suspense>
  );
}
