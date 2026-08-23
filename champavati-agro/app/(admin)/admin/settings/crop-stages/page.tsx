import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EditStageDialog } from "@/components/settings/edit-stage-dialog";

export const metadata: Metadata = { title: "Crop Stage Settings — Champavati Agro" };

export default async function CropStageSettingsPage() {
  const cropMasters = await prisma.cropMaster.findMany({
    orderBy: { name: "asc" },
    include: { stages: { orderBy: [{ plantingType: "asc" }, { sequence: "asc" }] } },
  });

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold">Crop stage configuration</h1>
        <p className="text-sm text-muted-foreground">
          Adjust each stage&apos;s timing and monitoring guidance. Every change is re-validated for
          consistency before saving, and only applies to crop cycles created afterward — existing
          farmer timelines are never altered.
        </p>
      </div>

      <div className="space-y-6">
        {cropMasters.map((crop) => {
          const groups = new Map<string, typeof crop.stages>();
          for (const stage of crop.stages) {
            const key = stage.plantingType ?? "none";
            groups.set(key, [...(groups.get(key) ?? []), stage]);
          }

          return (
            <Card key={crop.id}>
              <CardHeader>
                <CardTitle>
                  {crop.name} <span className="font-normal text-muted-foreground">({crop.localName})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {[...groups.entries()].map(([plantingType, stages]) => (
                  <div key={plantingType}>
                    {plantingType !== "none" && (
                      <Badge variant="outline" className="mb-2">
                        {plantingType.replaceAll("_", " ")}
                      </Badge>
                    )}
                    <div className="overflow-hidden rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>Stage</TableHead>
                            <TableHead>Start (days)</TableHead>
                            <TableHead>End (days)</TableHead>
                            <TableHead>Flags</TableHead>
                            <TableHead>Confidence</TableHead>
                            <TableHead />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stages.map((stage) => (
                            <TableRow key={stage.id}>
                              <TableCell>{stage.sequence}</TableCell>
                              <TableCell className="font-medium">
                                {stage.name}
                                <span className="ml-1.5 text-xs text-muted-foreground">{stage.localName}</span>
                              </TableCell>
                              <TableCell>{stage.defaultStartOffsetDays}</TableCell>
                              <TableCell>{stage.defaultEndOffsetDays}</TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  {stage.criticalStage && <Badge variant="warning">Critical</Badge>}
                                  {stage.waterSensitive && <Badge variant="info">Water</Badge>}
                                  {stage.weatherSensitive && <Badge variant="info">Weather</Badge>}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="muted">{stage.confidenceLevel}</Badge>
                              </TableCell>
                              <TableCell>
                                <EditStageDialog
                                  stage={{
                                    id: stage.id,
                                    name: stage.name,
                                    localName: stage.localName,
                                    sequence: stage.sequence,
                                    minStartOffsetDays: stage.minStartOffsetDays,
                                    defaultStartOffsetDays: stage.defaultStartOffsetDays,
                                    maxStartOffsetDays: stage.maxStartOffsetDays,
                                    minEndOffsetDays: stage.minEndOffsetDays,
                                    defaultEndOffsetDays: stage.defaultEndOffsetDays,
                                    maxEndOffsetDays: stage.maxEndOffsetDays,
                                    criticalStage: stage.criticalStage,
                                    waterSensitive: stage.waterSensitive,
                                    weatherSensitive: stage.weatherSensitive,
                                    monitoringActions: stage.monitoringActions,
                                    commonPests: stage.commonPests,
                                    commonDiseases: stage.commonDiseases,
                                    sourceReference: stage.sourceReference,
                                    confidenceLevel: stage.confidenceLevel,
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
