import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const WAREHOUSE_NAME = "Аромат Кофе Дэлгүүр";

const PRODUCTS: {
  code: string; name: string; unit: string; category: string;
  unitPrice: number; reorderLevel: number; isPerishable: boolean; location?: string;
}[] = [
  // Кофе үрэл
  { code: "COF-001", name: "Ethiopia Yirgacheffe Arabica үрэл", unit: "кг", category: "Кофе үрэл", unitPrice: 48000, reorderLevel: 5, isPerishable: true, location: "A-1" },
  { code: "COF-002", name: "Vietnam Robusta үрэл", unit: "кг", category: "Кофе үрэл", unitPrice: 22000, reorderLevel: 5, isPerishable: true, location: "A-1" },
  { code: "COF-003", name: "Brazil Santos Blend үрэл", unit: "кг", category: "Кофе үрэл", unitPrice: 35000, reorderLevel: 5, isPerishable: true, location: "A-2" },
  { code: "COF-004", name: "Colombia Supremo үрэл", unit: "кг", category: "Кофе үрэл", unitPrice: 42000, reorderLevel: 3, isPerishable: true, location: "A-2" },
  // Сүү, цөцгий
  { code: "MLK-001", name: "Бүтэн сүү 1L", unit: "ш", category: "Сүү & Цөцгий", unitPrice: 3800, reorderLevel: 20, isPerishable: true, location: "B-1" },
  { code: "MLK-002", name: "Хагас тослог сүү 1L", unit: "ш", category: "Сүү & Цөцгий", unitPrice: 3500, reorderLevel: 20, isPerishable: true, location: "B-1" },
  { code: "MLK-003", name: "Цөцгий 1L", unit: "ш", category: "Сүү & Цөцгий", unitPrice: 5200, reorderLevel: 10, isPerishable: true, location: "B-2" },
  { code: "MLK-004", name: "Тосон сүү (Oat milk) 1L", unit: "ш", category: "Сүү & Цөцгий", unitPrice: 6500, reorderLevel: 10, isPerishable: false, location: "B-2" },
  // Широп
  { code: "SYR-001", name: "Ваниль широп 750мл", unit: "ш", category: "Широп", unitPrice: 28000, reorderLevel: 3, isPerishable: false, location: "C-1" },
  { code: "SYR-002", name: "Карамель широп 750мл", unit: "ш", category: "Широп", unitPrice: 28000, reorderLevel: 3, isPerishable: false, location: "C-1" },
  { code: "SYR-003", name: "Шоколад широп 750мл", unit: "ш", category: "Широп", unitPrice: 22000, reorderLevel: 3, isPerishable: false, location: "C-1" },
  { code: "SYR-004", name: "Лаванда широп 750мл", unit: "ш", category: "Широп", unitPrice: 32000, reorderLevel: 2, isPerishable: false, location: "C-2" },
  { code: "SYR-005", name: "Hazelnut широп 750мл", unit: "ш", category: "Широп", unitPrice: 30000, reorderLevel: 2, isPerishable: false, location: "C-2" },
  // Чихэр
  { code: "SUG-001", name: "Цагаан элсэн чихэр 1кг", unit: "кг", category: "Чихэр", unitPrice: 2500, reorderLevel: 10, isPerishable: false, location: "D-1" },
  { code: "SUG-002", name: "Хүрэн чихэр 1кг", unit: "кг", category: "Чихэр", unitPrice: 4200, reorderLevel: 5, isPerishable: false, location: "D-1" },
  { code: "SUG-003", name: "Бал 500мл", unit: "ш", category: "Чихэр", unitPrice: 12000, reorderLevel: 3, isPerishable: false, location: "D-2" },
  // Цаасан савлагаа
  { code: "PKG-001", name: "Цаасан аяга 8oz", unit: "ш", category: "Савлагаа", unitPrice: 320, reorderLevel: 100, isPerishable: false, location: "E-1" },
  { code: "PKG-002", name: "Цаасан аяга 12oz", unit: "ш", category: "Савлагаа", unitPrice: 380, reorderLevel: 100, isPerishable: false, location: "E-1" },
  { code: "PKG-003", name: "Цаасан аяга 16oz", unit: "ш", category: "Савлагаа", unitPrice: 420, reorderLevel: 100, isPerishable: false, location: "E-1" },
  { code: "PKG-004", name: "Аяганы таг (унив.)", unit: "ш", category: "Савлагаа", unitPrice: 150, reorderLevel: 200, isPerishable: false, location: "E-2" },
  { code: "PKG-005", name: "Сүрэл (Straw)", unit: "ш", category: "Савлагаа", unitPrice: 80, reorderLevel: 200, isPerishable: false, location: "E-2" },
  { code: "PKG-006", name: "Жижиг цаасан уут", unit: "ш", category: "Савлагаа", unitPrice: 450, reorderLevel: 50, isPerishable: false, location: "E-3" },
  // Жигнэмэг
  { code: "PST-001", name: "Шоколад зуурай", unit: "ш", category: "Жигнэмэг", unitPrice: 2500, reorderLevel: 10, isPerishable: true, location: "F-1" },
  { code: "PST-002", name: "Бадамтай зуурай", unit: "ш", category: "Жигнэмэг", unitPrice: 3800, reorderLevel: 10, isPerishable: true, location: "F-1" },
  { code: "PST-003", name: "Cheesecake (хэсэг)", unit: "ш", category: "Жигнэмэг", unitPrice: 5500, reorderLevel: 5, isPerishable: true, location: "F-2" },
  // Тоног хэрэгсэл
  { code: "EQP-001", name: "Эспрессо машины цэвэрлэгч таблет", unit: "ш", category: "Тоног хэрэгсэл", unitPrice: 1200, reorderLevel: 5, isPerishable: false, location: "G-1" },
  { code: "EQP-002", name: "Грайндерийн тостлох тос", unit: "ш", category: "Тоног хэрэгсэл", unitPrice: 15000, reorderLevel: 1, isPerishable: false, location: "G-1" },
];

// Stock quantities and batch info per product code
const STOCK: Record<string, { qty: number; batchNo: string; daysAgo: number; expiryDays?: number; supplier: string }[]> = {
  "COF-001": [{ qty: 25, batchNo: "ETH-2026-01", daysAgo: 30, expiryDays: 365, supplier: "Kaldi Origin Trading" }],
  "COF-002": [{ qty: 40, batchNo: "VNM-2026-01", daysAgo: 20, expiryDays: 365, supplier: "Saigon Bean Export" }],
  "COF-003": [{ qty: 30, batchNo: "BRZ-2026-01", daysAgo: 15, expiryDays: 365, supplier: "Santos Coffee Co." }],
  "COF-004": [{ qty: 15, batchNo: "COL-2026-01", daysAgo: 10, expiryDays: 365, supplier: "Colombia Direct" }],
  "MLK-001": [{ qty: 60, batchNo: "MLK-A-01", daysAgo: 3, expiryDays: 14, supplier: "Говийн Мандал ХХК" }, { qty: 40, batchNo: "MLK-A-02", daysAgo: 1, expiryDays: 14, supplier: "Говийн Мандал ХХК" }],
  "MLK-002": [{ qty: 48, batchNo: "MLK-B-01", daysAgo: 3, expiryDays: 14, supplier: "Говийн Мандал ХХК" }],
  "MLK-003": [{ qty: 24, batchNo: "CRM-01", daysAgo: 5, expiryDays: 21, supplier: "Дорнод Сүү ХХК" }],
  "MLK-004": [{ qty: 30, batchNo: "OAT-01", daysAgo: 15, expiryDays: 180, supplier: "Oatly Distribution MN" }],
  "SYR-001": [{ qty: 12, batchNo: "SYR-VAN-01", daysAgo: 45, supplier: "Monin MN" }],
  "SYR-002": [{ qty: 12, batchNo: "SYR-CAR-01", daysAgo: 45, supplier: "Monin MN" }],
  "SYR-003": [{ qty: 10, batchNo: "SYR-CHO-01", daysAgo: 45, supplier: "Monin MN" }],
  "SYR-004": [{ qty: 6, batchNo: "SYR-LAV-01", daysAgo: 30, supplier: "Monin MN" }],
  "SYR-005": [{ qty: 8, batchNo: "SYR-HZL-01", daysAgo: 30, supplier: "Monin MN" }],
  "SUG-001": [{ qty: 50, batchNo: "SUG-W-01", daysAgo: 60, supplier: "Нарны Чихэр ХХК" }],
  "SUG-002": [{ qty: 20, batchNo: "SUG-B-01", daysAgo: 60, supplier: "Нарны Чихэр ХХК" }],
  "SUG-003": [{ qty: 15, batchNo: "HON-01", daysAgo: 40, expiryDays: 730, supplier: "Монгол Зөгий ХХК" }],
  "PKG-001": [{ qty: 500, batchNo: "CUP-8-01", daysAgo: 30, supplier: "Эко Савлагаа ХХК" }],
  "PKG-002": [{ qty: 600, batchNo: "CUP-12-01", daysAgo: 30, supplier: "Эко Савлагаа ХХК" }],
  "PKG-003": [{ qty: 400, batchNo: "CUP-16-01", daysAgo: 30, supplier: "Эко Савлагаа ХХК" }],
  "PKG-004": [{ qty: 1000, batchNo: "LID-01", daysAgo: 30, supplier: "Эко Савлагаа ХХК" }],
  "PKG-005": [{ qty: 1000, batchNo: "STR-01", daysAgo: 45, supplier: "Эко Савлагаа ХХК" }],
  "PKG-006": [{ qty: 200, batchNo: "BAG-01", daysAgo: 20, supplier: "Эко Савлагаа ХХК" }],
  "PST-001": [{ qty: 40, batchNo: "PST-CHO-01", daysAgo: 2, expiryDays: 7, supplier: "Аромат Нарийн Боов ХХК" }],
  "PST-002": [{ qty: 35, batchNo: "PST-ALM-01", daysAgo: 2, expiryDays: 7, supplier: "Аромат Нарийн Боов ХХК" }],
  "PST-003": [{ qty: 20, batchNo: "PST-CHZ-01", daysAgo: 1, expiryDays: 5, supplier: "Солонго Зоогийн Газар" }],
  "EQP-001": [{ qty: 24, batchNo: "EQP-CLN-01", daysAgo: 90, supplier: "Кофе Тоног Импорт ХХК" }],
  "EQP-002": [{ qty: 3, batchNo: "EQP-OIL-01", daysAgo: 60, supplier: "Кофе Тоног Импорт ХХК" }],
};

function daysAgoDate(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  console.log("🌱 Coffee shop seed эхэлж байна...");

  // Find first user
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) {
    console.error("❌ Хэрэглэгч олдсонгүй. Эхлээд бүртгэл үүсгэнэ үү.");
    process.exit(1);
  }
  console.log(`👤 Хэрэглэгч: ${user.email}`);

  // Find or create warehouse
  let warehouse = await prisma.warehouse.findFirst({
    where: { ownerId: user.id },
    orderBy: { createdAt: "asc" },
  });

  if (!warehouse) {
    warehouse = await prisma.warehouse.create({
      data: {
        name: WAREHOUSE_NAME,
        ownerId: user.id,
        capacity: 5000,
        capacityUnit: "кг",
      },
    });
    await prisma.notificationSetting.create({ data: { warehouseId: warehouse.id } });
    console.log(`🏪 Агуулах үүсгэлээ: ${warehouse.name}`);
  } else {
    console.log(`🏪 Агуулах ашиглаж байна: ${warehouse.name}`);
  }

  let productCount = 0;
  let batchCount = 0;
  let stockInCount = 0;

  for (const p of PRODUCTS) {
    // Upsert product
    const product = await prisma.product.upsert({
      where: { warehouseId_code: { warehouseId: warehouse.id, code: p.code } },
      update: { name: p.name, unitPrice: p.unitPrice, reorderLevel: p.reorderLevel },
      create: {
        warehouseId: warehouse.id,
        code: p.code,
        name: p.name,
        unit: p.unit,
        category: p.category,
        unitPrice: p.unitPrice,
        reorderLevel: p.reorderLevel,
        isPerishable: p.isPerishable,
        location: p.location,
      },
    });
    productCount++;

    const batches = STOCK[p.code] ?? [];
    for (const b of batches) {
      // Skip if batch already exists
      const existingBatch = await prisma.batch.findFirst({
        where: { productId: product.id, batchNo: b.batchNo },
      });
      if (existingBatch) continue;

      const expiryDate = b.expiryDays
        ? new Date(Date.now() + b.expiryDays * 86400 * 1000)
        : undefined;

      const batch = await prisma.batch.create({
        data: {
          productId: product.id,
          batchNo: b.batchNo,
          expiryDate,
          qtyIn: b.qty,
          qtyOut: 0,
        },
      });
      batchCount++;

      await prisma.stockIn.create({
        data: {
          warehouseId: warehouse.id,
          productId: product.id,
          batchId: batch.id,
          date: daysAgoDate(b.daysAgo),
          qty: b.qty,
          unitPrice: p.unitPrice,
          supplier: b.supplier,
          docNo: `ORD-${b.batchNo}`,
          createdBy: user.id,
        },
      });
      stockInCount++;
    }
  }

  console.log(`✅ Дууслаа:`);
  console.log(`   📦 ${productCount} бараа`);
  console.log(`   🏷️  ${batchCount} лот`);
  console.log(`   📥 ${stockInCount} орлого`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
