import type { PrismaClient } from "@prisma/client";

interface ProductSeed {
  name: string;
  category: string;
  brand?: string;
  manufacturer?: string;
  activeIngredient?: string;
  unit: string;
  packSize: string;
  mrp: number;
  sellingPrice: number;
  targetCropName?: string;
  targetPest?: string;
  usageNotes?: string;
}

export const PRODUCT_SEEDS: ProductSeed[] = [
  { name: "Bt Cotton Hybrid Seed", category: "Seeds", brand: "AgriGold", unit: "packet", packSize: "450 gm", mrp: 810, sellingPrice: 780, targetCropName: "Cotton" },
  { name: "Hybrid Maize Seed", category: "Seeds", brand: "Kaveri", unit: "kg", packSize: "4 kg bag", mrp: 620, sellingPrice: 600, targetCropName: "Maize" },
  { name: "Onion Seed — Bhima Super", category: "Seeds", brand: "NHRDF", unit: "kg", packSize: "500 gm", mrp: 1450, sellingPrice: 1400, targetCropName: "Onion" },
  { name: "Ginger Seed Rhizome", category: "Seeds", unit: "kg", packSize: "10 kg", mrp: 550, sellingPrice: 520, targetCropName: "Ginger" },
  { name: "Sugarcane Sett — Co-86032", category: "Seeds", unit: "unit", packSize: "1000 setts", mrp: 3200, sellingPrice: 3100, targetCropName: "Sugarcane" },

  { name: "Urea", category: "Fertilizers", manufacturer: "IFFCO", unit: "kg", packSize: "45 kg bag", mrp: 266, sellingPrice: 266 },
  { name: "DAP (Di-ammonium Phosphate)", category: "Fertilizers", manufacturer: "IFFCO", unit: "kg", packSize: "50 kg bag", mrp: 1350, sellingPrice: 1330 },
  { name: "NPK 19:19:19", category: "Fertilizers", unit: "kg", packSize: "50 kg bag", mrp: 1250, sellingPrice: 1220 },
  { name: "Single Super Phosphate (SSP)", category: "Fertilizers", unit: "kg", packSize: "50 kg bag", mrp: 450, sellingPrice: 440 },
  { name: "Potash (MOP)", category: "Fertilizers", unit: "kg", packSize: "50 kg bag", mrp: 1700, sellingPrice: 1680 },

  { name: "Chlorpyrifos 20% EC", category: "Insecticides", activeIngredient: "Chlorpyrifos", unit: "litre", packSize: "1 litre", mrp: 480, sellingPrice: 460, targetPest: "Stem borer, cutworm" },
  { name: "Imidacloprid 17.8% SL", category: "Insecticides", activeIngredient: "Imidacloprid", unit: "ml", packSize: "100 ml", mrp: 220, sellingPrice: 210, targetPest: "Aphid, jassid, whitefly" },
  { name: "Emamectin Benzoate 5% SG", category: "Insecticides", activeIngredient: "Emamectin Benzoate", unit: "gm", packSize: "100 gm", mrp: 380, sellingPrice: 360, targetPest: "Bollworm, fall armyworm" },
  { name: "Profenofos 50% EC", category: "Pesticides", activeIngredient: "Profenofos", unit: "litre", packSize: "1 litre", mrp: 620, sellingPrice: 600, targetPest: "Pink bollworm" },

  { name: "Mancozeb 75% WP", category: "Fungicides", activeIngredient: "Mancozeb", unit: "kg", packSize: "1 kg", mrp: 380, sellingPrice: 360, targetPest: "Leaf spot, blight" },
  { name: "Carbendazim 50% WP", category: "Fungicides", activeIngredient: "Carbendazim", unit: "gm", packSize: "500 gm", mrp: 260, sellingPrice: 250, targetPest: "Rhizome rot, wilt" },
  { name: "Copper Oxychloride 50% WP", category: "Fungicides", activeIngredient: "Copper Oxychloride", unit: "kg", packSize: "1 kg", mrp: 340, sellingPrice: 320, targetPest: "Purple blotch, bacterial wilt" },

  { name: "Glyphosate 41% SL", category: "Herbicides", activeIngredient: "Glyphosate", unit: "litre", packSize: "1 litre", mrp: 520, sellingPrice: 500 },
  { name: "Pendimethalin 30% EC", category: "Herbicides", activeIngredient: "Pendimethalin", unit: "litre", packSize: "1 litre", mrp: 450, sellingPrice: 430 },

  { name: "Zinc Sulphate 21%", category: "Micronutrients", unit: "kg", packSize: "1 kg", mrp: 140, sellingPrice: 130 },
  { name: "Ferrous Sulphate", category: "Micronutrients", unit: "kg", packSize: "1 kg", mrp: 120, sellingPrice: 110 },
  { name: "Boron 20%", category: "Micronutrients", unit: "kg", packSize: "500 gm", mrp: 180, sellingPrice: 170 },

  { name: "Azotobacter Culture", category: "Bio-fertilizers", unit: "litre", packSize: "1 litre", mrp: 160, sellingPrice: 150 },
  { name: "Rhizobium Culture", category: "Bio-fertilizers", unit: "litre", packSize: "1 litre", mrp: 160, sellingPrice: 150 },
  { name: "PSB (Phosphate Solubilizing Bacteria)", category: "Bio-fertilizers", unit: "litre", packSize: "1 litre", mrp: 170, sellingPrice: 160 },

  { name: "Humic Acid 98%", category: "Growth Promoters", unit: "kg", packSize: "1 kg", mrp: 420, sellingPrice: 400 },
  { name: "Seaweed Extract", category: "Growth Promoters", unit: "litre", packSize: "500 ml", mrp: 380, sellingPrice: 360 },
  { name: "NAA Growth Regulator 4.5% SL", category: "Growth Promoters", unit: "ml", packSize: "100 ml", mrp: 210, sellingPrice: 200 },

  { name: "Sticker-Spreader Agent", category: "Other", unit: "ml", packSize: "250 ml", mrp: 150, sellingPrice: 140, usageNotes: "Improves spray adhesion on foliage." },
];

export async function seedProducts(prisma: PrismaClient) {
  const categories = await prisma.productCategory.findMany();
  const categoryByName = new Map(categories.map((c) => [c.name, c.id]));
  const cropMasters = await prisma.cropMaster.findMany();
  const cropByName = new Map(cropMasters.map((c) => [c.name, c.id]));

  for (const p of PRODUCT_SEEDS) {
    const categoryId = categoryByName.get(p.category);
    if (!categoryId) continue;

    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    const data = {
      name: p.name,
      categoryId,
      brand: p.brand ?? null,
      manufacturer: p.manufacturer ?? null,
      activeIngredient: p.activeIngredient ?? null,
      unit: p.unit,
      packSize: p.packSize,
      mrp: p.mrp,
      sellingPrice: p.sellingPrice,
      targetCropId: p.targetCropName ? (cropByName.get(p.targetCropName) ?? null) : null,
      targetPest: p.targetPest ?? null,
      usageNotes: p.usageNotes ?? null,
      isActive: true,
    };
    if (existing) {
      await prisma.product.update({ where: { id: existing.id }, data });
    } else {
      await prisma.product.create({ data });
    }
  }
}
