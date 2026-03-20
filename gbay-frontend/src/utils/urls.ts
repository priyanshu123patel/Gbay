const env = (import.meta as any).env || {};
const apiBaseUrl = env.VITE_API_URL || "http://localhost:5000/api";

export const backendBaseUrl = (
  env.VITE_BACKEND_URL || apiBaseUrl.replace(/\/api\/?$/, "")
).replace(/\/$/, "");

function normalizeStoredPath(pathValue: string) {
  return pathValue.replace(/\\/g, "/").trim();
}

function asAppAssetPath(pathValue: string) {
  return `/${pathValue.replace(/^\/+/, "")}`;
}

export function getProductImageUrl(imagePath?: string | null) {
  if (!imagePath) return null;

  const firstImage = imagePath.split(",")[0]?.trim();
  if (!firstImage) return null;
  const normalized = normalizeStoredPath(firstImage);

  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }

  if (normalized.startsWith("/assets/") || normalized.startsWith("assets/")) {
    return asAppAssetPath(normalized);
  }

  if (normalized.startsWith("/uploads/")) {
    return `${backendBaseUrl}${normalized}`;
  }

  if (normalized.startsWith("uploads/")) {
    return `${backendBaseUrl}/${normalized}`;
  }

  if (normalized.startsWith("/")) {
    return `${backendBaseUrl}${normalized}`;
  }

  const fileName = normalized.split("/").pop();
  return fileName ? `/assets/products/${fileName}` : null;
}

export function getProfileImageUrl(profilePath?: string | null) {
  if (!profilePath || typeof profilePath !== "string") return null;

  const normalized = normalizeStoredPath(profilePath);

  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }

  if (normalized.startsWith("/uploads/")) {
    return `${backendBaseUrl}${normalized}`;
  }

  if (normalized.startsWith("uploads/")) {
    return `${backendBaseUrl}/${normalized}`;
  }

  if (normalized.startsWith("/assets/") || normalized.startsWith("assets/")) {
    return asAppAssetPath(normalized);
  }

  if (normalized.startsWith("/")) {
    return `${backendBaseUrl}${normalized}`;
  }

  const fileName = normalized.split("/").pop();
  return fileName ? `/assets/profile/${fileName}` : null;
}

export const googleAuthUrl = `${backendBaseUrl}/auth/google`;
