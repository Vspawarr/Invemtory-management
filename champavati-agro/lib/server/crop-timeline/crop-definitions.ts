import type { AnchorType, ConfidenceLevel, PlantingType } from "@prisma/client";

/**
 * Single source of truth for the five supported crops' timeline configuration.
 * This is the "researched data as configuration" module: prisma/seed/*.ts
 * upserts it into CropMaster/CropStageMaster/CropPlantingWindow, and tests
 * import it directly so fixtures never drift from what's actually seeded.
 *
 * Day offsets are indicative published ranges for Maharashtra growing
 * conditions, not exact agronomic predictions — always admin-adjustable,
 * always shown with a source reference and confidence level. This module
 * never contains a dosage or a product recommendation; monitoring text is
 * advisory only ("Monitor for X"), never a prescription.
 */

export interface StageDefinition {
  sequence: number;
  name: string;
  localName: string;
  minStartOffsetDays: number;
  defaultStartOffsetDays: number;
  maxStartOffsetDays: number;
  minEndOffsetDays: number;
  defaultEndOffsetDays: number;
  maxEndOffsetDays: number;
  criticalStage: boolean;
  waterSensitive: boolean;
  weatherSensitive: boolean;
  monitoringActions: string | null;
  commonPests: string[];
  commonDiseases: string[];
  sourceReference: string;
  confidenceLevel: ConfidenceLevel;
}

export interface PlantingWindowDefinition {
  plantingType: PlantingType;
  startMonth: number;
  endMonth: number;
  label: string;
}

export interface CropDefinition {
  name: string;
  localName: string;
  anchorType: AnchorType;
  anchorLabel: string;
  /** Stage lists keyed by planting type; `null` key = applies to every cycle. */
  stagesByPlantingType: Record<string, StageDefinition[]>;
  plantingWindows?: PlantingWindowDefinition[];
}

const SOURCE = "Indicative general agronomic timing for Maharashtra — admin-adjustable";

let seq = 0;
function resetSequence() {
  seq = 0;
}
function s(
  name: string,
  localName: string,
  startDefault: number,
  endDefault: number,
  opts: {
    critical?: boolean;
    water?: boolean;
    weather?: boolean;
    monitoring?: string;
    pests?: string[];
    diseases?: string[];
    confidence?: ConfidenceLevel;
  } = {},
  variance = 6
): StageDefinition {
  seq += 1;
  return {
    sequence: seq,
    name,
    localName,
    minStartOffsetDays: startDefault - variance,
    defaultStartOffsetDays: startDefault,
    maxStartOffsetDays: startDefault + variance,
    minEndOffsetDays: endDefault - variance,
    defaultEndOffsetDays: endDefault,
    maxEndOffsetDays: endDefault + variance,
    criticalStage: opts.critical ?? false,
    waterSensitive: opts.water ?? false,
    weatherSensitive: opts.weather ?? false,
    monitoringActions: opts.monitoring ?? null,
    commonPests: opts.pests ?? [],
    commonDiseases: opts.diseases ?? [],
    sourceReference: SOURCE,
    confidenceLevel: opts.confidence ?? "MEDIUM",
  };
}

// ---------------------------------------------------------------------------
// Cotton — SOWING anchor
// ---------------------------------------------------------------------------
resetSequence();
const COTTON: StageDefinition[] = [
  s("Land Preparation", "जमीन तयारी", -20, -1, { weather: true, monitoring: "Ensure field leveling and soil moisture before sowing." }, 10),
  s("Sowing", "पेरणी", 0, 0, { critical: true, weather: true, monitoring: "Confirm seed treatment done before sowing." }, 0),
  s("Emergence", "उगवण", 5, 12, { critical: true, water: true, pests: ["Cutworm"], monitoring: "Check germination count; gap-fill if needed." }, 4),
  s("Vegetative Growth", "वाढीची अवस्था", 13, 45, { water: true, pests: ["Aphid", "Jassid", "Whitefly"], diseases: ["Damping off"], monitoring: "Monitor sap-sucking pests weekly." }, 8),
  s("Square Formation", "पाते लागणे", 46, 65, { critical: true, water: true, pests: ["Pink bollworm", "Thrips"], monitoring: "Begin pheromone trap monitoring for pink bollworm." }, 6),
  s("Flowering", "फुलोरा", 66, 95, { critical: true, water: true, weather: true, pests: ["Bollworm complex"], monitoring: "Peak water demand stage — avoid moisture stress." }, 8),
  s("Boll Development", "बोंड विकास", 96, 130, { critical: true, water: true, pests: ["Pink bollworm", "Bollworm"], diseases: ["Boll rot"], monitoring: "Scout for boll damage; monitor pink bollworm traps." }, 10),
  s("Boll Maturity", "बोंड परिपक्वता", 131, 155, { weather: true, monitoring: "Reduce irrigation as bolls mature." }, 8),
  s("Harvest/Pickings", "वेचणी", 156, 200, { monitoring: "Pick in 2-3 rounds as bolls open." }, 15),
];

// ---------------------------------------------------------------------------
// Maize — SOWING anchor
// ---------------------------------------------------------------------------
resetSequence();
const MAIZE: StageDefinition[] = [
  s("Land Preparation", "जमीन तयारी", -15, -1, { weather: true, monitoring: "Prepare fine tilth for uniform germination." }, 8),
  s("Sowing", "पेरणी", 0, 0, { critical: true }, 0),
  s("Emergence", "उगवण", 5, 8, { critical: true, water: true, pests: ["Fall armyworm"], monitoring: "Scout early for fall armyworm from emergence." }, 3),
  s("Vegetative/Knee Height", "गुडघा उंची अवस्था", 9, 35, { water: true, pests: ["Fall armyworm", "Stem borer"], monitoring: "Continue armyworm scouting through whorl stage." }, 6),
  s("Tasseling/Silking", "तुरा/रेशीम अवस्था", 36, 55, { critical: true, water: true, weather: true, monitoring: "Critical water-sensitive stage — avoid stress during silking." }, 5),
  s("Grain Filling", "दाणे भरणे", 56, 85, { water: true, pests: ["Pink borer"], diseases: ["Stalk rot"] }, 8),
  s("Maturity", "परिपक्वता", 86, 100, { weather: true, monitoring: "Reduce irrigation; check grain moisture." }, 8),
  s("Harvest", "काढणी", 101, 115, {}, 10),
];

// ---------------------------------------------------------------------------
// Ginger — PLANTING anchor
// ---------------------------------------------------------------------------
resetSequence();
const GINGER: StageDefinition[] = [
  s("Land Preparation", "जमीन तयारी", -25, -10, { weather: true, monitoring: "Prepare raised beds with good drainage." }, 10),
  s("Seed Rhizome Treatment", "बियाणे आले प्रक्रिया", -9, -3, { critical: true, diseases: ["Rhizome rot"], monitoring: "Treat seed rhizomes to prevent rhizome rot before planting." }, 3),
  s("Planting", "लागवड", 0, 0, { critical: true }, 0),
  s("Sprouting/Emergence", "अंकुरण", 15, 30, { water: true, monitoring: "Maintain consistent soil moisture for sprouting." }, 8),
  s("Vegetative Growth", "वाढीची अवस्था", 31, 120, { water: true, pests: ["Shoot borer"], diseases: ["Leaf spot"] }, 15),
  s("Earthing Up", "भर देणे", 121, 150, { critical: true, monitoring: "Earth up to support rhizome development and drainage." }, 10),
  s("Rhizome Bulking", "आले पोसणे", 151, 210, { critical: true, water: true, diseases: ["Rhizome rot", "Bacterial wilt"], monitoring: "Watch for rhizome rot in waterlogged patches." }, 15),
  s("Maturity", "परिपक्वता", 211, 240, { weather: true, monitoring: "Reduce irrigation as leaves yellow and dry." }, 12),
  s("Harvest", "काढणी", 241, 270, {}, 15),
];

// ---------------------------------------------------------------------------
// Sugarcane — PLANTING anchor ("Sett Planting Date"), three planting types
// ---------------------------------------------------------------------------
function sugarcaneStages(cycle: {
  germ: [number, number];
  tiller: [number, number];
  grand: [number, number];
  earlyMat: [number, number];
  mat: [number, number];
  harvest: [number, number];
  grandVariance: number;
}): StageDefinition[] {
  resetSequence();
  return [
    s("Land Preparation", "जमीन तयारी", -20, -1, {}, 10),
    s("Sett Planting", "बेणे लागवड", 0, 0, { critical: true, diseases: ["Sett rot"] }, 0),
    s("Germination", "उगवण", cycle.germ[0], cycle.germ[1], { critical: true, water: true, monitoring: "Ensure adequate moisture for uniform germination." }, 6),
    s("Tillering", "फुटवा फुटणे", cycle.tiller[0], cycle.tiller[1], { water: true, pests: ["Early shoot borer"] }, 10),
    s("Grand Growth", "जोमदार वाढ", cycle.grand[0], cycle.grand[1], { critical: true, water: true, weather: true, pests: ["Internode borer", "Top borer"], monitoring: "Peak water and nutrient demand phase." }, cycle.grandVariance),
    s("Early Maturity", "प्रारंभिक परिपक्वता", cycle.earlyMat[0], cycle.earlyMat[1], { weather: true }, 12),
    s("Maturity", "परिपक्वता", cycle.mat[0], cycle.mat[1], { monitoring: "Check sugar recovery (brix) before harvest." }, 10),
    s("Harvest", "तोडणी", cycle.harvest[0], cycle.harvest[1], {}, 10),
  ];
}

const SUGARCANE_SURU = sugarcaneStages({
  germ: [10, 30],
  tiller: [31, 90],
  grand: [91, 270],
  earlyMat: [271, 330],
  mat: [331, 355],
  harvest: [356, 365],
  grandVariance: 20,
});

const SUGARCANE_PRE_SEASONAL = sugarcaneStages({
  germ: [12, 35],
  tiller: [36, 100],
  grand: [101, 320],
  earlyMat: [321, 390],
  mat: [391, 415],
  harvest: [416, 435],
  grandVariance: 20,
});

const SUGARCANE_ADSALI = sugarcaneStages({
  germ: [12, 35],
  tiller: [36, 110],
  grand: [111, 420],
  earlyMat: [421, 500],
  mat: [501, 535],
  harvest: [536, 560],
  grandVariance: 25,
});

// ---------------------------------------------------------------------------
// Onion — TRANSPLANTING anchor, three planting types
// ---------------------------------------------------------------------------
function onionStages(cycle: {
  nursery: [number, number];
  seedling: [number, number];
  veg: [number, number];
  bulbInit: [number, number];
  bulbEnlarge: [number, number];
  neckFall: [number, number];
  harvest: [number, number];
  curing: [number, number];
  curingNote?: string;
}): StageDefinition[] {
  resetSequence();
  return [
    s("Nursery Preparation", "रोपवाटिका तयारी", cycle.nursery[0], cycle.nursery[1], {}, 5),
    s("Seedling Development", "रोपांची वाढ", cycle.seedling[0], cycle.seedling[1], { water: true, monitoring: "Raise seedlings to 15-20cm height before transplanting." }, 5),
    s("Transplanting", "पुनर्लागवड", 0, 0, { critical: true }, 0),
    s("Vegetative Growth", "वाढीची अवस्था", cycle.veg[0], cycle.veg[1], { water: true, pests: ["Thrips"], monitoring: "Monitor thrips closely." }, 6),
    s("Bulb Initiation", "कांदा पोसणे सुरुवात", cycle.bulbInit[0], cycle.bulbInit[1], { critical: true, water: true, monitoring: "Day-length sensitive stage." }, 6),
    s("Bulb Enlargement", "कांदा वाढणे", cycle.bulbEnlarge[0], cycle.bulbEnlarge[1], { critical: true, water: true, diseases: ["Purple blotch", "Stemphylium blight"], monitoring: "High humidity increases foliar disease risk." }, 8),
    s("Neck Fall/Maturity", "मान पडणे/परिपक्वता", cycle.neckFall[0], cycle.neckFall[1], { weather: true }, 6),
    s("Harvest", "काढणी", cycle.harvest[0], cycle.harvest[1], {}, 6),
    s("Curing/Storage", "वाळवणी/साठवण", cycle.curing[0], cycle.curing[1], { monitoring: cycle.curingNote }, 8),
  ];
}

const ONION_KHARIF = onionStages({
  nursery: [-42, -35],
  seedling: [-34, -1],
  veg: [1, 35],
  bulbInit: [36, 55],
  bulbEnlarge: [56, 80],
  neckFall: [81, 95],
  harvest: [96, 105],
  curing: [106, 120],
  curingNote: "Kharif onion has shorter storage life — plan quicker disposal.",
});

const ONION_LATE_KHARIF = onionStages({
  nursery: [-40, -32],
  seedling: [-31, -1],
  veg: [1, 40],
  bulbInit: [41, 62],
  bulbEnlarge: [63, 90],
  neckFall: [91, 108],
  harvest: [109, 120],
  curing: [121, 140],
});

const ONION_RABI = onionStages({
  nursery: [-45, -36],
  seedling: [-35, -1],
  veg: [1, 45],
  bulbInit: [46, 70],
  bulbEnlarge: [71, 105],
  neckFall: [106, 125],
  harvest: [126, 140],
  curing: [141, 160],
  curingNote: "Rabi onion cures well for long-term storage.",
});

// ---------------------------------------------------------------------------
// Crop registry
// ---------------------------------------------------------------------------

export const CROP_DEFINITIONS: CropDefinition[] = [
  {
    name: "Cotton",
    localName: "कापूस",
    anchorType: "SOWING",
    anchorLabel: "Sowing Date",
    stagesByPlantingType: { none: COTTON },
  },
  {
    name: "Maize",
    localName: "मका",
    anchorType: "SOWING",
    anchorLabel: "Sowing Date",
    stagesByPlantingType: { none: MAIZE },
  },
  {
    name: "Ginger",
    localName: "आले",
    anchorType: "PLANTING",
    anchorLabel: "Planting Date",
    stagesByPlantingType: { none: GINGER },
  },
  {
    name: "Sugarcane",
    localName: "ऊस",
    anchorType: "PLANTING",
    anchorLabel: "Sett Planting Date",
    stagesByPlantingType: {
      SURU: SUGARCANE_SURU,
      PRE_SEASONAL: SUGARCANE_PRE_SEASONAL,
      ADSALI: SUGARCANE_ADSALI,
    },
    plantingWindows: [
      { plantingType: "SURU", startMonth: 1, endMonth: 2, label: "Jan–Feb" },
      { plantingType: "PRE_SEASONAL", startMonth: 10, endMonth: 11, label: "Oct–Nov" },
      { plantingType: "ADSALI", startMonth: 7, endMonth: 8, label: "Jul–Aug" },
    ],
  },
  {
    name: "Onion",
    localName: "कांदा",
    anchorType: "TRANSPLANTING",
    anchorLabel: "Transplanting Date",
    stagesByPlantingType: {
      KHARIF: ONION_KHARIF,
      LATE_KHARIF: ONION_LATE_KHARIF,
      RABI: ONION_RABI,
    },
    plantingWindows: [
      { plantingType: "KHARIF", startMonth: 6, endMonth: 7, label: "Jun–Jul" },
      { plantingType: "LATE_KHARIF", startMonth: 9, endMonth: 11, label: "Sep–Nov" },
      { plantingType: "RABI", startMonth: 9, endMonth: 11, label: "Sep–Nov (Rabi)" },
    ],
  },
];

export function getCropDefinition(name: string): CropDefinition | undefined {
  return CROP_DEFINITIONS.find((c) => c.name === name);
}

/** Adapts a plain StageDefinition list into the StageConfig shape the timeline
 * engine consumes (id + plantingType attached), for tests and non-DB use. */
export function toStageConfigs(
  defs: StageDefinition[],
  plantingType: PlantingType | null,
  idPrefix: string
): import("./types").StageConfig[] {
  return defs.map((d) => ({
    id: `${idPrefix}-${d.sequence}`,
    name: d.name,
    localName: d.localName,
    plantingType,
    sequence: d.sequence,
    minStartOffsetDays: d.minStartOffsetDays,
    defaultStartOffsetDays: d.defaultStartOffsetDays,
    maxStartOffsetDays: d.maxStartOffsetDays,
    minEndOffsetDays: d.minEndOffsetDays,
    defaultEndOffsetDays: d.defaultEndOffsetDays,
    maxEndOffsetDays: d.maxEndOffsetDays,
    criticalStage: d.criticalStage,
    waterSensitive: d.waterSensitive,
    weatherSensitive: d.weatherSensitive,
    monitoringActions: d.monitoringActions,
    commonPests: d.commonPests,
    commonDiseases: d.commonDiseases,
    sourceReference: d.sourceReference,
    confidenceLevel: d.confidenceLevel,
  }));
}
