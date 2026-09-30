/*
  Warnings:

  - You are about to drop the column `businessHours` on the `organizations_settings` table. All the data in the column will be lost.
  - You are about to drop the column `currencyLabel` on the `organizations_settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `organizations_settings` DROP COLUMN `businessHours`,
    DROP COLUMN `currencyLabel`,
    ADD COLUMN `closeTime` VARCHAR(191) NULL,
    ADD COLUMN `isManualOpenClose` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `openTime` VARCHAR(191) NULL,
    ADD COLUMN `taxId` VARCHAR(191) NULL;
