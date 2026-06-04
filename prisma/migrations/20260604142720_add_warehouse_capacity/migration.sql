-- AlterTable
ALTER TABLE "Warehouse" ADD COLUMN     "capacity" DOUBLE PRECISION,
ADD COLUMN     "capacityUnit" TEXT NOT NULL DEFAULT 'нэгж';
