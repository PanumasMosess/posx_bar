/*
  Warnings:

  - You are about to drop the column `tableId` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the `tables` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `orders` DROP FOREIGN KEY `orders_tableId_fkey`;

-- DropForeignKey
ALTER TABLE `tables` DROP FOREIGN KEY `tables_organizationId_fkey`;

-- DropIndex
DROP INDEX `orders_tableId_fkey` ON `orders`;

-- AlterTable
ALTER TABLE `orders` DROP COLUMN `tableId`,
    ADD COLUMN `qrCodeId` INTEGER NULL;

-- DropTable
DROP TABLE `tables`;

-- CreateTable
CREATE TABLE `qrcodes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `token` VARCHAR(191) NOT NULL,
    `tableName` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `organizationId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `qrcodes_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `qrcodes` ADD CONSTRAINT `qrcodes_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_qrCodeId_fkey` FOREIGN KEY (`qrCodeId`) REFERENCES `qrcodes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
