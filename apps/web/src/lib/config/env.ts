const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

export const API_URL =
  typeof window === "undefined"
    ? `${backendUrl || "http://localhost:3001"}/api/v1`
    : "/api/v1";
