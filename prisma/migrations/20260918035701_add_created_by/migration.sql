-- AlterTable
ALTER TABLE `orderitems` ADD COLUMN `createdBy` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `orders` ADD COLUMN `createdBy` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `payments` ADD COLUMN `createdBy` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `products` ADD COLUMN `createdBy` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `qrcodes` ADD COLUMN `createdBy` VARCHAR(191) NULL;
