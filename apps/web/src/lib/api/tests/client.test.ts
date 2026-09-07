import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  apiFetch,
  ApiError,
  NotFoundError,
  NetworkError,
} from "@app/lib/api/client";

// Mock process.env
const originalEnv = process.env;

describe("apiFetch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_API_URL: "http://test-api.com",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should make successful request and return data", async () => {
    const mockData = { message: "success" };
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);

    const result = await apiFetch("/test");

    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://test-api.com/test",
      expect.objectContaining({
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );
  });

  it("should throw NotFoundError on 404", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

    await expect(apiFetch("/test")).rejects.toThrow(NotFoundError);
    await expect(apiFetch("/test")).rejects.toThrow("Resource not found");
  });

  it("should throw ApiError on other error status", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ message: "Internal server error" }),
    } as Response);

    await expect(apiFetch("/test")).rejects.toThrow(ApiError);
    await expect(apiFetch("/test")).rejects.toThrow("Internal server error");
  });

  it("should use default error message when response body cannot be parsed", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("JSON parse error");
      },
    });

    await expect(apiFetch("/test")).rejects.toThrow("API request failed");
  });

  it("should throw NetworkError on TypeError", async () => {
    global.fetch = vi.fn().mockImplementationOnce(() => {
      throw new TypeError("Network error");
    });

    await expect(apiFetch("/test")).rejects.toThrow(NetworkError);
    await expect(apiFetch("/test")).rejects.toThrow("Network request failed");
  });

  it("should throw ApiError on unexpected errors", async () => {
    global.fetch = vi.fn().mockImplementationOnce(() => {
      throw new Error("Unexpected error");
    });

    await expect(apiFetch("/test")).rejects.toThrow(ApiError);
    await expect(apiFetch("/test")).rejects.toThrow(
      "An unexpected error occurred",
    );
  });

  it("should merge custom headers", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);

    await apiFetch("/test", {
      headers: {
        "X-Custom-Header": "custom-value",
      },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://test-api.com/test",
      expect.objectContaining({
        headers: {
          "Content-Type": "application/json",
          "X-Custom-Header": "custom-value",
        },
      }),
    );
  });

  it("should allow overriding Content-Type header", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);

    await apiFetch("/test", {
      headers: {
        "Content-Type": "application/xml",
      },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://test-api.com/test",
      expect.objectContaining({
        headers: {
          "Content-Type": "application/xml",
        },
      }),
    );
  });
});

describe("ApiError", () => {
  it("should create ApiError with message and status", () => {
    const error = new ApiError("Test error", 500, { detail: "Server error" });

    expect(error.message).toBe("Test error");
    expect(error.status).toBe(500);
    expect(error.body).toEqual({ detail: "Server error" });
    expect(error.name).toBe("ApiError");
  });
});

describe("NotFoundError", () => {
  it("should create NotFoundError with default message", () => {
    const error = new NotFoundError();

    expect(error.message).toBe("Resource not found");
    expect(error.status).toBe(404);
    expect(error.name).toBe("NotFoundError");
  });

  it("should create NotFoundError with custom message", () => {
    const error = new NotFoundError("Custom not found");

    expect(error.message).toBe("Custom not found");
    expect(error.status).toBe(404);
  });
});

describe("NetworkError", () => {
  it("should create NetworkError with default message", () => {
    const error = new NetworkError();

    expect(error.message).toBe("Network request failed");
    expect(error.name).toBe("NetworkError");
  });

  it("should create NetworkError with custom message", () => {
    const error = new NetworkError("Custom network error");

    expect(error.message).toBe("Custom network error");
  });
});
