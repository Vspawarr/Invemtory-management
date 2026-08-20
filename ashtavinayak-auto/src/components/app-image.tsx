import Image, { type ImageProps } from "next/image";

/**
 * Thin wrapper over next/image with optimization disabled. This lets us
 * render locally-served /api/files URLs and SVG seed placeholders without
 * configuring remote patterns or a sharp-based optimizer. Swap `unoptimized`
 * off once a real CDN/Cloudinary domain is configured for production.
 */
export function AppImage(props: ImageProps) {
  // alt is required by ImageProps and enforced at every call site by TypeScript;
  // eslint's static jsx-a11y check can't see through the spread.
  // eslint-disable-next-line jsx-a11y/alt-text
  return <Image unoptimized {...props} />;
}
