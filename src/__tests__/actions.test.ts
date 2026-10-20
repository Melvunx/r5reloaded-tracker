import { beforeEach, describe, expect, it, vi } from "vitest";

// Les actions sont testées sans base : on vérifie ce qu'elles valident avant d'appeler les services, et comment elles
// réagissent quand un service échoue.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/env", () => ({ env: { DATABASE_URL: "postgresql://test", VERIF_LINE: "=== Aim Trainer ===" } }));
vi.mock("@/lib/challenge-service", () => ({
  createManualChallenge: vi.fn(),
  deleteManualChallenge: vi.fn(),
}));
vi.mock("@/lib/sensitivity-service", () => ({
  createSensitivity: vi.fn(),
  deleteSensitivity: vi.fn(),
}));
vi.mock("@/lib/import-service", () => ({
  findBatchByHash: vi.fn(),
  createImportBatch: vi.fn(),
  removeImportBatch: vi.fn(),
}));

import { revalidatePath } from "next/cache";
import { addManualChallenge, removeManualChallenge } from "@app/actions/challenge";
import { confirmImport, deleteImportBatch, previewImport } from "@app/actions/import";
import { removeSensitivity, saveSensitivity } from "@app/actions/mouse-settings";
import { createManualChallenge, deleteManualChallenge } from "@/lib/challenge-service";
import { createImportBatch, findBatchByHash, removeImportBatch } from "@/lib/import-service";
import { createSensitivity, deleteSensitivity } from "@/lib/sensitivity-service";

const GARBAGE: unknown[] = [undefined, null, 0, 42, "texte", "", [], [1, 2], {}, { id: 1 }, { id: {} }, () => 1, Symbol("x"), new Date()];

const validChallenge = {
  challengeName: "STRAFING DUMMY",
  weapon: "Volt",
  shotsHit: "50",
  totalShots: "100",
  criticalShots: "5",
  kills: "3",
  damage: "900",
  roundtime: "60",
  accuracy: "50",
  playedAt: "2020-01-01",
};

const SIGNATURE = "=== Aim Trainer ===";
const HEADER = "ChallengeName, ShotsHit, Kills, Weapon, Accuracy, Damage, CriticalShots, TotalShots, Roundtime";
const exportFile = (name = "aimtrainer_results_1792494390.txt", lines = ["STRAFING DUMMY, 50, 3, Volt, 50%, 900, 5, 100, 60"]) =>
  new File([[SIGNATURE, "", HEADER, ...lines].join("\r\n")], name, { type: "text/plain" });

const formWith = (file: File | string | null, playedAt?: string) => {
  const form = new FormData();
  if (file !== null) form.set("file", file);
  if (playedAt !== undefined) form.set("playedAt", playedAt);
  return form;
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("entrées invalides : aucune action n'atteint la base", () => {
  const cases = [
    ["addManualChallenge", addManualChallenge, [createManualChallenge]],
    ["removeManualChallenge", removeManualChallenge, [deleteManualChallenge]],
    ["saveSensitivity", saveSensitivity, [createSensitivity]],
    ["removeSensitivity", removeSensitivity, [deleteSensitivity]],
    ["deleteImportBatch", deleteImportBatch, [removeImportBatch]],
    ["previewImport", previewImport, [findBatchByHash]],
    ["confirmImport", confirmImport, [findBatchByHash, createImportBatch]],
  ] as const;

  for (const [name, action, services] of cases) {
    it(name, async () => {
      for (const input of GARBAGE) {
        const result = await action(input);
        expect(result.success, `${name}(${String(input)})`).toBe(false);
      }
      for (const service of services) expect(service).not.toHaveBeenCalled();
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  }
});

describe("saisie manuelle", () => {
  it("enregistre une saisie valide puis rafraîchit les pages concernées", async () => {
    vi.mocked(createManualChallenge).mockResolvedValue({ id: "abc123" });
    const result = await addManualChallenge(validChallenge);
    expect(result).toEqual({ success: true, data: { id: "abc123" } });
    expect(createManualChallenge).toHaveBeenCalledWith(expect.objectContaining({ weaponId: "volt", accuracy: 50 }));
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(revalidatePath).toHaveBeenCalledWith("/manual-entry");
  });

  it("refuse une saisie incohérente avec un message en français", async () => {
    const result = await addManualChallenge({ ...validChallenge, shotsHit: "150" });
    expect(result).toMatchObject({ success: false });
    expect(result.success === false && result.error).toContain("tirs");
    expect(createManualChallenge).not.toHaveBeenCalled();
  });

  it("refuse une date dans le futur", async () => {
    const result = await addManualChallenge({ ...validChallenge, playedAt: "2999-01-01" });
    expect(result.success).toBe(false);
  });

  it("ne divulgue pas l'erreur interne quand la base échoue", async () => {
    vi.mocked(createManualChallenge).mockRejectedValue(new Error("connect ECONNREFUSED 127.0.0.1:5432 secret"));
    const result = await addManualChallenge(validChallenge);
    expect(result).toEqual({ success: false, error: "Erreur serveur pendant l'enregistrement du challenge" });
    expect(console.error).toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("signale une saisie déjà supprimée", async () => {
    vi.mocked(deleteManualChallenge).mockResolvedValue(false);
    const result = await removeManualChallenge({ id: "psz01nr0a3t3mii29tgz45rk" });
    expect(result).toEqual({ success: false, error: "Cette saisie n'existe plus" });
  });
});

describe("réglages souris", () => {
  it("applique les bornes de DPI et de sensibilité", async () => {
    for (const input of [
      { mouseDpi: "0", mouseSensitivity: "1" },
      { mouseDpi: "99999999", mouseSensitivity: "1" },
      { mouseDpi: "800", mouseSensitivity: "-1" },
      { mouseDpi: "800", mouseSensitivity: "abc" },
      { mouseDpi: "800.5", mouseSensitivity: "1" },
      { mouseDpi: "800", mouseSensitivity: "1", effectiveFrom: "2999-01-01" },
    ]) {
      expect((await saveSensitivity(input)).success, JSON.stringify(input)).toBe(false);
    }
    expect(createSensitivity).not.toHaveBeenCalled();
  });

  it("accepte la virgule décimale française", async () => {
    vi.mocked(createSensitivity).mockResolvedValue({ id: "id1" } as never);
    expect((await saveSensitivity({ mouseDpi: "800", mouseSensitivity: "1,5" })).success).toBe(true);
    expect(createSensitivity).toHaveBeenCalledWith(expect.objectContaining({ mouseDpi: 800, mouseSensitivity: 1.5 }));
  });
});

describe("import", () => {
  it("refuse un fichier qui n'est pas un .txt, vide, trop gros ou sans signature", async () => {
    const huge = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "gros.txt");
    const files = [
      new File(["x"], "script.exe"),
      new File([""], "vide.txt"),
      huge,
      new File(["n'importe quoi\r\n\r\nChallengeName"], "autre.txt"),
    ];
    for (const file of files) {
      expect((await previewImport(formWith(file))).success, file.name).toBe(false);
      expect((await confirmImport(formWith(file))).success, file.name).toBe(false);
    }
    expect(findBatchByHash).not.toHaveBeenCalled();
    expect(createImportBatch).not.toHaveBeenCalled();
  });

  it("refuse un champ « file » qui est une chaîne ou absent, et une date future", async () => {
    expect((await previewImport(formWith("pas un fichier"))).success).toBe(false);
    expect((await previewImport(formWith(null))).success).toBe(false);
    expect((await previewImport(formWith(exportFile(), "2999-01-01"))).success).toBe(false);
  });

  it("prévisualise sans rien écrire", async () => {
    vi.mocked(findBatchByHash).mockResolvedValue(null);
    const result = await previewImport(formWith(exportFile()));
    expect(result.success).toBe(true);
    expect(createImportBatch).not.toHaveBeenCalled();
  });

  it("refuse un fichier déjà importé, à l'aperçu comme à la confirmation", async () => {
    vi.mocked(findBatchByHash).mockResolvedValue({ id: "b1", fileName: "deja.txt", importedAt: new Date("2026-01-01") });
    expect((await previewImport(formWith(exportFile()))).success).toBe(false);
    expect((await confirmImport(formWith(exportFile()))).success).toBe(false);
    expect(createImportBatch).not.toHaveBeenCalled();
  });

  it("n'insère rien quand toutes les lignes sont invalides", async () => {
    vi.mocked(findBatchByHash).mockResolvedValue(null);
    const result = await confirmImport(formWith(exportFile("a.txt", ["STRAFING DUMMY, 500, 3, Volt, 50%, 900, 5, 100, 60"])));
    expect(result).toEqual({ success: false, error: "Aucune ligne valide à importer" });
    expect(createImportBatch).not.toHaveBeenCalled();
  });

  it("gère un import concurrent (la contrainte d'unicité a déjà été prise)", async () => {
    vi.mocked(findBatchByHash).mockResolvedValue(null);
    vi.mocked(createImportBatch).mockResolvedValue(null);
    const result = await confirmImport(formWith(exportFile()));
    expect(result).toEqual({ success: false, error: "Ce fichier vient d'être importé" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("insère les lignes valides et rafraîchit les pages", async () => {
    vi.mocked(findBatchByHash).mockResolvedValue(null);
    vi.mocked(createImportBatch).mockResolvedValue({ id: "batch1", inserted: 1 });
    const result = await confirmImport(formWith(exportFile(), "2020-05-05"));
    expect(result).toEqual({ success: true, data: { batchId: "batch1", inserted: 1 } });
    expect(revalidatePath).toHaveBeenCalledWith("/import");
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("ne divulgue pas l'erreur interne quand la base échoue", async () => {
    vi.mocked(findBatchByHash).mockRejectedValue(new Error("password authentication failed for user apex"));
    const result = await confirmImport(formWith(exportFile()));
    expect(result).toEqual({ success: false, error: "Erreur serveur pendant l'import" });
  });

  it("annule un import inexistant sans planter", async () => {
    vi.mocked(removeImportBatch).mockResolvedValue(null);
    const result = await deleteImportBatch({ id: "psz01nr0a3t3mii29tgz45rk" });
    expect(result).toEqual({ success: false, error: "Cet import n'existe plus" });
  });
});
