"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc-client";
import {
  Card as MuiCard,
  CardContent as MuiCardContent,
  Box,
  Typography,
  Button,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Skeleton,
  Container,
  LinearProgress,
  Divider,
  Paper,
  Stack,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslation } from "@/lib/use-translation";
import { formatCurrency } from "@/lib/utils";
import {
  Check,
  CreditCard,
  Users,
  FileText,
  Zap,
  Crown,
  Sparkles,
  TrendingUp,
  Shield,
  Clock,
  BarChart3,
  Settings,
  Download,
  ChevronLeft,
  ChevronRight,
  Send,
  X,
} from "lucide-react";
import { useOrgSelection } from "@/hooks/use-org-selection";
import { trackPlanChange } from "@/components/providers/posthog-provider";
import { DashboardPageWrapper } from "@/components/layout/dashboard-page-wrapper";

// Styled components
const HeroCard = styled(MuiCard)(({ theme }) => ({
  position: "relative",
  overflow: "hidden",
  borderRadius: 24,
  border: "none",
  background: "linear-gradient(135deg, #1d2b48 0%, #2d3b58 100%)",
  color: "#ffffff",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background:
      "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)",
    pointerEvents: "none",
  },
}));

const PlanCard = styled(MuiCard, {
  shouldForwardProp: (prop) => prop !== "featured",
})<{ featured?: boolean }>(({ theme, featured }) => ({
  position: "relative",
  overflow: "hidden",
  borderRadius: 20,
  border: featured ? "3px solid #f59e0b" : "2px solid #e5e7eb",
  background: featured
    ? "linear-gradient(135deg, #fef3c7 0%, #fbbf24 0%, #f59e0b 100%)"
    : "#ffffff",
  color: featured ? "#000000" : "#000000",
  transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
  cursor: "pointer",
  minHeight: 580, // Increased height for consistency
  height: "100%", // Ensure all cards have same height
  display: "flex",
  flexDirection: "column",
  transform: "scale(1)", // Same scale for all cards
  zIndex: featured ? 10 : 1,
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: featured
      ? "0 12px 25px rgba(245, 158, 11, 0.25)"
      : "0 12px 25px rgba(0, 0, 0, 0.1)",
  },
  "&::before": featured
    ? {
        content: '""',
        position: "absolute",
        top: -2,
        left: -2,
        right: -2,
        bottom: -2,
        background: "linear-gradient(45deg, #f59e0b, #fbbf24, #f59e0b)",
        borderRadius: 22,
        zIndex: -1,
        animation: "pulse 2s infinite",
      }
    : {},
  "@keyframes pulse": {
    "0%, 100%": { opacity: 1 },
    "50%": { opacity: 0.8 },
  },
}));

const StatsCard = styled(MuiCard)(({ theme }) => ({
  position: "relative",
  overflow: "hidden",
  borderRadius: 16,
  border: "1px solid rgba(255, 255, 255, 0.1)",
  background: "rgba(255, 255, 255, 0.05)",
  backdropFilter: "blur(10px)",
  color: "#ffffff",
  transition: "all 0.3s ease",
  "&:hover": {
    background: "rgba(255, 255, 255, 0.1)",
    transform: "translateY(-4px)",
  },
}));

const FeatureIcon = styled(Avatar)(({ theme }) => ({
  width: 56,
  height: 56,
  background: "linear-gradient(135deg, #1d2b48 0%, #2d3b58 100%)",
  marginBottom: 16,
  boxShadow: "0 8px 25px rgba(29, 43, 72, 0.3)",
}));

const CarouselContainer = styled(Box)(({ theme }) => ({
  position: "relative",
  overflow: "visible",
  margin: "0 auto",
  paddingLeft: 100, // Increased space for left button
  paddingRight: 100, // Increased space for right button
  paddingTop: 30, // Space for "Mais Popular" badge and hover effects
  paddingBottom: 20, // Space for hover effects
  [theme.breakpoints.down("lg")]: {
    paddingLeft: 80,
    paddingRight: 80,
  },
  [theme.breakpoints.down("md")]: {
    paddingLeft: 60,
    paddingRight: 60,
  },
  "& .carousel-inner": {
    overflowX: "hidden",
    overflowY: "visible",
    borderRadius: 20,
    position: "relative",
  },
  "& .carousel-track": {
    display: "flex",
    transition: "transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    gap: 20, // Increased gap for better spacing
  },
  "& .carousel-item": {
    minWidth: "100%",
    flexShrink: 0,
    [theme.breakpoints.up("sm")]: {
      minWidth: "calc(50% - 10px)",
    },
    [theme.breakpoints.up("lg")]: {
      minWidth: "calc(25% - 15px)", // Adjusted for better spacing
    },
  },
}));

const CarouselButton = styled(IconButton)(({ theme }) => ({
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  zIndex: 100,
  backgroundColor: theme.palette.background.paper,
  boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
  width: 56,
  height: 56,
  border: `2px solid ${theme.palette.divider}`,
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
    transform: "translateY(-50%) scale(1.05)",
    boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
  },
  "&:disabled": {
    opacity: 0.3,
    cursor: "not-allowed",
  },
  "&.prev": {
    left: 10,
  },
  "&.next": {
    right: 10,
  },
  [theme.breakpoints.down("lg")]: {
    width: 48,
    height: 48,
    "&.prev": {
      left: 5,
    },
    "&.next": {
      right: 5,
    },
  },
  [theme.breakpoints.down("md")]: {
    width: 40,
    height: 40,
    "&.prev": {
      left: 0,
    },
    "&.next": {
      right: 0,
    },
  },
}));

export default function BillingPage() {
  return (
    <DashboardPageWrapper>
      {({ orgId }) => <BillingContent orgId={orgId} />}
    </DashboardPageWrapper>
  );
}

function BillingContent({ orgId }: { orgId: string }) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const { org } = useOrgSelection();
  const [billingInterval, setBillingInterval] = useState<"month" | "year">(
    "month"
  );
  // Support modal state
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [supportForm, setSupportForm] = useState({
    subject: "",
    message: "",
  });
  const [supportSubmitted, setSupportSubmitted] = useState(false);
  const [supportLoading, setSupportLoading] = useState(false);

  // Carousel state and functions
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isAutoplayPaused, setIsAutoplayPaused] = useState(false);

  const subscriptionQuery = trpc.billing.getSubscription.useQuery(
    { orgId: orgId || "" },
    { enabled: !!orgId }
  );
  const plansQuery = trpc.billing.getPlans.useQuery(
    { orgId: orgId || "" },
    { enabled: !!orgId }
  );

  const checkoutMutation = trpc.billing.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });

  const portalMutation = trpc.billing.createPortalSession.useMutation({
    onSuccess: (data) => {
      window.open(data.url, "_blank");
    },
  });

  const handleUpgrade = async (plan: string, interval: string) => {
    // Track plan change
    if (org) {
      trackPlanChange(org.plan, plan, orgId);
    }

    await checkoutMutation.mutateAsync({
      orgId,
      plan: plan as any,
      interval: interval as any,
    });
  };

  const handleManageSubscription = async () => {
    await portalMutation.mutateAsync({ orgId });
  };

  const handleSupportSubmit = async () => {
    setSupportLoading(true);
    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: supportForm.subject,
          message: supportForm.message,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao enviar mensagem");
      }

      setSupportSubmitted(true);
    } catch (error) {
      console.error("Erro ao enviar mensagem de suporte:", error);
      alert("Erro ao enviar mensagem. Por favor, tente novamente.");
    } finally {
      setSupportLoading(false);
    }
  };

  const handleSupportModalClose = () => {
    setSupportModalOpen(false);
    setSupportSubmitted(false);
    setSupportForm({ subject: "", message: "" });
  };

  const subscription = subscriptionQuery.data;
  const plans = plansQuery.data || [];

  // Carousel functions
  const getVisibleSlides = () => {
    if (typeof window === "undefined") return 1;
    if (window.innerWidth >= 1024) return 4; // lg: show 4
    if (window.innerWidth >= 640) return 2; // sm: show 2
    return 1; // xs: show 1
  };

  const getMaxSlide = () => {
    if (plans.length <= 1) return 0;
    const visibleSlides = getVisibleSlides();
    return Math.max(0, plans.length - visibleSlides);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => {
      const maxSlide = getMaxSlide();
      return prev >= maxSlide ? 0 : prev + 1;
    });
    setIsAutoplayPaused(true);
    setTimeout(() => setIsAutoplayPaused(false), 8000); // Resume autoplay after 8 seconds
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => {
      const maxSlide = getMaxSlide();
      return prev <= 0 ? maxSlide : prev - 1;
    });
    setIsAutoplayPaused(true);
    setTimeout(() => setIsAutoplayPaused(false), 8000); // Resume autoplay after 8 seconds
  };

  // Auto-adjust current slide when window resizes
  useEffect(() => {
    const handleResize = () => {
      const maxSlide = getMaxSlide();
      setCurrentSlide((prev) => Math.min(prev, maxSlide));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [plans.length]);

  // Autoplay carousel
  useEffect(() => {
    if (plans.length <= getVisibleSlides() || isAutoplayPaused) return; // Don't autoplay if all items are visible or paused

    const interval = setInterval(() => {
      setCurrentSlide((prev) => {
        const maxSlide = getMaxSlide();
        return prev >= maxSlide ? 0 : prev + 1;
      });
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [plans.length, isAutoplayPaused]);

  if (subscriptionQuery.isLoading || plansQuery.isLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "background.default",
          py: 4,
        }}
      >
        <Container maxWidth={false} sx={{ maxWidth: "2000px", mx: "auto" }}>
          {/* Header Skeleton */}
          <Box sx={{ textAlign: "center", mb: 8 }}>
            <Skeleton
              variant="text"
              width={400}
              height={60}
              sx={{ mx: "auto", mb: 2, borderRadius: 2 }}
            />
            <Skeleton
              variant="text"
              width={600}
              height={30}
              sx={{ mx: "auto", borderRadius: 1 }}
            />
          </Box>

          {/* Hero Card Skeleton */}
          <HeroCard sx={{ mb: 8 }}>
            <MuiCardContent sx={{ p: 6 }}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                  gap: 4,
                }}
              >
                {[1, 2, 3].map((i) => (
                  <StatsCard key={i}>
                    <MuiCardContent sx={{ p: 3, textAlign: "center" }}>
                      <Skeleton
                        variant="circular"
                        width={56}
                        height={56}
                        sx={{ mx: "auto", mb: 2 }}
                      />
                      <Skeleton
                        variant="text"
                        width={100}
                        height={24}
                        sx={{ mx: "auto", mb: 1, borderRadius: 1 }}
                      />
                      <Skeleton
                        variant="text"
                        width={60}
                        height={40}
                        sx={{ mx: "auto", mb: 2, borderRadius: 1 }}
                      />
                      <Skeleton
                        variant="rectangular"
                        width="100%"
                        height={8}
                        sx={{ borderRadius: 1 }}
                      />
                    </MuiCardContent>
                  </StatsCard>
                ))}
              </Box>
            </MuiCardContent>
          </HeroCard>

          {/* Plans Skeleton */}
          <Box sx={{ mb: 6 }}>
            <Skeleton
              variant="text"
              width={300}
              height={40}
              sx={{ mx: "auto", mb: 4, borderRadius: 2 }}
            />
            <Box sx={{ display: "flex", justifyContent: "center", mb: 6 }}>
              <Skeleton
                variant="rectangular"
                width={300}
                height={50}
                sx={{ borderRadius: 3 }}
              />
            </Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  lg: "repeat(4, 1fr)",
                },
                gap: 4,
              }}
            >
              {[1, 2, 3, 4].map((i) => (
                <PlanCard key={i}>
                  <MuiCardContent sx={{ p: 4, flexGrow: 1 }}>
                    <Skeleton
                      variant="text"
                      width={120}
                      height={32}
                      sx={{ mb: 4, borderRadius: 1 }}
                    />
                    <Skeleton
                      variant="text"
                      width={150}
                      height={48}
                      sx={{ mb: 1, borderRadius: 1 }}
                    />
                    <Skeleton
                      variant="text"
                      width={80}
                      height={24}
                      sx={{ mb: 4, borderRadius: 1 }}
                    />
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        mb: 6,
                      }}
                    >
                      {[1, 2, 3, 4].map((j) => (
                        <Box
                          key={j}
                          sx={{ display: "flex", alignItems: "center", gap: 2 }}
                        >
                          <Skeleton variant="circular" width={24} height={24} />
                          <Skeleton
                            variant="text"
                            width="100%"
                            height={20}
                            sx={{ borderRadius: 1 }}
                          />
                        </Box>
                      ))}
                    </Box>
                    <Skeleton
                      variant="rectangular"
                      width="100%"
                      height={48}
                      sx={{ borderRadius: 3 }}
                    />
                  </MuiCardContent>
                </PlanCard>
              ))}
            </Box>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        py: 6,
      }}
    >
      <Container maxWidth={false} sx={{ maxWidth: "2000px", mx: "auto" }}>
        {/* Hero Section */}
        <Box sx={{ textAlign: "center", mb: 8 }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              color: "text.primary",
              mb: 2,
              textShadow: "0 2px 20px rgba(0,0,0,0.1)",
            }}
          >
            Sua Assinatura
          </Typography>
          <Typography
            variant="h5"
            sx={{ color: "text.secondary", mb: 6, maxWidth: 600, mx: "auto" }}
          >
            Gerencie sua assinatura e potencialize seu negócio com os recursos
            premium
          </Typography>
        </Box>

        {/* Current Plan Hero Card */}
        <HeroCard sx={{ mb: 8 }}>
          <MuiCardContent sx={{ p: 6 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                gap: 4,
                mb: 6,
              }}
            >
              {/* Contracts Stats */}
              <StatsCard>
                <MuiCardContent sx={{ p: 3, textAlign: "center" }}>
                  <FeatureIcon>
                    <FileText size={28} color="#ffffff" />
                  </FeatureIcon>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    Contratos
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
                    0
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={0}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: "rgba(255, 255, 255, 0.2)",
                      "& .MuiLinearProgress-bar": {
                        bgcolor: "#ffffff",
                        borderRadius: 4,
                      },
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: "rgba(255, 255, 255, 0.8)",
                      mt: 1,
                      display: "block",
                    }}
                  >
                    0 de{" "}
                    {org?.maxContracts === 999999 ? "∞" : org?.maxContracts}
                  </Typography>
                </MuiCardContent>
              </StatsCard>

              {/* Users Stats */}
              <StatsCard>
                <MuiCardContent sx={{ p: 3, textAlign: "center" }}>
                  <FeatureIcon>
                    <Users size={28} color="#ffffff" />
                  </FeatureIcon>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    Usuários
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
                    0
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={0}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: "rgba(255, 255, 255, 0.2)",
                      "& .MuiLinearProgress-bar": {
                        bgcolor: "#ffffff",
                        borderRadius: 4,
                      },
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: "rgba(255, 255, 255, 0.8)",
                      mt: 1,
                      display: "block",
                    }}
                  >
                    0 de {org?.maxUsers === 999999 ? "∞" : org?.maxUsers}
                  </Typography>
                </MuiCardContent>
              </StatsCard>

              {/* Current Plan */}
              <StatsCard>
                <MuiCardContent sx={{ p: 3, textAlign: "center" }}>
                  <FeatureIcon>
                    <Crown size={28} color="#ffffff" />
                  </FeatureIcon>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    Plano Atual
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
                    {org?.plan || "Free"}
                  </Typography>
                  <Box sx={{ display: "flex", justifyContent: "center" }}>
                    <Chip
                      label={
                        subscription?.cancelAtPeriodEnd ? "Cancelando" : "Ativo"
                      }
                      sx={{
                        bgcolor: subscription?.cancelAtPeriodEnd
                          ? "#ef4444"
                          : "#10b981",
                        color: "#ffffff",
                        fontWeight: 700,
                      }}
                    />
                  </Box>
                </MuiCardContent>
              </StatsCard>
            </Box>

            {/* Plan Details */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
                  Plano {org?.plan || "Free"}
                </Typography>
                <Stack direction="row" spacing={3}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <FileText size={20} />
                    <Typography variant="body1">
                      {org?.maxContracts && org.maxContracts >= 999999
                        ? "Contratos ilimitados"
                        : `${org?.maxContracts} contratos`}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Users size={20} />
                    <Typography variant="body1">
                      {org?.maxUsers && org.maxUsers >= 999999
                        ? "Usuários ilimitados"
                        : `${org?.maxUsers} usuários`}
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              {subscription && (
                <Button
                  variant="contained"
                  onClick={handleManageSubscription}
                  disabled={portalMutation.isPending}
                  startIcon={<CreditCard size={20} />}
                  sx={{
                    bgcolor: "#ffffff",
                    color: "#1d2b48",
                    fontWeight: 700,
                    borderRadius: 4,
                    px: 4,
                    py: 2,
                    fontSize: "1.1rem",
                    boxShadow: "0 8px 25px rgba(0,0,0,0.2)",
                    "&:hover": {
                      bgcolor: "#f8fafc",
                      transform: "translateY(-2px)",
                      boxShadow: "0 12px 30px rgba(0,0,0,0.3)",
                    },
                    transition: "all 0.3s ease",
                  }}
                >
                  Gerenciar Assinatura
                </Button>
              )}
            </Box>
          </MuiCardContent>
        </HeroCard>

        {/* Plans Section */}
        <Box sx={{ mb: 8 }}>
          <Box sx={{ textAlign: "center", mb: 6 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                color: "text.primary",
                mb: 2,
              }}
            >
              Escolha Seu Plano
            </Typography>
            <Typography variant="h6" sx={{ color: "text.secondary", mb: 6 }}>
              Planos que se adaptam ao crescimento do seu negócio
            </Typography>

            {/* Billing Interval Toggle */}
            <ToggleButtonGroup
              value={billingInterval}
              exclusive
              onChange={(_, value) => {
                if (value !== null) {
                  setBillingInterval(value);
                }
              }}
              sx={{
                bgcolor: "background.paper",
                borderRadius: 4,
                border: 1,
                borderColor: "divider",
                mb: 4,
                "& .MuiToggleButton-root": {
                  color: "text.secondary",
                  border: "none",
                  fontWeight: 700,
                  px: 4,
                  py: 2,
                  borderRadius: 3,
                  "&.Mui-selected": {
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    "&:hover": {
                      bgcolor: "primary.dark",
                    },
                  },
                  "&:hover": {
                    bgcolor: "action.hover",
                  },
                },
              }}
            >
              <ToggleButton value="month">Mensal</ToggleButton>
              <ToggleButton value="year">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  Anual
                  <Chip
                    label="Economize 17%"
                    size="small"
                    sx={{
                      bgcolor: "#10b981",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "0.7rem",
                      height: 20,
                    }}
                  />
                </Box>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Plans Carousel */}
          <CarouselContainer
            sx={{
              maxWidth: "2000px", // Much larger container
              mx: "auto",
            }}
          >
            <Box className="carousel-inner" sx={{ position: "relative" }}>
              <Box
                className="carousel-track"
                ref={carouselRef}
                sx={{
                  transform: `translateX(-${
                    currentSlide * (100 / getVisibleSlides())
                  }%)`,
                }}
              >
                {plans.map((plan, index) => {
                  const isPopularPlan =
                    plan.name === "Pro" ||
                    plan.id === "pro" ||
                    plan.id === "growth";

                  return (
                    <Box key={plan.id} className="carousel-item">
                      <PlanCard
                        featured={isPopularPlan}
                        sx={{
                          ...(isPopularPlan && {
                            border: "3px solid #f59e0b",
                            background:
                              "linear-gradient(135deg, #ffffff 0%, #fef3c7 100%)",
                          }),
                        }}
                      >
                        {isPopularPlan && (
                          <Box
                            sx={{
                              position: "absolute",
                              top: -6,
                              left: "50%",
                              transform: "translateX(-50%)",
                              zIndex: 10,
                            }}
                          >
                            <Chip
                              label={
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                  }}
                                >
                                  <Sparkles size={16} />
                                  MAIS POPULAR
                                </Box>
                              }
                              sx={{
                                bgcolor: "#f59e0b",
                                color: "#ffffff",
                                fontWeight: 800,
                                fontSize: "0.8rem",
                                px: 2,
                                py: 0.5,
                                boxShadow: "0 4px 15px rgba(245, 158, 11, 0.4)",
                              }}
                            />
                          </Box>
                        )}

                        <MuiCardContent
                          sx={{
                            p: 4,
                            flexGrow: 1,
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          {/* Plan Header */}
                          <Box sx={{ mb: 4 }}>
                            <Typography
                              variant="h5"
                              sx={{
                                fontWeight: 800,
                                mb: 2,
                                color: "#1d2b48",
                              }}
                            >
                              {plan.name}
                            </Typography>

                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "baseline",
                                gap: 1,
                                mb: 2,
                              }}
                            >
                              <Typography
                                variant="h2"
                                sx={{
                                  fontWeight: 900,
                                  color: "#1d2b48",
                                }}
                              >
                                {formatCurrency(
                                  billingInterval === "month"
                                    ? plan.price.monthly
                                    : plan.price.yearly,
                                  org?.currency as any,
                                  org?.locale
                                )}
                              </Typography>
                              <Typography
                                variant="h6"
                                sx={{
                                  color: "#64748b",
                                  fontWeight: 600,
                                }}
                              >
                                /{billingInterval === "month" ? "mês" : "ano"}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Features */}
                          <Box sx={{ flexGrow: 1, mb: 4 }}>
                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 3,
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 2,
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: "50%",
                                    bgcolor: "#10b981",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <Check size={16} color="#ffffff" />
                                </Box>
                                <Typography
                                  variant="body1"
                                  sx={{
                                    color: "#374151",
                                    fontWeight: 600,
                                  }}
                                >
                                  {plan.maxContracts >= 999999
                                    ? "Contratos ilimitados"
                                    : `Até ${plan.maxContracts} contratos`}
                                </Typography>
                              </Box>

                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 2,
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: "50%",
                                    bgcolor: "#10b981",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <Check size={16} color="#ffffff" />
                                </Box>
                                <Typography
                                  variant="body1"
                                  sx={{
                                    color: "#374151",
                                    fontWeight: 600,
                                  }}
                                >
                                  {plan.maxUsers >= 999999
                                    ? "Usuários ilimitados"
                                    : `Até ${plan.maxUsers} usuários`}
                                </Typography>
                              </Box>

                              {(plan as any).features?.automaticAlerts && (
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2,
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: 24,
                                      height: 24,
                                      borderRadius: "50%",
                                      bgcolor: "#10b981",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    <Check size={16} color="#ffffff" />
                                  </Box>
                                  <Typography
                                    variant="body1"
                                    sx={{
                                      color: "#374151",
                                      fontWeight: 600,
                                    }}
                                  >
                                    Alertas automáticos
                                  </Typography>
                                </Box>
                              )}

                              {(plan as any).features?.automaticRenewal && (
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2,
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: 24,
                                      height: 24,
                                      borderRadius: "50%",
                                      bgcolor: "#10b981",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    <Check size={16} color="#ffffff" />
                                  </Box>
                                  <Typography
                                    variant="body1"
                                    sx={{
                                      color: "#374151",
                                      fontWeight: 600,
                                    }}
                                  >
                                    Renovação automática
                                  </Typography>
                                </Box>
                              )}

                              {(plan as any).features?.automaticAdjustments && (
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2,
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: 24,
                                      height: 24,
                                      borderRadius: "50%",
                                      bgcolor: "#10b981",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    <Check size={16} color="#ffffff" />
                                  </Box>
                                  <Typography
                                    variant="body1"
                                    sx={{
                                      color: "#374151",
                                      fontWeight: 600,
                                    }}
                                  >
                                    Reajustes automáticos
                                  </Typography>
                                </Box>
                              )}

                              {(plan as any).features?.fileUpload && (
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2,
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: 24,
                                      height: 24,
                                      borderRadius: "50%",
                                      bgcolor: "#10b981",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    <Check size={16} color="#ffffff" />
                                  </Box>
                                  <Typography
                                    variant="body1"
                                    sx={{
                                      color: "#374151",
                                      fontWeight: 600,
                                    }}
                                  >
                                    Upload de arquivos
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>

                          {/* CTA Button */}
                          <Button
                            fullWidth
                            variant={
                              plan.isCurrentPlan ? "outlined" : "contained"
                            }
                            disabled={
                              plan.isCurrentPlan || checkoutMutation.isPending
                            }
                            onClick={() =>
                              handleUpgrade(plan.id, billingInterval)
                            }
                            sx={{
                              py: 2.5,
                              borderRadius: 4,
                              fontWeight: 800,
                              fontSize: "1.1rem",
                              textTransform: "none",
                              bgcolor: plan.isCurrentPlan
                                ? "transparent"
                                : isPopularPlan
                                ? "#f59e0b"
                                : "#1d2b48",
                              color: plan.isCurrentPlan ? "#1d2b48" : "#ffffff",
                              borderColor: isPopularPlan
                                ? "#f59e0b"
                                : "#1d2b48",
                              boxShadow: plan.isCurrentPlan
                                ? "none"
                                : isPopularPlan
                                ? "0 8px 25px rgba(245, 158, 11, 0.4)"
                                : "0 8px 25px rgba(29, 43, 72, 0.4)",
                              "&:hover": {
                                bgcolor: plan.isCurrentPlan
                                  ? "rgba(29, 43, 72, 0.08)"
                                  : isPopularPlan
                                  ? "#e8890b"
                                  : "#2d3b58",
                                transform: "translateY(-1px)",
                                boxShadow: plan.isCurrentPlan
                                  ? "0 4px 12px rgba(29, 43, 72, 0.15)"
                                  : isPopularPlan
                                  ? "0 6px 20px rgba(245, 158, 11, 0.3)"
                                  : "0 6px 20px rgba(29, 43, 72, 0.3)",
                              },
                              transition:
                                "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            }}
                          >
                            {plan.isCurrentPlan
                              ? "✓ Plano Atual"
                              : `Escolher ${plan.name}`}
                          </Button>
                        </MuiCardContent>
                      </PlanCard>
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {getMaxSlide() > 0 && (
              <>
                <CarouselButton
                  className="prev"
                  onClick={prevSlide}
                  disabled={currentSlide === 0}
                  sx={{
                    opacity: currentSlide === 0 ? 0.5 : 1,
                    cursor: currentSlide === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  <ChevronLeft />
                </CarouselButton>
                <CarouselButton
                  className="next"
                  onClick={nextSlide}
                  disabled={currentSlide >= getMaxSlide()}
                  sx={{
                    opacity: currentSlide >= getMaxSlide() ? 0.5 : 1,
                    cursor:
                      currentSlide >= getMaxSlide() ? "not-allowed" : "pointer",
                  }}
                >
                  <ChevronRight />
                </CarouselButton>
              </>
            )}
          </CarouselContainer>
        </Box>

        {/* FAQ Section */}
        <Paper
          sx={{
            borderRadius: 4,
            bgcolor: "background.paper",
            border: 1,
            borderColor: "divider",
          }}
        >
          <MuiCardContent sx={{ p: 6 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                textAlign: "center",
                color: "text.primary",
                mb: 6,
              }}
            >
              Perguntas Frequentes
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 6,
              }}
            >
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 2,
                    mb: 3,
                  }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      bgcolor: "#1d2b48",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      mt: 0.5,
                    }}
                  >
                    <Typography sx={{ color: "#fff", fontWeight: 800 }}>
                      ?
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700, color: "text.primary", mb: 2 }}
                    >
                      Posso cancelar a qualquer momento?
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ color: "text.secondary", lineHeight: 1.7 }}
                    >
                      Sim! Você pode cancelar sua assinatura a qualquer momento
                      através do portal de gerenciamento. Seu acesso continuará
                      até o fim do período pago, sem taxas adicionais.
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 2,
                    mb: 3,
                  }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      bgcolor: "#1d2b48",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      mt: 0.5,
                    }}
                  >
                    <Typography sx={{ color: "#fff", fontWeight: 800 }}>
                      !
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700, color: "text.primary", mb: 2 }}
                    >
                      O que acontece se eu exceder os limites?
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ color: "text.secondary", lineHeight: 1.7 }}
                    >
                      Você será notificado com antecedência e poderá fazer
                      upgrade do seu plano. Não há cobranças surpresa ou
                      bloqueios súbitos.
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 2,
                    mb: 3,
                  }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      bgcolor: "#1d2b48",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      mt: 0.5,
                    }}
                  >
                    <Settings size={16} color="#ffffff" />
                  </Box>
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700, color: "text.primary", mb: 2 }}
                    >
                      Posso mudar de plano?
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ color: "text.secondary", lineHeight: 1.7 }}
                    >
                      Sim! Você pode fazer upgrade ou downgrade do seu plano a
                      qualquer momento. O valor será ajustado proporcionalmente
                      ao período restante.
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 2,
                    mb: 3,
                  }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      bgcolor: "#10b981",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      mt: 0.5,
                    }}
                  >
                    <Typography sx={{ color: "#fff", fontWeight: 800 }}>
                      %
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700, color: "text.primary", mb: 2 }}
                    >
                      Há desconto para pagamento anual?
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ color: "text.secondary", lineHeight: 1.7 }}
                    >
                      Sim! Ao escolher o pagamento anual, você economiza 17% do
                      valor total, equivalente a aproximadamente 2 meses grátis.
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* Contact Section */}
            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: "text.primary", mb: 2 }}
              >
                Ainda tem dúvidas?
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: "text.secondary", mb: 4 }}
              >
                Nossa equipe está sempre pronta para ajudar você
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Download size={20} />}
                onClick={() => setSupportModalOpen(true)}
                sx={{
                  borderColor: "primary.main",
                  color: "primary.main",
                  fontWeight: 700,
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  "&:hover": {
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    transform: "translateY(-2px)",
                    boxShadow: 3,
                  },
                  transition: "all 0.3s ease",
                }}
              >
                Falar com Suporte
              </Button>
            </Box>
          </MuiCardContent>
        </Paper>

        {/* Support Modal */}
        <Dialog
          open={supportModalOpen}
          onClose={handleSupportModalClose}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              p: 1,
            },
          }}
        >
          <DialogTitle
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              pb: 2,
              pt: 4,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar
                sx={{
                  bgcolor: "primary.main",
                  width: 40,
                  height: 40,
                }}
              >
                <Send size={20} />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Falar com Suporte
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Nossa equipe responderá em até 24 horas
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={handleSupportModalClose}
              size="small"
              sx={{
                color: "text.secondary",
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              <X size={20} />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ px: 3, py: 4 }}>
            {supportSubmitted ? (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 3,
                  py: 4,
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: "success.main",
                    width: 64,
                    height: 64,
                  }}
                >
                  <Check size={32} />
                </Avatar>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5 }}>
                    Mensagem Enviada!
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    Recebemos sua solicitação de suporte e nossa equipe entrará
                    em contato em breve.
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Você receberá uma resposta em até 24 horas no seu email
                    cadastrado.
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Box
                sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1 }}
              >
                <TextField
                  label="Assunto"
                  fullWidth
                  variant="outlined"
                  value={supportForm.subject}
                  onChange={(e) =>
                    setSupportForm((prev) => ({
                      ...prev,
                      subject: e.target.value,
                    }))
                  }
                  placeholder="Ex: Dúvida sobre planos, problema técnico..."
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                    "& .MuiInputLabel-root": {
                      backgroundColor: "background.paper",
                      px: 1,
                    },
                  }}
                />

                <TextField
                  label="Mensagem"
                  fullWidth
                  multiline
                  rows={4}
                  variant="outlined"
                  value={supportForm.message}
                  onChange={(e) =>
                    setSupportForm((prev) => ({
                      ...prev,
                      message: e.target.value,
                    }))
                  }
                  placeholder="Descreva sua dúvida ou problema em detalhes..."
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                    "& .MuiInputLabel-root": {
                      backgroundColor: "background.paper",
                      px: 1,
                    },
                  }}
                />

                <Box
                  sx={{
                    bgcolor: "action.hover",
                    borderRadius: 2,
                    p: 2,
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textAlign: "center" }}
                  >
                    <strong>Dica:</strong> Inclua o máximo de detalhes possível
                    para que possamos ajudá-lo melhor
                  </Typography>
                </Box>
              </Box>
            )}
          </DialogContent>

          {!supportSubmitted && (
            <DialogActions
              sx={{
                p: 3,
                pt: 2,
                gap: 2,
                justifyContent: "center",
              }}
            >
              <Button
                onClick={handleSupportModalClose}
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  px: 3,
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSupportSubmit}
                variant="contained"
                disabled={
                  !supportForm.subject.trim() ||
                  !supportForm.message.trim() ||
                  supportLoading
                }
                startIcon={
                  supportLoading ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <Send size={18} />
                  )
                }
                sx={{
                  borderRadius: 2,
                  px: 3,
                  fontWeight: 600,
                }}
              >
                {supportLoading ? "Enviando..." : "Enviar Mensagem"}
              </Button>
            </DialogActions>
          )}
        </Dialog>
      </Container>
    </Box>
  );
}
