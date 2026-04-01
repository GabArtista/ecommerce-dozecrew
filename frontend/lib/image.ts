import type { CSSProperties } from "react";

const LOCAL_IMAGE_HOSTS = new Set(["127.0.0.1", "localhost"]);

export function shouldBypassImageOptimization(
  src: string | undefined | null,
): boolean {
  if (!src || src.startsWith("/")) {
    return false;
  }

  try {
    const url = new URL(src);
    return LOCAL_IMAGE_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

export function getImageBackdropStyle(
  src: string | undefined | null,
): CSSProperties | undefined {
  if (!src) {
    return undefined;
  }

  return {
    backgroundImage: `url(${JSON.stringify(src)})`,
  };
}
