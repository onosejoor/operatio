import type { PublicStatusResponse } from "../types/public-status";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v";

export async function getPublicStatus(
  slug: string,
): Promise<PublicStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/public/status/${slug}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Status page not found");
    }
    throw new Error("Failed to fetch status page");
  }

  return response.json();
}
