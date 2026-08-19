import Image, { type ImageProps } from "next/image";

/**
 * Thin wrapper over next/image with optimization disabled. This lets us
 * render locally-served /api/files URLs and SVG seed placeholders without
 * configuring remote patterns or a sharp-based optimizer. Swap `unoptimized`
 * off once a real CDN/Cloudinary domain is configured for production.
 */
export function AppImage(props: ImageProps) {
  return <Image unoptimized {...props} />;
}
