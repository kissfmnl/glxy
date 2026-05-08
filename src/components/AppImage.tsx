import Image, { type ImageProps } from "next/image";

const DEFAULT = 800;

/**
 * Wraps `next/image` with sensible default dimensions for thumbnails.
 * Repo uses `images.unoptimized` in `next.config.mjs` so remote CDNs and API image URLs work without hostname allowlists.
 */
export default function AppImage(props: ImageProps) {
  if ("fill" in props && props.fill) {
    const { alt = "", ...rest } = props;
    return <Image {...rest} fill alt={alt} />;
  }
  const { width = DEFAULT, height = DEFAULT, alt = "", ...rest } = props;
  return <Image width={width} height={height} alt={alt} {...rest} />;
}
