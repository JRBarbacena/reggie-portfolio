// @ts-check

function sourceParts(filename) {
  const normalized = filename.replaceAll("\\", "/");
  const slash = normalized.lastIndexOf("/");
  const directory = slash === -1 ? "" : `${normalized.slice(0, slash + 1)}`;
  const name = slash === -1 ? normalized : normalized.slice(slash + 1);
  return { directory, stem: name.replace(/\.[^.]+$/, "") };
}

export function responsivePhotoPath(filename) {
  const { directory, stem } = sourceParts(filename);
  const collection = directory || "responsive/";
  return `/images/photos/optimized-webp/${collection}${stem}.webp`;
}

export function responsivePhotoSrcSet() {
  return undefined;
}

export function responsiveCertificatePath(filename, width = 1200) {
  const { directory, stem } = sourceParts(filename);
  return `/images/certificates/optimized-webp/${directory}${stem}-${width}.webp`;
}

export function responsiveCertificateSrcSet(filename) {
  return [720, 1200].map((width) => `${responsiveCertificatePath(filename, width)} ${width}w`).join(", ");
}

export function responsivePhotoDimensions(filename) {
  if (filename === "KiroVerse.JPG" || filename === "Patawow_VB.JPG") return { width: 640, height: 480 };
  if (filename === "basketball.JPG") return { width: 640, height: 960 };
  return { width: 640, height: 853 };
}
