/**
 * Centralized error handling utilities for the application.
 * This module provides consistent error messages and handling patterns
 * to ensure a better user experience across the entire application.
 */

import { TRPCClientError } from "@trpc/client";
import type { AppRouter } from "@/server/root";

export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "BAD_REQUEST"
  | "CONFLICT"
  | "INTERNAL_SERVER_ERROR"
  | "TIMEOUT"
  | "TOO_MANY_REQUESTS"
  | "PARSE_ERROR"
  | "VALIDATION_ERROR"
  | "NETWORK_ERROR";

/**
 * User-friendly error messages mapped to error codes
 */
const ERROR_MESSAGES: Record<ErrorCode, string> = {
  UNAUTHORIZED:
    "Sua sessão expirou. Por favor, faça login novamente para continuar.",
  FORBIDDEN:
    "Você não tem permissão para realizar esta ação. Entre em contato com um administrador se precisar de acesso.",
  NOT_FOUND:
    "O recurso solicitado não foi encontrado. Ele pode ter sido removido ou você não tem acesso a ele.",
  BAD_REQUEST:
    "Os dados fornecidos são inválidos. Verifique as informações e tente novamente.",
  CONFLICT:
    "Esta operação não pode ser concluída porque conflita com dados existentes.",
  INTERNAL_SERVER_ERROR:
    "Ocorreu um erro inesperado em nossos servidores. Nossa equipe foi notificada e está trabalhando para resolver o problema.",
  TIMEOUT:
    "A operação demorou mais do que o esperado. Por favor, tente novamente.",
  TOO_MANY_REQUESTS:
    "Você está fazendo muitas requisições. Por favor, aguarde um momento antes de tentar novamente.",
  PARSE_ERROR:
    "Não foi possível processar os dados. Por favor, tente novamente.",
  VALIDATION_ERROR:
    "Alguns campos contêm valores inválidos. Verifique os dados e tente novamente.",
  NETWORK_ERROR:
    "Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.",
};

/**
 * Context-specific error messages for better user guidance
 */
const CONTEXT_MESSAGES: Record<string, Record<string, string>> = {
  contract: {
    CREATE_FAILED: "Não foi possível criar o contrato. Tente novamente.",
    UPDATE_FAILED: "Não foi possível atualizar o contrato. Tente novamente.",
    DELETE_FAILED: "Não foi possível excluir o contrato. Tente novamente.",
    NOT_FOUND: "Contrato não encontrado ou você não tem acesso a ele.",
  },
  file: {
    UPLOAD_FAILED:
      "Não foi possível fazer upload do arquivo. Verifique o tamanho e tipo do arquivo.",
    UPLOAD_TOO_LARGE:
      "O arquivo é muito grande. O tamanho máximo permitido é de 10MB.",
    UPLOAD_INVALID_TYPE:
      "Tipo de arquivo não suportado. Use PDF, DOC, DOCX, XLS, XLSX ou imagens.",
    DOWNLOAD_FAILED:
      "Não foi possível baixar o arquivo. Ele pode ter sido removido.",
    DELETE_FAILED: "Não foi possível excluir o arquivo. Tente novamente.",
    NOT_FOUND: "Arquivo não encontrado ou você não tem acesso a ele.",
  },
  org: {
    CREATE_FAILED: "Não foi possível criar a organização. Tente novamente.",
    UPDATE_FAILED: "Não foi possível atualizar a organização. Tente novamente.",
    DELETE_FAILED: "Não foi possível excluir a organização. Tente novamente.",
    NOT_FOUND: "Organização não encontrada ou você não tem acesso a ela.",
    INVITE_FAILED: "Não foi possível enviar o convite. Tente novamente.",
  },
  auth: {
    SIGNIN_FAILED:
      "Não foi possível fazer login. Verifique suas credenciais e tente novamente.",
    SIGNUP_FAILED: "Não foi possível criar sua conta. Tente novamente.",
    EMAIL_ALREADY_EXISTS:
      "Este email já está em uso. Use outro email ou faça login.",
    INVALID_CREDENTIALS: "Email ou senha incorretos. Tente novamente.",
    TOKEN_EXPIRED:
      "Seu link de acesso expirou. Solicite um novo link de login.",
    EMAIL_SEND_FAILED:
      "Não foi possível enviar o email. Verifique o endereço e tente novamente.",
  },
};

/**
 * Extract a user-friendly error message from any error object
 */
export function getErrorMessage(
  error: unknown,
  context?: string,
  specificCode?: string
): string {
  // Check for context-specific messages first
  if (context && specificCode && CONTEXT_MESSAGES[context]?.[specificCode]) {
    return CONTEXT_MESSAGES[context][specificCode];
  }

  // Handle TRPC errors
  if (error instanceof TRPCClientError) {
    const trpcError = error as TRPCClientError<AppRouter>;
    const code = trpcError.data?.code as ErrorCode;

    // If the server provided a custom message, use it
    if (trpcError.message && trpcError.message !== code) {
      return trpcError.message;
    }

    // Otherwise, use the mapped message
    if (code && ERROR_MESSAGES[code]) {
      return ERROR_MESSAGES[code];
    }
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    // Check for network errors
    if (
      error.message.includes("fetch") ||
      error.message.includes("network") ||
      error.message.includes("NetworkError")
    ) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }

    // Return the error message if it's user-friendly (doesn't contain stack traces or technical terms)
    if (
      error.message &&
      !error.message.includes("at ") &&
      !error.message.includes("prisma") &&
      error.message.length < 200
    ) {
      return error.message;
    }
  }

  // Handle string errors
  if (typeof error === "string") {
    return error;
  }

  // Default fallback
  return "Ocorreu um erro inesperado. Por favor, tente novamente. Se o problema persistir, entre em contato com o suporte.";
}

/**
 * Check if an error is a TRPC error with a specific code
 */
export function isTRPCError(
  error: unknown,
  code?: ErrorCode
): error is TRPCClientError<AppRouter> {
  if (!(error instanceof TRPCClientError)) {
    return false;
  }

  if (!code) {
    return true;
  }

  return (error as TRPCClientError<AppRouter>).data?.code === code;
}

/**
 * Check if an error is related to authorization
 */
export function isAuthError(error: unknown): boolean {
  return isTRPCError(error, "UNAUTHORIZED") || isTRPCError(error, "FORBIDDEN");
}

/**
 * Check if an error is a validation error
 */
export function isValidationError(error: unknown): boolean {
  if (isTRPCError(error)) {
    const trpcError = error as TRPCClientError<AppRouter>;
    return (
      trpcError.data?.code === "BAD_REQUEST" ||
      trpcError.data?.code === "PARSE_ERROR" ||
      trpcError.data?.zodError !== undefined
    );
  }
  return false;
}

/**
 * Get validation errors from a Zod validation error
 */
export function getValidationErrors(error: unknown): Record<string, string> {
  if (isTRPCError(error)) {
    const trpcError = error as TRPCClientError<AppRouter>;
    const zodError = trpcError.data?.zodError;

    if (zodError?.fieldErrors) {
      const errors: Record<string, string> = {};
      Object.entries(zodError.fieldErrors).forEach(([field, messages]) => {
        if (messages && messages.length > 0) {
          errors[field] = messages[0];
        }
      });
      return errors;
    }
  }

  return {};
}

/**
 * Log error for debugging purposes (only in development)
 */
export function logError(
  error: unknown,
  context?: string,
  additionalInfo?: Record<string, any>
) {
  if (process.env.NODE_ENV === "development") {
    console.error(
      `[Error Handler${context ? ` - ${context}` : ""}]:`,
      error,
      additionalInfo || ""
    );
  }

  // In production, you might want to send this to an error tracking service
  // like Sentry, LogRocket, or similar
  if (process.env.NODE_ENV === "production") {
    // Example: Sentry.captureException(error, { extra: { context, ...additionalInfo } });
  }
}

/**
 * Handle errors in async operations with consistent user feedback
 */
export async function handleAsyncError<T>(
  operation: () => Promise<T>,
  options: {
    context?: string;
    specificCode?: string;
    onError?: (message: string) => void;
    onSuccess?: (result: T) => void;
    successMessage?: string;
    showToast?: boolean;
  } = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const result = await operation();

    if (options.onSuccess) {
      options.onSuccess(result);
    }

    return { success: true, data: result };
  } catch (error) {
    const errorMessage = getErrorMessage(
      error,
      options.context,
      options.specificCode
    );

    logError(error, options.context);

    if (options.onError) {
      options.onError(errorMessage);
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Retry an operation with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    shouldRetry?: (error: unknown, attempt: number) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    shouldRetry = (error) =>
      isTRPCError(error, "TIMEOUT") || isTRPCError(error, "NETWORK_ERROR"),
  } = options;

  let lastError: unknown;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !shouldRetry(error, attempt)) {
        throw error;
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Exponential backoff
      delay = Math.min(delay * 2, maxDelay);
    }
  }

  throw lastError;
}

/**
 * Format error for display in UI
 */
export function formatErrorForDisplay(
  error: unknown,
  context?: string
): {
  title: string;
  message: string;
  canRetry: boolean;
  isAuthError: boolean;
} {
  const message = getErrorMessage(error, context);
  const authError = isAuthError(error);

  let title = "Erro";
  let canRetry = true;

  if (authError) {
    title = "Acesso Negado";
    canRetry = false;
  } else if (isTRPCError(error, "NOT_FOUND")) {
    title = "Não Encontrado";
    canRetry = false;
  } else if (isValidationError(error)) {
    title = "Dados Inválidos";
    canRetry = false;
  } else if (isTRPCError(error, "NETWORK_ERROR")) {
    title = "Erro de Conexão";
  }

  return {
    title,
    message,
    canRetry,
    isAuthError: authError,
  };
}
