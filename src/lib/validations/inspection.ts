import { z } from "zod";

export const GradeEnum = z.enum(["A", "B", "C", "D", "E"]);
export const InspectionStageEnum = z.enum(["INTAKE", "AFTER_REPAIR", "FINAL_LISTING"]);
export const PanelConditionEnum = z.enum([
  "ORIGINAL",
  "REPAINTED",
  "DENTED_SCRATCHED",
  "REPLACED",
  "PLASTIC_NORMAL",
  "PLASTIC_DAMAGED",
]);
export const InspectionPanelTypeEnum = z.enum([
  "HOOD",
  "ROOF",
  "FENDER_FRONT_RIGHT",
  "FENDER_FRONT_LEFT",
  "FRONT_DOOR_RIGHT",
  "FRONT_DOOR_LEFT",
  "REAR_DOOR_RIGHT",
  "REAR_DOOR_LEFT",
  "TRUNK_LID",
  "QUARTER_PANEL_RIGHT",
  "QUARTER_PANEL_LEFT",
  "ROCKER_PANEL_RIGHT",
  "ROCKER_PANEL_LEFT",
  "BUMPER_FRONT",
  "BUMPER_REAR",
]);

export const inspectionPanelItemSchema = z.object({
  panelType: InspectionPanelTypeEnum,
  paintThickness: z.coerce.number().int().nonnegative().optional().nullable(),
  pointRight: z.coerce.number().int().nonnegative().optional().nullable(),
  pointCenter: z.coerce.number().int().nonnegative().optional().nullable(),
  pointLeft: z.coerce.number().int().nonnegative().optional().nullable(),
  pointExtra: z.coerce.number().int().nonnegative().optional().nullable(),
  condition: PanelConditionEnum.default("ORIGINAL"),
  defectCode: z.string().optional().nullable(),
  damageLevel: z.coerce.number().int().optional().nullable(),
  isMetal: z.boolean().default(true),
  notes: z.string().optional().nullable(),
});

export const createInspectionSchema = z.object({
  vehicleId: z.string().uuid("ID kendaraan tidak valid"),
  stage: InspectionStageEnum.default("INTAKE"),
  totalGrade: GradeEnum.optional().nullable(),
  engineGrade: GradeEnum.default("B"),
  interiorGrade: GradeEnum.default("B"),
  exteriorGrade: GradeEnum.default("B"),
  frameGrade: GradeEnum.default("A"),
  accidentHistory: z.boolean().default(false),
  floodHistory: z.boolean().default(false),
  hasServiceBook: z.boolean().default(true),
  hasSpareKey: z.boolean().default(true),
  milAirbagOk: z.boolean().default(true),
  engineNotes: z.string().optional().nullable(),
  interiorNotes: z.string().optional().nullable(),
  exteriorNotes: z.string().optional().nullable(),
  frameNotes: z.string().optional().nullable(),
  checklistData: z.any().optional().nullable(),
  inspectedBy: z.string().min(2, "Nama pemeriksa / inspektur wajib diisi"),
  panels: z.array(inspectionPanelItemSchema).min(11, "Seluruh panel bodi wajib diinspeksi"),
});

export type CreateInspectionInput = z.input<typeof createInspectionSchema>;
