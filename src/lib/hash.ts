import { createHash } from "node:crypto";

/** SHA-256 en hexadécimal, calculé sur les octets bruts du fichier (avant tout nettoyage). */
export function sha256Hex(data: ArrayBuffer | Uint8Array) {
  return createHash("sha256").update(data instanceof Uint8Array ? data : new Uint8Array(data)).digest("hex");
}
