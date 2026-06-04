import { prisma } from "@/lib/db";

/** FEFO-гоор зарлагын batch-уудыг буцаана (хугацаа эрт дуусахаас эхэлнэ) */
export async function getFefoBatches(productId: string) {
  const batches = await prisma.batch.findMany({
    where: { productId },
    orderBy: [
      // null (хугацаагүй) сүүлд гарна
      { expiryDate: "asc" },
      { createdAt: "asc" },
    ],
  });

  // Үлдэгдэлтэй batch-уудыг л буцаана
  return batches.filter((b) => b.qtyIn - b.qtyOut > 0);
}

/**
 * FEFO дарааллаар qty-г batch-уудад хуваарилна.
 * @returns [{ batchId, qty }] — зарлага бичих дэлгэрэнгүй
 */
export function allocateFifo(
  batches: Array<{ id: string; qtyIn: number; qtyOut: number }>,
  totalQty: number
): Array<{ batchId: string; qty: number }> {
  const allocations: Array<{ batchId: string; qty: number }> = [];
  let remaining = totalQty;

  for (const batch of batches) {
    if (remaining <= 0) break;
    const available = batch.qtyIn - batch.qtyOut;
    const take = Math.min(available, remaining);
    if (take > 0) {
      allocations.push({ batchId: batch.id, qty: take });
      remaining -= take;
    }
  }

  return allocations;
}

/** Барааны нийт үлдэгдлийг тооцно */
export async function getProductStock(productId: string): Promise<number> {
  const agg = await prisma.batch.aggregate({
    where: { productId },
    _sum: { qtyIn: true, qtyOut: true },
  });
  return (agg._sum.qtyIn ?? 0) - (agg._sum.qtyOut ?? 0);
}
