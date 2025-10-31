"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { signOutWithRevocation } from "@/lib/session-utils";
import { trpc } from "@/lib/trpc-client";
import { ArrowLeft, FileText, Bell, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
} from "@mui/material";

const benefits = [
  {
    icon: FileText,
    title: "Gerencie Seus Contratos",
    description:
      "Tenha controle total sobre todos os seus contratos em um único lugar, com fácil acesso e organização.",
  },
  {
    icon: Bell,
    title: "Alertas Inteligentes",
    description:
      "Receba notificações automáticas sobre renovações e prazos importantes, nunca perca uma data crítica.",
  },
  {
    icon: TrendingUp,
    title: "Análise e Relatórios",
    description:
      "Visualize métricas e insights sobre seus contratos para tomar decisões mais estratégicas.",
  },
];

export default function SelectOrgPage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const orgsQuery = trpc.org.list.useQuery();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [currentBenefitIndex, setCurrentBenefitIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Ensure hydration consistency
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBenefitIndex((prev) => (prev + 1) % benefits.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleSelectOrg = useCallback(async (orgId: string) => {
    try {
      setSelectedOrgId(orgId);
      setIsRedirecting(true);

      let gpsCoordinates = null;
      if (typeof window !== "undefined" && "geolocation" in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0,
            });
          });
          
          gpsCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
        } catch (error) {
          console.log("GPS unavailable:", error);
        }
      }

      const response = await fetch("/api/session/update-org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          orgId,
          gpsCoordinates: gpsCoordinates || undefined,
        }),
      });

      if (response.ok) {
        await updateSession({ selectedOrgId: orgId });
        await new Promise(resolve => setTimeout(resolve, 100));
        window.location.href = "/dashboard?_from_org_select=1";
      } else {
        console.error("Failed to update org in session");
        setIsRedirecting(false);
        setSelectedOrgId("");
      }
    } catch (error) {
      console.error("Error selecting org:", error);
      setIsRedirecting(false);
      setSelectedOrgId("");
    }
  }, [updateSession]);

  useEffect(() => {
    if (orgsQuery.data && orgsQuery.data.length === 0) {
      setIsRedirecting(true);
      signOutWithRevocation({ callbackUrl: "/auth/signin", reason: "NO_ORGS" });
      return;
    }

    if (orgsQuery.data && orgsQuery.data.length === 1 && !isRedirecting) {
      const orgId = orgsQuery.data[0].id;
      handleSelectOrg(orgId);
    }
  }, [orgsQuery.data, handleSelectOrg, isRedirecting]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedOrgId) {
      handleSelectOrg(selectedOrgId);
    }
  };

  // Show loading while fetching orgs or redirecting or not mounted
  if (!mounted || orgsQuery.isLoading || isRedirecting) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          bgcolor: "#f9fafb",
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress size={48} sx={{ color: "#1d2b48" }} />
          {isRedirecting && (
            <Typography variant="body2" sx={{ mt: 2, color: "#6b7280" }}>
              Redirecionando...
            </Typography>
          )}
        </Box>
      </Box>
    );
  }

  // If no orgs found, show loading while redirecting to login
  if (!orgsQuery.data || orgsQuery.data.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          bgcolor: "#f9fafb",
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress size={48} sx={{ color: "#1d2b48" }} />
          <Typography variant="body2" sx={{ mt: 2, color: "#6b7280" }}>
            Redirecionando para login...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "#ffffff",
      }}
    >
      {/* Left Side - Form */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 4,
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 480 }}>
          {/* Logo */}
          <Box sx={{ mb: 6 }}>
            <Image
              src="/logo.svg"
              alt="Contratei"
              width={140}
              height={47}
              priority
            />
          </Box>

          {/* Title */}
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "#111827",
              mb: 2,
            }}
          >
            Selecione sua empresa
          </Typography>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: "#111827",
                  mb: 1,
                }}
              >
                Empresa
              </Typography>
              <FormControl fullWidth>
                <Select
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  displayEmpty
                  disabled={isRedirecting}
                  sx={{
                    bgcolor: "#ffffff",
                    borderRadius: 1,
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#111827",
                      borderWidth: 2,
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#111827",
                      borderWidth: 2,
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#111827",
                      borderWidth: 2,
                    },
                    "& .MuiSelect-select": {
                      py: 1.5,
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                        marginTop: 8,
                      },
                    },
                  }}
                >
                  <MenuItem value="" disabled>
                    <Typography sx={{ color: "#9ca3af" }}>
                      Selecione a empresa
                    </Typography>
                  </MenuItem>
                  {orgsQuery.data.map((org) => (
                    <MenuItem key={org.id} value={org.id}>
                      <Box>
                        <Typography
                          sx={{
                            fontWeight: 600,
                            color: "#111827",
                          }}
                        >
                          {org.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#6b7280",
                          }}
                        >
                          {org.role.toLowerCase()} • {org.plan.toLowerCase()}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={!selectedOrgId || isRedirecting}
              sx={{
                height: 52,
                borderRadius: 2,
                bgcolor: "#1d2b48",
                textTransform: "none",
                fontSize: "1rem",
                fontWeight: 600,
                mb: 3,
                "&:hover": {
                  bgcolor: "#162039",
                },
                "&:disabled": {
                  bgcolor: "#e5e7eb",
                  color: "#9ca3af",
                },
              }}
            >
              {isRedirecting ? (
                <CircularProgress size={24} sx={{ color: "white" }} />
              ) : (
                "Acessar empresa"
              )}
            </Button>

            {/* Back to Login */}
            <Box
              component="button"
              type="button"
              onClick={async (e) => {
                e.preventDefault();
                if (!isRedirecting && mounted) {
                  try {
                    await signOutWithRevocation({
                      callbackUrl: "/auth/signin",
                      redirect: true,
                      reason: "USER_LOGOUT",
                    });
                  } catch (error) {
                    console.error("Error signing out:", error);
                    // Fallback to direct navigation - only if mounted
                    if (typeof window !== "undefined") {
                      window.location.href = "/auth/signin";
                    }
                  }
                }
              }}
              disabled={isRedirecting}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: "#6b7280",
                fontWeight: 500,
                fontSize: "0.9375rem",
                cursor: isRedirecting ? "default" : "pointer",
                opacity: isRedirecting ? 0.5 : 1,
                transition: "color 0.2s ease",
                background: "none",
                border: "none",
                padding: 0,
                "&:hover": {
                  color: !isRedirecting ? "#111827" : "#6b7280",
                },
                "&:disabled": {
                  cursor: "default",
                },
              }}
            >
              <ArrowLeft style={{ height: 16, width: 16 }} />
              <span>Voltar para login</span>
            </Box>
          </form>
        </Box>
      </Box>

      {/* Right Side - Carousel */}
      <Box
        sx={{
          flex: 1,
          display: { xs: "none", md: "flex" },
          position: "relative",
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1d2b48 0%, #0f1729 100%)",
        }}
      >
        {/* Decorative circles */}
        <Box
          sx={{
            position: "absolute",
            top: "-10%",
            right: "-10%",
            width: "40%",
            height: "40%",
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.03)",
            filter: "blur(40px)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: "-15%",
            left: "-10%",
            width: "50%",
            height: "50%",
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.02)",
            filter: "blur(60px)",
          }}
        />

        {/* Carousel content */}
        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            textAlign: "center",
            px: 6,
            width: "100%",
            maxWidth: 500,
          }}
        >
          {/* Icon container with animation */}
          <Box
            sx={{
              width: 120,
              height: 120,
              margin: "0 auto",
              mb: 4,
              borderRadius: "24px",
              background: "rgba(255, 255, 255, 0.08)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
              transition: "all 0.5s ease-in-out",
            }}
          >
            {(() => {
              const Icon = benefits[currentBenefitIndex].icon;
              return (
                <Icon
                  style={{
                    width: 56,
                    height: 56,
                    color: "white",
                    strokeWidth: 1.5,
                  }}
                />
              );
            })()}
          </Box>

          {/* Text content with fade animation */}
          <Box
            sx={{
              transition: "opacity 0.5s ease-in-out",
              opacity: 1,
            }}
          >
            <Typography
              variant="h4"
              sx={{
                color: "white",
                fontWeight: 700,
                mb: 2,
                textShadow: "0 2px 10px rgba(0, 0, 0, 0.2)",
              }}
            >
              {benefits[currentBenefitIndex].title}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: "rgba(255, 255, 255, 0.7)",
                lineHeight: 1.6,
              }}
            >
              {benefits[currentBenefitIndex].description}
            </Typography>
          </Box>

          {/* Carousel indicators */}
          <Box
            sx={{
              mt: 6,
              display: "flex",
              justifyContent: "center",
              gap: 1.5,
            }}
          >
            {benefits.map((_, index) => (
              <Box
                key={index}
                onClick={() => setCurrentBenefitIndex(index)}
                sx={{
                  width: currentBenefitIndex === index ? 32 : 8,
                  height: 8,
                  borderRadius: "4px",
                  bgcolor:
                    currentBenefitIndex === index
                      ? "rgba(255, 255, 255, 0.9)"
                      : "rgba(255, 255, 255, 0.3)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    bgcolor:
                      currentBenefitIndex === index
                        ? "rgba(255, 255, 255, 0.9)"
                        : "rgba(255, 255, 255, 0.5)",
                  },
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
