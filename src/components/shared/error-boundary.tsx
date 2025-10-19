"use client";

import React, { Component, ReactNode } from "react";
import { Box, Button, Typography, Card, CardContent } from "@mui/material";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { formatErrorForDisplay, logError } from "@/lib/error-handler";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary component to catch and handle React errors gracefully
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logError(error, "ErrorBoundary", { errorInfo });

    this.setState({
      error,
      errorInfo,
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { title, message } = formatErrorForDisplay(
        this.state.error,
        "application"
      );

      return (
        <Box
          sx={{
            minHeight: "400px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 3,
          }}
        >
          <Card sx={{ maxWidth: 600, width: "100%" }}>
            <CardContent sx={{ p: 4, textAlign: "center" }}>
              <Box
                sx={{
                  mx: "auto",
                  mb: 3,
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  bgcolor: "#fee2e2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AlertTriangle
                  style={{ width: 32, height: 32, color: "#dc2626" }}
                />
              </Box>

              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                {title}
              </Typography>

              <Typography
                variant="body1"
                sx={{ color: "text.secondary", mb: 3 }}
              >
                {message}
              </Typography>

              {this.props.showDetails &&
                this.state.error &&
                process.env.NODE_ENV === "development" && (
                  <Box
                    sx={{
                      mt: 3,
                      p: 2,
                      bgcolor: "#f9fafb",
                      borderRadius: 1,
                      textAlign: "left",
                      maxHeight: 200,
                      overflow: "auto",
                    }}
                  >
                    <Typography
                      variant="caption"
                      component="pre"
                      sx={{
                        fontSize: "0.75rem",
                        fontFamily: "monospace",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </Typography>
                  </Box>
                )}

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "center",
                  mt: 4,
                }}
              >
                <Button
                  variant="contained"
                  startIcon={<RefreshCw size={18} />}
                  onClick={this.handleReset}
                  sx={{
                    bgcolor: "#1d2b48",
                    "&:hover": {
                      bgcolor: "#2d3b58",
                    },
                  }}
                >
                  Tentar Novamente
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Home size={18} />}
                  href="/dashboard"
                  sx={{
                    borderColor: "#1d2b48",
                    color: "#1d2b48",
                    "&:hover": {
                      borderColor: "#2d3b58",
                      bgcolor: "rgba(29, 43, 72, 0.04)",
                    },
                  }}
                >
                  Voltar ao Início
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary for functional components
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const handleError = React.useCallback((error: Error) => {
    logError(error, "useErrorHandler");
    setError(error);
  }, []);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  return { handleError, resetError, hasError: !!error };
}
