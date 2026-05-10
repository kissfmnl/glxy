import type { Area } from "react-easy-crop";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const i = new Image();
    i.addEventListener("load", () => resolve(i));
    i.addEventListener("error", (e) => reject(e));
    i.crossOrigin = "anonymous";
    i.src = src;
  });
}

/** Snijdt `imageSrc` (object URL of http) naar het rechthoek `pixelCrop` (van react-easy-crop `onCropComplete`). */
export async function cropImageToBlob(imageSrc: string, pixelCrop: Area, mime: string = "image/jpeg"): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas niet beschikbaar.");

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);

  const quality = mime === "image/png" ? undefined : 0.92;
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("toBlob mislukt."));
      },
      mime,
      quality,
    );
  });
}
