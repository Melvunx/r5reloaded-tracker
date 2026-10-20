import { DeleteChallengeButton } from "@/components/manual-entry/delete-challenge-button";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MANUAL_HISTORY_LIMIT, listManualChallenges } from "@/lib/challenge-service";

const dateTime = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });

export async function ManualEntryHistory() {
  const challenges = await listManualChallenges();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique des saisies</CardTitle>
        <CardDescription>
          Les {MANUAL_HISTORY_LIMIT} dernières saisies manuelles. Les challenges importés s&apos;annulent depuis la page
          d&apos;import.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {challenges.length === 0 ? (
          <EmptyState title="Aucune saisie manuelle" description="Les challenges que tu ajoutes avec le formulaire apparaîtront ici." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session</TableHead>
                <TableHead>Arme</TableHead>
                <TableHead>Challenge</TableHead>
                <TableHead className="text-right">Touchés / tirs</TableHead>
                <TableHead className="text-right">Précision</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {challenges.map((challenge) => (
                <TableRow key={challenge.id}>
                  <TableCell>{dateTime.format(challenge.playedAt)}</TableCell>
                  <TableCell className="font-medium">{challenge.weapon.name}</TableCell>
                  <TableCell>{challenge.challengeName}</TableCell>
                  <TableCell className="text-right">
                    {challenge.shotsHit} / {challenge.totalShots}
                  </TableCell>
                  <TableCell className="text-right">{challenge.accuracy.toFixed(2)} %</TableCell>
                  <TableCell className="text-right">
                    <DeleteChallengeButton
                      id={challenge.id}
                      description={`${challenge.weapon.name} · ${challenge.challengeName} · ${challenge.accuracy.toFixed(2)} %`}
                    />
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
