-- AlterTable
ALTER TABLE `orders` ADD COLUMN `shiftsId` INTEGER NULL;

-- AlterTable
ALTER TABLE `payments` ADD COLUMN `changeAmount` DOUBLE NULL,
    ADD COLUMN `receivedAmount` DOUBLE NULL,
    ADD COLUMN `shiftId` INTEGER NULL;

-- CreateTable
CREATE TABLE `shifts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shiftNumber` VARCHAR(191) NOT NULL,
    `status` ENUM('OPEN', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `startingCash` DOUBLE NOT NULL DEFAULT 0,
    `expectedCash` DOUBLE NOT NULL DEFAULT 0,
    `endingCash` DOUBLE NULL,
    `cashDifference` DOUBLE NULL,
    `totalSales` DOUBLE NOT NULL DEFAULT 0,
    `cashSales` DOUBLE NOT NULL DEFAULT 0,
    `qrSales` DOUBLE NOT NULL DEFAULT 0,
    `cardSales` DOUBLE NOT NULL DEFAULT 0,
    `memberSales` DOUBLE NOT NULL DEFAULT 0,
    `note` VARCHAR(191) NULL,
    `openedBy` VARCHAR(191) NOT NULL,
    `closedBy` VARCHAR(191) NULL,
    `openedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `closedAt` DATETIME(3) NULL,
    `organizationId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_shiftsId_fkey` FOREIGN KEY (`shiftsId`) REFERENCES `shifts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_shiftId_fkey` FOREIGN KEY (`shiftId`) REFERENCES `shifts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shifts` ADD CONSTRAINT `shifts_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
