import { prisma } from "@/lib/db";

export type LogAction =
  | "STOCK_IN"
  | "STOCK_OUT"
  | "PRODUCT_CREATE"
  | "PRODUCT_UPDATE"
  | "PRODUCT_DELETE"
  | "STAFF_ADD"
  | "STAFF_REMOVE"
  | "SETTINGS_UPDATE"
  | "WAREHOUSE_UPDATE";

export interface LogParams {
  warehouseId: string;
  userId: string;
  userName: string;
  action: LogAction;
  entityName?: string;
  qty?: number;
  details?: string;
}

/** Fire-and-forget — лог алдаа гарсан ч request зогсоохгүй */
export function writeLog(params: LogParams): void {
  prisma.warehouseLog
    .create({ data: params })
    .catch((err: unknown) => console.error("[log]", err));
}
