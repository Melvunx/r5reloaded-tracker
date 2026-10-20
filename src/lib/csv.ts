export type CsvRecord = {
  /** Numéro (à partir de 1) de la ligne du fichier où commence l'enregistrement. */
  line: number;
  cells: string[];
};

/**
 * Parser CSV minimal (RFC 4180) : champs entre guillemets, `""` pour un guillemet, virgules et retours
 * à la ligne dans un champ, fins de ligne `\n` ou `\r\n`. Les lignes vides sont ignorées, mais les numéros
 * de ligne restent ceux du fichier. Les cellules ne sont pas nettoyées (pas de trim).
 */
export function parseCsv(text: string): CsvRecord[] {
  const records: CsvRecord[] = [];
  let cells: string[] = [];
  let cell = "";
  let inQuotes = false;
  let line = 1;
  let recordLine = 1;

  const endRecord = () => {
    cells.push(cell);
    // Une ligne vide donne une seule cellule vide : on l'ignore
    if (cells.length > 1 || cells[0] !== "")
      records.push({ line: recordLine, cells });
    cells = [];
    cell = "";
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        if (char === "\n") line++;
        cell += char;
      }
      continue;
    }

    if (char === '"' && cell.trim() === "") {
      // Guillemet ouvrant (éventuellement après des espaces, comme dans `a, "b"`)
      inQuotes = true;
      cell = "";
    } else if (char === ",") {
      cells.push(cell);
      cell = "";
    } else if (char === "\r" && text[i + 1] === "\n") {
      // le \n suivant termine la ligne
    } else if (char === "\n") {
      endRecord();
      line++;
      recordLine = line;
    } else {
      cell += char;
    }
  }

  // Dernière ligne sans fin de ligne
  endRecord();
  return records;
}
