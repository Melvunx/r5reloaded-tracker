/** `aimtrainer_results_1792494390.txt` → date de l'export (le nombre est un timestamp Unix en secondes). */
export function getExportDate(fileName: string): Date | undefined {
  const seconds = /_(\d{9,11})\.txt$/i.exec(fileName)?.[1];
  if (!seconds) return undefined;
  const date = new Date(Number(seconds) * 1000);
  return Number.isNaN(date.getTime()) ? undefined : date;
}
