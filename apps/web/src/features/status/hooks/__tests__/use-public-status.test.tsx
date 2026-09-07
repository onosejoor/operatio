import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { usePublicStatus } from "../use-public-status";
import { apiFetch } from "@app/lib/api/client";
import {
  MonitorPerformanceStatus,
  OverallStatus,
  type PublicStatusResponse,
} from "../../types/public-status";

// Mock the shared API client
vi.mock("@/lib/api/client");

describe("usePublicStatus", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("should be disabled when slug is empty", () => {
    const { result } = renderHook(() => usePublicStatus(""), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
  });

  it("should be enabled when slug is provided", () => {
    const { result } = renderHook(() => usePublicStatus("test-slug"), {
      wrapper,
    });

    expect(result.current.fetchStatus).not.toBe("idle");
  });

  it("should expose standard React Query states", () => {
    const mockResponse: PublicStatusResponse = {
      statusPage: {
        name: "Test Status",
        slug: "test",
        description: "Test description",
      },
      status: OverallStatus.OPERATIONAL,
      monitors: [],
      incidents: [],
    };

    vi.mocked(apiFetch).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => usePublicStatus("test"), { wrapper });

    expect(result.current).toHaveProperty("data");
    expect(result.current).toHaveProperty("isLoading");
    expect(result.current).toHaveProperty("isError");
    expect(result.current).toHaveProperty("error");
    expect(result.current).toHaveProperty("refetch");
  });

  it("should call API client with correct slug", async () => {
    const mockResponse: PublicStatusResponse = {
      statusPage: {
        name: "Test Status",
        slug: "test",
        description: "Test description",
      },
      status: OverallStatus.OPERATIONAL,
      monitors: [],
      incidents: [],
    };

    vi.mocked(apiFetch).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => usePublicStatus("my-slug"), {
      wrapper,
    });

    await waitFor(() => result.current.isSuccess);

    expect(apiFetch).toHaveBeenCalledWith("/public/status/my-slug");
  });

  it("should return data on successful fetch", async () => {
    const mockResponse: PublicStatusResponse = {
      statusPage: {
        name: "Test Status",
        slug: "test",
        description: "Test description",
      },
      status: OverallStatus.OPERATIONAL,
      monitors: [
        {
          name: "API",
          status: MonitorPerformanceStatus.UP,
          uptime: 99.98,
          responseTime: 142,
        },
      ],
      incidents: [],
    };

    vi.mocked(apiFetch).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => usePublicStatus("test"), { wrapper });

    await waitFor(() => result.current.isSuccess);

    expect(result.current.data).toEqual(mockResponse);
  });
});
