import { CancelImportButton } from "@/components/import/cancel-import-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HISTORY_LIMIT, listImportBatches } from "@/lib/import-service";

const dateTime = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });
const day = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

export async function ImportHistory() {
  const batches = await listImportBatches();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique des imports</CardTitle>
        <CardDescription>Les {HISTORY_LIMIT} derniers imports, du plus récent au plus ancien.</CardDescription>
      </CardHeader>
      <CardContent>
        {batches.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun import pour le moment.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fichier</TableHead>
                <TableHead>Importé le</TableHead>
                <TableHead>Session</TableHead>
                <TableHead className="text-right">Challenges</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell className="font-medium">{batch.fileName}</TableCell>
                  <TableCell>{dateTime.format(batch.importedAt)}</TableCell>
                  <TableCell>{batch.playedAt ? day.format(batch.playedAt) : "—"}</TableCell>
                  <TableCell className="text-right">{batch.challengeCount}</TableCell>
                  <TableCell className="text-right">
                    <CancelImportButton id={batch.id} fileName={batch.fileName} challengeCount={batch.challengeCount} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
