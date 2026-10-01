import { z } from "zod";

export const GradeEnum = z.enum(["A", "B", "C", "D"]);
export const InspectionStageEnum = z.enum(["INTAKE", "AFTER_REPAIR", "FINAL_LISTING"]);
export const PanelConditionEnum = z.enum(["ORIGINAL", "REPAINTED", "DENTED_SCRATCHED", "REPLACED"]);
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
]);

export const inspectionPanelItemSchema = z.object({
  panelType: InspectionPanelTypeEnum,
  paintThickness: z.coerce.number().int().nonnegative().optional().nullable(),
  pointRight: z.coerce.number().int().nonnegative().optional().nullable(),
  pointCenter: z.coerce.number().int().nonnegative().optional().nullable(),
  pointLeft: z.coerce.number().int().nonnegative().optional().nullable(),
  pointExtra: z.coerce.number().int().nonnegative().optional().nullable(),
  condition: PanelConditionEnum.default("ORIGINAL"),
  notes: z.string().optional().nullable(),
});

export const createInspectionSchema = z.object({
  vehicleId: z.string().uuid("ID kendaraan tidak valid"),
  stage: InspectionStageEnum.default("INTAKE"),
  engineGrade: GradeEnum.default("B"),
  interiorGrade: GradeEnum.default("B"),
  exteriorGrade: GradeEnum.default("B"),
  frameGrade: GradeEnum.default("A"),
  accidentHistory: z.boolean().default(false),
  floodHistory: z.boolean().default(false),
  engineNotes: z.string().optional().nullable(),
  interiorNotes: z.string().optional().nullable(),
  exteriorNotes: z.string().optional().nullable(),
  inspectedBy: z.string().min(2, "Nama pemeriksa / inspektur wajib diisi"),
  panels: z.array(inspectionPanelItemSchema).min(11, "Seluruh 11 panel wajib diperiksa"),
});

export type CreateInspectionInput = z.input<typeof createInspectionSchema>;
