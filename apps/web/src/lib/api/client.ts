import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { API_URL } from "@app/lib/config/env";

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Resource not found") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

export class NetworkError extends ApiError {
  constructor(message = "Network request failed") {
    super(message);
    this.name = "NetworkError";
  }
}

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retryAfterRefresh?: boolean;
};

const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let refreshRequest: Promise<void> | null = null;

function shouldSkipRefresh(url = "") {
  return [
    "/auth/login",
    "/auth/register",
    "/auth/verify-email",
    "/auth/resend-verification",
    "/auth/refresh",
    "/auth/logout",
  ].some((endpoint) => url.includes(endpoint));
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableRequestConfig | undefined;

    if (
      error.response?.status !== 401 ||
      !config ||
      config._retryAfterRefresh ||
      shouldSkipRefresh(config.url)
    ) {
      return Promise.reject(error);
    }

    config._retryAfterRefresh = true;
    try {
      refreshRequest ??= axios
        .post(`${API_URL}/auth/refresh`, undefined, { withCredentials: true })
        .then(() => undefined)
        .finally(() => {
          refreshRequest = null;
        });

      await refreshRequest;
      return await apiClient.request(config);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);

function toApiError(error: unknown): ApiError {
  if (!(error instanceof AxiosError)) {
    return error instanceof ApiError
      ? error
      : new ApiError("An unexpected error occurred");
  }

  const response = error.response;
  const body = response?.data as { message?: string | string[] } | undefined;
  const message = Array.isArray(body?.message)
    ? body.message.join(", ")
    : body?.message || error.message || "API request failed";

  if (!response) return new NetworkError(message);
  if (response.status === 404) return new NotFoundError(message);
  return new ApiError(message, response.status, response.data);
}

export async function apiFetch<T>(
  path: string,
  options?: Omit<AxiosRequestConfig, "url" | "method" | "data" | "signal"> & {
    method?: AxiosRequestConfig["method"];
    body?: unknown;
    signal?: AbortSignal;
  },
): Promise<T> {
  const request: AxiosRequestConfig = {
    url: path,
    method: options?.method ?? "GET",
    data: options?.body,
    headers: options?.headers as AxiosRequestConfig["headers"],
    signal: options?.signal ?? undefined,
  };

  try {
    const response = await apiClient.request<T>(request);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}
