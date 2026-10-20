import { describe, expect, it } from "vitest";
import { sha256Hex } from "./hash";

describe("sha256Hex", () => {
  it("calcule le SHA-256 en hexadécimal", () => {
    const bytes = new TextEncoder().encode("abc");
    expect(sha256Hex(bytes)).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(sha256Hex(bytes.buffer as ArrayBuffer)).toBe(sha256Hex(bytes));
  });

  it("distingue deux contenus qui ne diffèrent que par la fin de ligne", () => {
    const lf = new TextEncoder().encode("a\n");
    const crlf = new TextEncoder().encode("a\r\n");
    expect(sha256Hex(lf)).not.toBe(sha256Hex(crlf));
  });
});
