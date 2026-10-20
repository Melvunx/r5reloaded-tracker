import { WeaponImage } from "@/components/weapon-image";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getWeaponBySlug } from "@/config/apex-weapons.config";
import type { ImportAnalysis } from "@/lib/import-file";

export function ImportPreview({ analysis }: { analysis: ImportAnalysis }) {
  const { valid, invalid, duplicates } = analysis;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Badge>{valid.length} ligne(s) valide(s)</Badge>
        {invalid.length > 0 && <Badge variant="destructive">{invalid.length} invalide(s)</Badge>}
        {duplicates.length > 0 && <Badge variant="secondary">{duplicates.length} doublon(s) écarté(s)</Badge>}
      </div>

      {invalid.length > 0 && (
        <Alert variant="destructive">
          <AlertTitle>Ces lignes seront ignorées</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4">
              {invalid.flatMap((line) => line.errors).map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {duplicates.length > 0 && (
        <Alert>
          <AlertTitle>Doublons dans le fichier</AlertTitle>
          <AlertDescription>
            Les lignes {duplicates.map((line) => line.lineNumber).join(", ")} sont identiques à une ligne précédente : elles
            ne seront pas importées.
          </AlertDescription>
        </Alert>
      )}

      {valid.length > 0 && (
        <div className="max-h-96 overflow-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ligne</TableHead>
                <TableHead>Challenge</TableHead>
                <TableHead>Arme</TableHead>
                <TableHead className="text-right">Précision</TableHead>
                <TableHead className="text-right">Touchés / total</TableHead>
                <TableHead className="text-right">Kills</TableHead>
                <TableHead className="text-right">Dégâts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {valid.map(({ lineNumber, data }) => {
                const weapon = getWeaponBySlug(data.weaponId);
                return (
                  <TableRow key={lineNumber}>
                    <TableCell className="text-muted-foreground">{lineNumber}</TableCell>
                    <TableCell>{data.challengeName}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <WeaponImage weapon={{ slug: data.weaponId }} variant="badge" />
                        <span className="weapon-name">{weapon?.name ?? data.weaponId}</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{data.accuracy.toFixed(2)} %</TableCell>
                    <TableCell className="text-right">
                      {data.shotsHit} / {data.totalShots}
                    </TableCell>
                    <TableCell className="text-right">{data.kills}</TableCell>
                    <TableCell className="text-right">{data.damage}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
