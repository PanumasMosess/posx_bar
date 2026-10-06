-- CreateTable
CREATE TABLE `payments_settings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `promptPayName` VARCHAR(191) NULL,
    `promptPayNumber` VARCHAR(191) NULL,
    `qrImageUrl` VARCHAR(191) NULL,
    `creditCardFee` DOUBLE NULL,
    `organizationId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payments_settings_organizationId_key`(`organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `payments_settings` ADD CONSTRAINT `payments_settings_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
