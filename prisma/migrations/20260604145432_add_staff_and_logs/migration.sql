-- CreateTable
CREATE TABLE "StaffMember" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'staff',
    "phone" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarehouseLog" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityName" TEXT,
    "qty" DOUBLE PRECISION,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WarehouseLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StaffMember_warehouseId_idx" ON "StaffMember"("warehouseId");

-- CreateIndex
CREATE INDEX "WarehouseLog_warehouseId_idx" ON "WarehouseLog"("warehouseId");

-- CreateIndex
CREATE INDEX "WarehouseLog_warehouseId_createdAt_idx" ON "WarehouseLog"("warehouseId", "createdAt");

-- CreateIndex
CREATE INDEX "WarehouseLog_userId_idx" ON "WarehouseLog"("userId");

-- AddForeignKey
ALTER TABLE "StaffMember" ADD CONSTRAINT "StaffMember_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseLog" ADD CONSTRAINT "WarehouseLog_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
