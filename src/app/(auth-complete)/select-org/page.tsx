"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, ChevronRight, Users, Loader2 } from "lucide-react";

export default function SelectOrgPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const orgsQuery = trpc.org.list.useQuery();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // If user has only one org, redirect to dashboard with that org immediately
    if (orgsQuery.data && orgsQuery.data.length === 1) {
      setIsRedirecting(true);
      const orgId = orgsQuery.data[0].id;
      localStorage.setItem("selectedOrgId", orgId);
      router.replace(`/dashboard?orgId=${orgId}`);
    }
  }, [orgsQuery.data, router]);

  const handleSelectOrg = (orgId: string) => {
    // Store selected org in localStorage for persistence
    localStorage.setItem("selectedOrgId", orgId);
    router.push(`/dashboard?orgId=${orgId}`);
  };

  // Show loading while fetching orgs or redirecting
  if (orgsQuery.isLoading || isRedirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        </div>
      </div>
    );
  }

  if (!orgsQuery.data || orgsQuery.data.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No Organizations Found</CardTitle>
            <CardDescription>
              You are not a member of any organization yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Please contact your organization administrator to get invited.
            </p>
            <Button
              variant="outline"
              onClick={() => router.push("/onboarding")}
              className="w-full"
            >
              Create New Organization
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-background to-muted/20">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {session?.user?.name?.split(" ")[0] || "User"}!
          </h1>
          <p className="text-muted-foreground">
            Select the organization you want to access
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {orgsQuery.data.map((org) => (
            <Card
              key={org.id}
              className="hover:shadow-lg transition-all cursor-pointer group hover:border-primary/50"
              onClick={() => handleSelectOrg(org.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {org.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        @{org.slug}
                      </CardDescription>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{org.maxUsers} users</span>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {org.role.toLowerCase()}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {org.plan.toLowerCase()}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>🌍 {org.country}</span>
                  <span>•</span>
                  <span>💰 {org.currency}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {orgsQuery.data.length < 5 && (
          <div className="mt-8 text-center">
            <Button
              variant="ghost"
              onClick={() => router.push("/onboarding")}
              className="text-muted-foreground hover:text-foreground"
            >
              + Create New Organization
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
