import { describe, expect, it } from "vitest";
import { ImportFormSchema, R5_HEADER_LINE, parseImportRow } from "./import";

const row = {
  ChallengeName: "STRAFING DUMMY",
  ShotsHit: "87",
  Kills: "3",
  Weapon: "R-99",
  Accuracy: "43.5%",
  Damage: "1305",
  CriticalShots: "22",
  TotalShots: "200",
  Roundtime: "60",
};

describe("parseImportRow", () => {
  it("valide une ligne et renvoie les champs typés", () => {
    expect(parseImportRow(3, row)).toMatchObject({
      success: true,
      lineNumber: 3,
      data: { weaponId: "r99", shotsHit: 87, totalShots: 200, accuracy: 43.5 },
    });
  });

  it("préfixe chaque erreur par le numéro de ligne", () => {
    const result = parseImportRow(7, { ...row, Weapon: "Bocek", Kills: "x" });
    expect(result).toEqual({
      success: false,
      lineNumber: 7,
      errors: ["Ligne 7 : Arme inconnue : « Bocek »", "Ligne 7 : Kills : doit être un nombre"],
    });
  });

  it("signale une colonne manquante", () => {
    const withoutDamage = Object.fromEntries(Object.entries(row).filter(([key]) => key !== "Damage"));
    const result = parseImportRow(4, withoutDamage);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors).toContain("Ligne 4 : La colonne Damage est manquante");
  });

  it("n'accepte pas autre chose qu'un objet", () => {
    expect(parseImportRow(2, null).success).toBe(false);
  });
});

describe("R5_HEADER_LINE", () => {
  it("correspond aux en-têtes exacts de l'export", () => {
    expect(R5_HEADER_LINE).toBe("ChallengeName,ShotsHit,Kills,Weapon,Accuracy,Damage,CriticalShots,TotalShots,Roundtime");
  });
});

describe("ImportFormSchema", () => {
  const file = (name: string, content = "x") => new File([content], name, { type: "text/plain" });

  it("prend la date de l'export (nom du fichier) quand aucune date n'est saisie", () => {
    const data = ImportFormSchema.parse({ file: file("aimtrainer_results_1792494390.txt"), playedAt: "" });
    expect(data.playedAt.toISOString()).toBe("2026-10-20T11:06:30.000Z");
  });

  it("préfère la date saisie à celle du nom du fichier", () => {
    const data = ImportFormSchema.parse({ file: file("aimtrainer_results_1792494390.txt"), playedAt: "2026-01-15" });
    expect(data.playedAt).toEqual(new Date("2026-01-15"));
  });

  it("met la date du jour si le nom du fichier n'a pas de timestamp", () => {
    const data = ImportFormSchema.parse({ file: file("export.txt"), playedAt: "" });
    expect(Math.abs(data.playedAt.getTime() - Date.now())).toBeLessThan(5_000);
  });

  it("rejette un fichier absent, vide ou qui n'est pas un .txt", () => {
    const messages = (input: unknown) => {
      const result = ImportFormSchema.safeParse(input);
      return result.success ? [] : result.error.issues.map((issue) => issue.message);
    };
    expect(messages({})).toEqual(["Aucun fichier sélectionné"]);
    expect(messages({ file: file("export.csv") })).toEqual(["Le fichier doit être un .txt"]);
    expect(messages({ file: file("export.txt", "") })).toEqual(["Le fichier est vide"]);
  });
});
