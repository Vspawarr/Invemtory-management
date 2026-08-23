import type { PrismaClient } from "@prisma/client";
import { addDays, subDays } from "date-fns";

import { seedCropWithTimeline } from "./crop-timeline-helper";
import { grantFarmerPortalAccess, DEMO_FARMER_PASSWORD } from "./users";

interface FarmerSeed {
  fullName: string;
  fatherOrHusbandName: string;
  phone: string;
  village: string;
  gender: string;
  landParcels: { name: string; surveyNo: string; areaAcres: number; soilType: string; waterSource: string }[];
}

const FARMERS: FarmerSeed[] = [
  {
    fullName: "Ramesh Patil",
    fatherOrHusbandName: "Baban Patil",
    phone: "9876500001",
    village: "Chapaner",
    gender: "Male",
    landParcels: [
      { name: "Gat 102", surveyNo: "102", areaAcres: 2.5, soilType: "Black cotton soil", waterSource: "Borewell" },
      { name: "Gat 145", surveyNo: "145", areaAcres: 1.5, soilType: "Black cotton soil", waterSource: "Canal" },
    ],
  },
  {
    fullName: "Sunil Jadhav",
    fatherOrHusbandName: "Tukaram Jadhav",
    phone: "9876500002",
    village: "Kannad",
    gender: "Male",
    landParcels: [{ name: "Gat 55", surveyNo: "55", areaAcres: 3, soilType: "Medium black soil", waterSource: "Borewell" }],
  },
  {
    fullName: "Vitthal Shinde",
    fatherOrHusbandName: "Namdev Shinde",
    phone: "9876500003",
    village: "Nagad",
    gender: "Male",
    landParcels: [
      { name: "Gat 210", surveyNo: "210", areaAcres: 2, soilType: "Red soil", waterSource: "Well" },
      { name: "Gat 211", surveyNo: "211", areaAcres: 1, soilType: "Red soil", waterSource: "Well" },
    ],
  },
  {
    fullName: "Ganesh Pawar",
    fatherOrHusbandName: "Dilip Pawar",
    phone: "9876500004",
    village: "Pisadevi",
    gender: "Male",
    landParcels: [{ name: "Gat 88", surveyNo: "88", areaAcres: 1.5, soilType: "Loamy soil", waterSource: "Drip irrigation" }],
  },
  {
    fullName: "Anil Deshmukh",
    fatherOrHusbandName: "Shankar Deshmukh",
    phone: "9876500005",
    village: "Chapaner",
    gender: "Male",
    landParcels: [{ name: "Gat 300", surveyNo: "300", areaAcres: 4, soilType: "Black cotton soil", waterSource: "Canal" }],
  },
  {
    fullName: "Bapu More",
    fatherOrHusbandName: "Kondiba More",
    phone: "9876500006",
    village: "Nandra",
    gender: "Male",
    landParcels: [{ name: "Gat 12", surveyNo: "12", areaAcres: 2, soilType: "Medium black soil", waterSource: "Borewell" }],
  },
  {
    fullName: "Dattu Kale",
    fatherOrHusbandName: "Popat Kale",
    phone: "9876500007",
    village: "Dahegaon",
    gender: "Male",
    landParcels: [{ name: "Gat 77", surveyNo: "77", areaAcres: 1, soilType: "Loamy soil", waterSource: "Well" }],
  },
  {
    fullName: "Prakash Wagh",
    fatherOrHusbandName: "Bhaskar Wagh",
    phone: "9876500008",
    village: "Ambhai",
    gender: "Male",
    landParcels: [{ name: "Gat 150", surveyNo: "150", areaAcres: 5, soilType: "Black cotton soil", waterSource: "Canal" }],
  },
  {
    fullName: "Suresh Gaikwad",
    fatherOrHusbandName: "Yashwant Gaikwad",
    phone: "9876500009",
    village: "Chapaner",
    gender: "Male",
    landParcels: [{ name: "Gat 45", surveyNo: "45", areaAcres: 2, soilType: "Black cotton soil", waterSource: "Borewell" }],
  },
  {
    fullName: "Baban Bhosale",
    fatherOrHusbandName: "Ramchandra Bhosale",
    phone: "9876500010",
    village: "Kannad",
    gender: "Male",
    landParcels: [{ name: "Gat 60", surveyNo: "60", areaAcres: 1.5, soilType: "Red soil", waterSource: "Well" }],
  },
  {
    fullName: "Kisan Jagtap",
    fatherOrHusbandName: "Motiram Jagtap",
    phone: "9876500011",
    village: "Sultanpur",
    gender: "Male",
    landParcels: [
      { name: "Gat 99", surveyNo: "99", areaAcres: 2, soilType: "Black cotton soil", waterSource: "Borewell" },
      { name: "Gat 100", surveyNo: "100", areaAcres: 1, soilType: "Black cotton soil", waterSource: "Borewell" },
      { name: "Gat 101", surveyNo: "101", areaAcres: 0.5, soilType: "Black cotton soil", waterSource: "Rainfed" },
    ],
  },
];

async function findProduct(prisma: PrismaClient, name: string) {
  const product = await prisma.product.findFirstOrThrow({ where: { name } });
  return product;
}

async function recordHealth(
  prisma: PrismaClient,
  cropId: string,
  timelineStageId: string | null,
  adminId: string,
  ratings: {
    overallHealth: number;
    pestSeverity: number;
    diseaseSeverity: number;
    weedSeverity: number;
    growthRating: number;
    waterCondition: number;
    nutrientDeficiency: number;
  },
  notes: string,
  daysAgo: number
) {
  await prisma.cropHealthRecord.create({
    data: {
      cropId,
      timelineStageId,
      recordedById: adminId,
      ...ratings,
      notes,
      createdAt: subDays(new Date(), daysAgo),
    },
  });
}

async function recordTreatmentChain(
  prisma: PrismaClient,
  params: {
    cropId: string;
    timelineStageId: string | null;
    productName: string;
    adminId: string;
    farmerId: string;
    targetPestOrDisease: string;
    dosage: string;
    applicationStatus: "RECOMMENDED" | "PURCHASED" | "APPLIED" | "NOT_APPLIED" | "CANCELLED";
    result?: "EXCELLENT" | "GOOD" | "MODERATE" | "NO_IMPROVEMENT" | "POOR" | "CROP_DAMAGED";
    improvementPercent?: number;
    feedbackRating?: number;
    feedbackSatisfied?: boolean;
    feedbackComment?: string;
  }
) {
  const product = await findProduct(prisma, params.productName);
  const recommendation = await prisma.recommendation.create({
    data: {
      cropId: params.cropId,
      timelineStageId: params.timelineStageId,
      productId: product.id,
      recommendedById: params.adminId,
      targetPestOrDisease: params.targetPestOrDisease,
      dosage: params.dosage,
      applicationMethod: "Foliar spray",
    },
  });
  const application = await prisma.application.create({
    data: {
      recommendationId: recommendation.id,
      status: params.applicationStatus,
      appliedDate: params.applicationStatus === "APPLIED" ? subDays(new Date(), 5) : null,
    },
  });

  if (params.result) {
    const treatmentResult = await prisma.treatmentResult.create({
      data: {
        applicationId: application.id,
        result: params.result,
        improvementPercent: params.improvementPercent,
        pestSeverityBefore: 4,
        pestSeverityAfter: params.result === "EXCELLENT" || params.result === "GOOD" ? 1 : 3,
      },
    });

    if (params.feedbackRating) {
      await prisma.farmerFeedback.create({
        data: {
          treatmentResultId: treatmentResult.id,
          farmerId: params.farmerId,
          rating: params.feedbackRating,
          satisfied: params.feedbackSatisfied ?? true,
          comments: params.feedbackComment,
        },
      });
    }
  }
}

export async function seedFarmersAndCrops(prisma: PrismaClient, adminId: string) {
  const today = new Date();
  const cropMasters = await prisma.cropMaster.findMany();
  const byName = new Map(cropMasters.map((c) => [c.name, c]));

  const farmerRecords = new Map<string, string>(); // fullName -> id
  const landRecords = new Map<string, string>(); // "fullName|gatName" -> id

  for (const f of FARMERS) {
    const farmer = await prisma.farmer.upsert({
      where: { phone: f.phone },
      update: {},
      create: {
        fullName: f.fullName,
        fatherOrHusbandName: f.fatherOrHusbandName,
        phone: f.phone,
        gender: f.gender,
        village: f.village,
        isDemo: true,
      },
    });
    farmerRecords.set(f.fullName, farmer.id);

    for (const parcel of f.landParcels) {
      const existing = await prisma.landParcel.findFirst({ where: { farmerId: farmer.id, name: parcel.name } });
      const land = existing
        ?? (await prisma.landParcel.create({
          data: {
            farmerId: farmer.id,
            name: parcel.name,
            surveyNo: parcel.surveyNo,
            areaAcres: parcel.areaAcres,
            soilType: parcel.soilType,
            waterSource: parcel.waterSource,
            village: f.village,
          },
        }));
      landRecords.set(`${f.fullName}|${parcel.name}`, land.id);
    }
  }

  // Skip crop seeding if crops already exist for these demo farmers (idempotent re-run guard).
  const alreadySeeded = await prisma.crop.findFirst({ where: { isDemo: true } });
  if (alreadySeeded) {
    console.log("Demo crops already seeded — skipping crop/treatment/follow-up seed.");
    return;
  }

  const cotton = byName.get("Cotton")!;
  const maize = byName.get("Maize")!;
  const ginger = byName.get("Ginger")!;
  const sugarcane = byName.get("Sugarcane")!;
  const onion = byName.get("Onion")!;

  // 1. Ramesh Patil — Cotton (on track, full treatment chain) + Maize (second crop, no treatment yet)
  const ramesh = farmerRecords.get("Ramesh Patil")!;
  const { crop: rameshCotton } = await seedCropWithTimeline(prisma, {
    farmerId: ramesh,
    landParcelId: landRecords.get("Ramesh Patil|Gat 102")!,
    cropMasterId: cotton.id,
    anchorType: "SOWING",
    season: "Kharif",
    areaAcres: 2.5,
    anchorDate: new Date("2026-06-18"),
    status: "GROWING",
    today,
  });
  await recordHealth(
    prisma,
    rameshCotton.id,
    rameshCotton.currentStageId ?? null,
    adminId,
    { overallHealth: 4, pestSeverity: 2, diseaseSeverity: 1, weedSeverity: 2, growthRating: 4, waterCondition: 4, nutrientDeficiency: 1 },
    "Healthy canopy, minor aphid presence on lower leaves.",
    6
  );
  await recordTreatmentChain(prisma, {
    cropId: rameshCotton.id,
    timelineStageId: rameshCotton.currentStageId,
    productName: "Imidacloprid 17.8% SL",
    adminId,
    farmerId: ramesh,
    targetPestOrDisease: "Aphid",
    dosage: "0.3 ml/litre",
    applicationStatus: "APPLIED",
    result: "GOOD",
    improvementPercent: 75,
    feedbackRating: 4,
    feedbackSatisfied: true,
    feedbackComment: "Aphids reduced noticeably within a week.",
  });
  await prisma.weatherContext.create({
    data: {
      cropId: rameshCotton.id,
      rainfallStatus: "NORMAL",
      rainfallLast7Days: 22,
      rainfallLast14Days: 48,
      irrigationAvailable: true,
      recordedById: adminId,
      recordedAt: subDays(today, 3),
    },
  });
  await prisma.followup.create({
    data: {
      farmerId: ramesh,
      cropId: rameshCotton.id,
      reason: "Check flowering progress and square retention",
      priority: "MEDIUM",
      status: "PENDING",
      dueDate: addDays(today, 5),
    },
  });

  await seedCropWithTimeline(prisma, {
    farmerId: ramesh,
    landParcelId: landRecords.get("Ramesh Patil|Gat 145")!,
    cropMasterId: maize.id,
    anchorType: "SOWING",
    season: "Kharif",
    areaAcres: 1,
    anchorDate: new Date("2026-06-20"),
    status: "GROWING",
    today,
  });

  // 2. Sunil Jadhav — Cotton, health only, follow-up today
  const sunil = farmerRecords.get("Sunil Jadhav")!;
  const { crop: sunilCotton } = await seedCropWithTimeline(prisma, {
    farmerId: sunil,
    landParcelId: landRecords.get("Sunil Jadhav|Gat 55")!,
    cropMasterId: cotton.id,
    anchorType: "SOWING",
    season: "Kharif",
    areaAcres: 3,
    anchorDate: new Date("2026-06-25"),
    status: "GROWING",
    today,
  });
  await recordHealth(
    prisma,
    sunilCotton.id,
    sunilCotton.currentStageId ?? null,
    adminId,
    { overallHealth: 4, pestSeverity: 1, diseaseSeverity: 1, weedSeverity: 3, growthRating: 4, waterCondition: 3, nutrientDeficiency: 2 },
    "Weed pressure building up along field edges.",
    2
  );
  await prisma.followup.create({
    data: {
      farmerId: sunil,
      cropId: sunilCotton.id,
      reason: "Weekly pest scouting round",
      priority: "LOW",
      status: "PENDING",
      dueDate: today,
    },
  });

  // 3. Vitthal Shinde — Maize, application purchased but not yet applied, overdue follow-up
  const vitthal = farmerRecords.get("Vitthal Shinde")!;
  const { crop: vitthalMaize } = await seedCropWithTimeline(prisma, {
    farmerId: vitthal,
    landParcelId: landRecords.get("Vitthal Shinde|Gat 210")!,
    cropMasterId: maize.id,
    anchorType: "SOWING",
    season: "Kharif",
    areaAcres: 2,
    anchorDate: new Date("2026-06-28"),
    status: "GROWING",
    today,
  });
  await recordTreatmentChain(prisma, {
    cropId: vitthalMaize.id,
    timelineStageId: vitthalMaize.currentStageId,
    productName: "Emamectin Benzoate 5% SG",
    adminId,
    farmerId: vitthal,
    targetPestOrDisease: "Fall armyworm",
    dosage: "0.4 gm/litre",
    applicationStatus: "PURCHASED",
  });
  await prisma.followup.create({
    data: {
      farmerId: vitthal,
      cropId: vitthalMaize.id,
      reason: "Confirm fall armyworm treatment has been applied",
      priority: "HIGH",
      status: "PENDING",
      dueDate: subDays(today, 3),
    },
  });

  // 4. Ganesh Pawar — Ginger, health only
  const ganesh = farmerRecords.get("Ganesh Pawar")!;
  const { crop: ganeshGinger } = await seedCropWithTimeline(prisma, {
    farmerId: ganesh,
    landParcelId: landRecords.get("Ganesh Pawar|Gat 88")!,
    cropMasterId: ginger.id,
    anchorType: "PLANTING",
    season: "Kharif",
    areaAcres: 1.5,
    anchorDate: new Date("2026-06-12"),
    status: "GROWING",
    today,
  });
  await recordHealth(
    prisma,
    ganeshGinger.id,
    ganeshGinger.currentStageId ?? null,
    adminId,
    { overallHealth: 3, pestSeverity: 2, diseaseSeverity: 2, weedSeverity: 2, growthRating: 3, waterCondition: 4, nutrientDeficiency: 2 },
    "Vegetative growth steady, monitoring for leaf spot.",
    4
  );

  // 5. Anil Deshmukh — Sugarcane Adsali, moderate result
  const anil = farmerRecords.get("Anil Deshmukh")!;
  const { crop: anilSugarcane } = await seedCropWithTimeline(prisma, {
    farmerId: anil,
    landParcelId: landRecords.get("Anil Deshmukh|Gat 300")!,
    cropMasterId: sugarcane.id,
    anchorType: "PLANTING",
    plantingType: "ADSALI",
    season: "Adsali",
    areaAcres: 4,
    anchorDate: new Date("2026-07-15"),
    status: "GROWING",
    today,
  });
  await recordTreatmentChain(prisma, {
    cropId: anilSugarcane.id,
    timelineStageId: anilSugarcane.currentStageId,
    productName: "Chlorpyrifos 20% EC",
    adminId,
    farmerId: anil,
    targetPestOrDisease: "Early shoot borer",
    dosage: "2.5 ml/litre",
    applicationStatus: "APPLIED",
    result: "MODERATE",
    improvementPercent: 45,
    feedbackRating: 3,
    feedbackSatisfied: false,
    feedbackComment: "Some improvement but borer damage still visible in patches.",
  });
  await prisma.weatherContext.create({
    data: {
      cropId: anilSugarcane.id,
      rainfallStatus: "EXCESS_RAIN",
      rainfallLast7Days: 95,
      rainfallLast14Days: 160,
      irrigationAvailable: true,
      notes: "Waterlogging observed in low-lying section of the field.",
      recordedById: adminId,
      recordedAt: subDays(today, 1),
    },
  });
  await prisma.followup.create({
    data: {
      farmerId: anil,
      cropId: anilSugarcane.id,
      reason: "Re-check shoot borer damage after two weeks",
      priority: "MEDIUM",
      status: "PENDING",
      dueDate: addDays(today, 10),
    },
  });

  // 6. Bapu More — Onion Kharif, excellent result
  const bapu = farmerRecords.get("Bapu More")!;
  const { crop: bapuOnion } = await seedCropWithTimeline(prisma, {
    farmerId: bapu,
    landParcelId: landRecords.get("Bapu More|Gat 12")!,
    cropMasterId: onion.id,
    anchorType: "TRANSPLANTING",
    plantingType: "KHARIF",
    season: "Kharif",
    areaAcres: 2,
    anchorDate: new Date("2026-06-28"),
    status: "GROWING",
    today,
  });
  await recordTreatmentChain(prisma, {
    cropId: bapuOnion.id,
    timelineStageId: bapuOnion.currentStageId,
    productName: "Copper Oxychloride 50% WP",
    adminId,
    farmerId: bapu,
    targetPestOrDisease: "Purple blotch",
    dosage: "2.5 gm/litre",
    applicationStatus: "APPLIED",
    result: "EXCELLENT",
    improvementPercent: 90,
    feedbackRating: 5,
    feedbackSatisfied: true,
    feedbackComment: "Blotch symptoms cleared up completely.",
  });

  // 7. Dattu Kale — Onion Rabi, future transplanting (not yet started)
  const dattu = farmerRecords.get("Dattu Kale")!;
  await seedCropWithTimeline(prisma, {
    farmerId: dattu,
    landParcelId: landRecords.get("Dattu Kale|Gat 77")!,
    cropMasterId: onion.id,
    anchorType: "TRANSPLANTING",
    plantingType: "RABI",
    season: "Rabi",
    areaAcres: 1,
    anchorDate: new Date("2026-10-15"),
    status: "PLANNED",
    today,
  });

  // 8. Prakash Wagh — Sugarcane Suru, long-duration, good result
  const prakash = farmerRecords.get("Prakash Wagh")!;
  const { crop: prakashSugarcane } = await seedCropWithTimeline(prisma, {
    farmerId: prakash,
    landParcelId: landRecords.get("Prakash Wagh|Gat 150")!,
    cropMasterId: sugarcane.id,
    anchorType: "PLANTING",
    plantingType: "SURU",
    season: "Suru",
    areaAcres: 5,
    anchorDate: new Date("2026-01-15"),
    status: "GROWING",
    today,
  });
  await recordTreatmentChain(prisma, {
    cropId: prakashSugarcane.id,
    timelineStageId: prakashSugarcane.currentStageId,
    productName: "Mancozeb 75% WP",
    adminId,
    farmerId: prakash,
    targetPestOrDisease: "Leaf spot",
    dosage: "2 gm/litre",
    applicationStatus: "APPLIED",
    result: "GOOD",
    improvementPercent: 70,
    feedbackRating: 4,
    feedbackSatisfied: true,
  });
  await prisma.followup.create({
    data: {
      farmerId: prakash,
      cropId: prakashSugarcane.id,
      reason: "Monitor grand growth stage nutrient uptake",
      priority: "LOW",
      status: "PENDING",
      dueDate: addDays(today, 14),
    },
  });

  // 9. Suresh Gaikwad — Cotton, fully harvested success story
  const suresh = farmerRecords.get("Suresh Gaikwad")!;
  const { crop: sureshCotton } = await seedCropWithTimeline(prisma, {
    farmerId: suresh,
    landParcelId: landRecords.get("Suresh Gaikwad|Gat 45")!,
    cropMasterId: cotton.id,
    anchorType: "SOWING",
    season: "Kharif",
    areaAcres: 2,
    anchorDate: new Date("2025-11-01"),
    status: "HARVESTED",
    actualHarvestDate: new Date("2026-05-20"),
    today,
  });
  await recordTreatmentChain(prisma, {
    cropId: sureshCotton.id,
    timelineStageId: null,
    productName: "Profenofos 50% EC",
    adminId,
    farmerId: suresh,
    targetPestOrDisease: "Pink bollworm",
    dosage: "2 ml/litre",
    applicationStatus: "APPLIED",
    result: "EXCELLENT",
    improvementPercent: 92,
    feedbackRating: 5,
    feedbackSatisfied: true,
    feedbackComment: "Best cotton yield in three seasons.",
  });

  // 10. Baban Bhosale — Maize, deliberately not advanced (demonstrates NEEDS_REVIEW honestly)
  const baban = farmerRecords.get("Baban Bhosale")!;
  const { crop: babanMaize } = await seedCropWithTimeline(prisma, {
    farmerId: baban,
    landParcelId: landRecords.get("Baban Bhosale|Gat 60")!,
    cropMasterId: maize.id,
    anchorType: "SOWING",
    season: "Kharif",
    areaAcres: 1.5,
    anchorDate: new Date("2026-05-01"),
    status: "GROWING",
    currentStageSequenceOverride: 2, // Sowing — deliberately stale to demo an under-monitored crop
    today,
  });
  await recordHealth(
    prisma,
    babanMaize.id,
    babanMaize.currentStageId ?? null,
    adminId,
    { overallHealth: 2, pestSeverity: 4, diseaseSeverity: 2, weedSeverity: 3, growthRating: 2, waterCondition: 2, nutrientDeficiency: 3 },
    "Field visit overdue — last recorded observation shows stress signs.",
    18
  );
  await recordTreatmentChain(prisma, {
    cropId: babanMaize.id,
    timelineStageId: babanMaize.currentStageId,
    productName: "Emamectin Benzoate 5% SG",
    adminId,
    farmerId: baban,
    targetPestOrDisease: "Fall armyworm (suspected)",
    dosage: "0.4 gm/litre",
    applicationStatus: "RECOMMENDED",
  });
  await prisma.weatherContext.create({
    data: {
      cropId: babanMaize.id,
      rainfallStatus: "DRY_SPELL",
      rainfallLast7Days: 2,
      rainfallLast14Days: 8,
      irrigationAvailable: false,
      notes: "Extended dry spell likely contributing to crop stress.",
      recordedById: adminId,
      recordedAt: subDays(today, 5),
    },
  });
  await prisma.followup.create({
    data: {
      farmerId: baban,
      cropId: babanMaize.id,
      reason: "Farm visit needed — crop status unclear, last update weeks ago",
      priority: "URGENT",
      status: "PENDING",
      dueDate: subDays(today, 10),
    },
  });

  // 11. Kisan Jagtap — Cotton, mid-cycle, multiple land parcels, healthy
  const kisan = farmerRecords.get("Kisan Jagtap")!;
  const { crop: kisanCotton } = await seedCropWithTimeline(prisma, {
    farmerId: kisan,
    landParcelId: landRecords.get("Kisan Jagtap|Gat 99")!,
    cropMasterId: cotton.id,
    anchorType: "SOWING",
    season: "Kharif",
    areaAcres: 2,
    anchorDate: new Date("2026-05-20"),
    status: "GROWING",
    today,
  });
  await recordHealth(
    prisma,
    kisanCotton.id,
    kisanCotton.currentStageId ?? null,
    adminId,
    { overallHealth: 5, pestSeverity: 1, diseaseSeverity: 1, weedSeverity: 1, growthRating: 5, waterCondition: 5, nutrientDeficiency: 1 },
    "Excellent boll development, no visible issues.",
    1
  );
  await prisma.followup.create({
    data: {
      farmerId: kisan,
      cropId: kisanCotton.id,
      reason: "Routine health check",
      priority: "LOW",
      status: "PENDING",
      dueDate: today,
    },
  });

  // Portal access for a representative subset (on-track, and the delayed one).
  await grantFarmerPortalAccess(prisma, ramesh, "9876500001", DEMO_FARMER_PASSWORD);
  await grantFarmerPortalAccess(prisma, sunil, "9876500002", DEMO_FARMER_PASSWORD);
  await grantFarmerPortalAccess(prisma, baban, "9876500010", DEMO_FARMER_PASSWORD);

  // A few illustrative audit rows.
  await prisma.auditLog.create({
    data: { userId: adminId, action: "LOGIN", metadata: { note: "Demo seed" } },
  });
  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: "FARMER_CREATED",
      entityType: "Farmer",
      entityId: ramesh,
      metadata: { village: "Chapaner" },
    },
  });
}
