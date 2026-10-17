import { describe, expect, it } from "vitest";
import { ChallengeSchema, ManualChallengeSchema } from "./challenge";

const valid = {
  challengeName: "STRAFING DUMMY",
  weapon: "R-99",
  shotsHit: "87",
  totalShots: "200",
  criticalShots: "22",
  kills: "3",
  damage: "1305",
  accuracy: "43.5%",
  roundtime: "60",
};

function errorsOf(input: unknown) {
  const result = ChallengeSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe("ChallengeSchema", () => {
  it("convertit les chaînes du CSV et résout l'arme", () => {
    expect(ChallengeSchema.parse(valid)).toEqual({
      challengeName: "STRAFING DUMMY",
      weaponId: "r99",
      shotsHit: 87,
      totalShots: 200,
      criticalShots: 22,
      kills: 3,
      damage: 1305,
      accuracy: 43.5,
      roundtime: 60,
    });
  });

  it.each(["43.5", 43.5, "43,5", "43.5 %", " 43.5% "])("accepte la précision %j", (accuracy) => {
    expect(ChallengeSchema.parse({ ...valid, accuracy }).accuracy).toBe(43.5);
  });

  it("recalcule la précision depuis les tirs (écart toléré 0,5)", () => {
    expect(ChallengeSchema.parse({ ...valid, accuracy: "43.9" }).accuracy).toBe(43.5);
  });

  it("rejette une précision incohérente avec les tirs", () => {
    expect(errorsOf({ ...valid, accuracy: "50%" })).toEqual([
      expect.stringContaining("La précision (50 %) ne correspond pas à 87/200"),
    ]);
  });

  it("accepte 0 tir total avec une précision de 0", () => {
    const data = ChallengeSchema.parse({ ...valid, shotsHit: 0, totalShots: 0, criticalShots: 0, accuracy: "0" });
    expect(data.accuracy).toBe(0);
  });

  it("rejette shotsHit > totalShots", () => {
    expect(errorsOf({ ...valid, shotsHit: "250", accuracy: "100" })).toContain(
      "Les tirs touchés ne peuvent pas dépasser les tirs totaux",
    );
  });

  it("rejette criticalShots > shotsHit", () => {
    expect(errorsOf({ ...valid, criticalShots: "90" })).toContain(
      "Les tirs critiques ne peuvent pas dépasser les tirs touchés",
    );
  });

  it("rejette une arme inconnue avec un message explicite", () => {
    expect(errorsOf({ ...valid, weapon: "Bocek" })).toEqual(["Arme inconnue : « Bocek »"]);
  });

  it.each([
    ["shotsHit", "-1", "Tirs touchés : ne peut pas être négatif"],
    ["kills", "1.5", "Kills : doit être un entier"],
    ["damage", "abc", "Dégâts : doit être un nombre"],
    ["roundtime", "0", "Durée : doit être supérieur à 0"],
  ])("rejette %s = %j", (field, value, message) => {
    expect(errorsOf({ ...valid, [field]: value })).toContain(message);
  });

  it("traite une valeur vide comme manquante, pas comme 0", () => {
    expect(errorsOf({ ...valid, kills: "" })).toEqual(["Kills : doit être un nombre"]);
    expect(errorsOf({ ...valid, accuracy: "  %" })).toEqual([
      "La précision doit être un nombre (ex. 45.2 ou 45.2%)",
    ]);
  });

  it("rejette un nom de challenge vide", () => {
    expect(errorsOf({ ...valid, challengeName: "   " })).toEqual(["Le nom du challenge est requis"]);
  });
});

describe("ManualChallengeSchema", () => {
  it("ajoute la date de la session", () => {
    const data = ManualChallengeSchema.parse({ ...valid, playedAt: "2026-01-15" });
    expect(data.playedAt).toEqual(new Date("2026-01-15"));
    expect(data.weaponId).toBe("r99");
  });

  it("rejette une date invalide ou future", () => {
    const issues = (playedAt: string) => {
      const result = ManualChallengeSchema.safeParse({ ...valid, playedAt });
      return result.success ? [] : result.error.issues.map((issue) => issue.message);
    };
    expect(issues("pas une date")).toEqual(["La date de la session est invalide"]);
    expect(issues("2999-01-01")).toEqual(["La date de la session ne peut pas être dans le futur"]);
  });
});
