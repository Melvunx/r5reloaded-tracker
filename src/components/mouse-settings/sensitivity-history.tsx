import { EmptyState } from "@/components/empty-state";
import { DeleteSensitivityButton } from "@/components/mouse-settings/delete-sensitivity-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cmPer360, edpi } from "@/lib/mouse";
import type { listSensitivities } from "@/lib/sensitivity-service";

type Sensitivities = Awaited<ReturnType<typeof listSensitivities>>;

const day = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

export function SensitivityHistory({ sensitivities }: { sensitivities: Sensitivities }) {
  // Le réglage actif aujourd'hui : le plus récent dont la date d'application est passée (la liste est triée)
  const now = new Date();
  const activeId = sensitivities.find((setting) => setting.effectiveFrom <= now)?.id;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique des réglages</CardTitle>
        <CardDescription>Du plus récent au plus ancien. Le cm/360° utilise un yaw de 0,022 (Apex Legends).</CardDescription>
      </CardHeader>
      <CardContent>
        {sensitivities.length === 0 ? (
          <EmptyState title="Aucun réglage enregistré" description="Enregistre ton DPI et ta sensibilité pour suivre leur évolution." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Depuis le</TableHead>
                <TableHead className="text-right">DPI</TableHead>
                <TableHead className="text-right">Sensibilité</TableHead>
                <TableHead className="text-right">eDPI</TableHead>
                <TableHead className="text-right">cm/360°</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sensitivities.map((setting) => (
                <TableRow key={setting.id}>
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-2">
                      {day.format(setting.effectiveFrom)}
                      {setting.id === activeId && <Badge>Actuel</Badge>}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{setting.mouseDpi}</TableCell>
                  <TableCell className="text-right">{setting.mouseSensitivity}</TableCell>
                  <TableCell className="text-right">{Math.round(edpi(setting.mouseDpi, setting.mouseSensitivity))}</TableCell>
                  <TableCell className="text-right">
                    {cmPer360(setting.mouseDpi, setting.mouseSensitivity).toFixed(1)} cm
                  </TableCell>
                  <TableCell className="text-right">
                    <DeleteSensitivityButton
                      id={setting.id}
                      label={`${setting.mouseDpi} DPI × ${setting.mouseSensitivity}`}
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
