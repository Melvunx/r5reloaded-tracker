import { describe, expect, it } from "vitest";
import { DeleteSensitivitySchema, SensitivityFormSchema } from "./mouse-settings";

function errorsOf(input: unknown) {
  const result = SensitivityFormSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe("SensitivityFormSchema", () => {
  it("convertit les chaînes du formulaire", () => {
    expect(SensitivityFormSchema.parse({ mouseDpi: "800", mouseSensitivity: "1.2", effectiveFrom: "2026-10-01" })).toEqual({
      mouseDpi: 800,
      mouseSensitivity: 1.2,
      effectiveFrom: new Date("2026-10-01"),
    });
  });

  it("accepte la virgule décimale", () => {
    expect(SensitivityFormSchema.parse({ mouseDpi: 800, mouseSensitivity: "1,25" }).mouseSensitivity).toBe(1.25);
  });

  it("met aujourd'hui quand la date est vide ou absente", () => {
    for (const effectiveFrom of ["", undefined, null]) {
      const data = SensitivityFormSchema.parse({ mouseDpi: 800, mouseSensitivity: 1, effectiveFrom });
      expect(Math.abs(data.effectiveFrom.getTime() - Date.now())).toBeLessThan(5_000);
    }
  });

  it.each([
    [{ mouseDpi: "", mouseSensitivity: "1" }, "Le DPI doit être un nombre"],
    [{ mouseDpi: "abc", mouseSensitivity: "1" }, "Le DPI doit être un nombre"],
    [{ mouseDpi: "800.5", mouseSensitivity: "1" }, "Le DPI doit être un entier"],
    [{ mouseDpi: "50", mouseSensitivity: "1" }, "Le DPI doit être d'au moins 100"],
    [{ mouseDpi: "99999", mouseSensitivity: "1" }, "Le DPI ne peut pas dépasser 32000"],
    [{ mouseDpi: "800", mouseSensitivity: "" }, "La sensibilité doit être un nombre"],
    [{ mouseDpi: "800", mouseSensitivity: "0" }, "La sensibilité doit être d'au moins 0.01"],
    [{ mouseDpi: "800", mouseSensitivity: "1", effectiveFrom: "2999-01-01" }, "La date d'application ne peut pas être dans le futur"],
    [{ mouseDpi: "800", mouseSensitivity: "1", effectiveFrom: "pas une date" }, "La date d'application est invalide"],
    [null, "Requête invalide"],
  ])("rejette %j", (input, message) => {
    expect(errorsOf(input)).toContain(message);
  });
});

describe("DeleteSensitivitySchema", () => {
  it("accepte un cuid2 et refuse le reste", () => {
    expect(DeleteSensitivitySchema.safeParse({ id: "tz4a98xxat96iws9zmbrgj3a" }).success).toBe(true);
    expect(DeleteSensitivitySchema.safeParse({ id: "123e4567-e89b-12d3-a456-426614174000" }).success).toBe(false);
    expect(DeleteSensitivitySchema.safeParse({}).success).toBe(false);
  });
});
