-- CreateTable
CREATE TABLE `account` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `organizationId` INTEGER NULL,
    `accountName` VARCHAR(191) NOT NULL,
    `balance` DOUBLE NOT NULL DEFAULT 0.00,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `accPosPayment` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `account_category` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `organizationId` INTEGER NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `note` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `account_transaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `organizationId` INTEGER NULL,
    `accountId` INTEGER NOT NULL,
    `categoryId` INTEGER NULL,
    `type` ENUM('SALES', 'INCOME', 'EXPENSE', 'TRANSFER_OUT', 'TRANSFER_IN', 'ADJUSTMENT_UP', 'ADJUSTMENT_DOWN', 'OVERRIDE_BALANCE', 'AR_PAYMENT') NOT NULL,
    `amount` DOUBLE NOT NULL,
    `accountBalance` DOUBLE NOT NULL,
    `docNumber` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `note` VARCHAR(191) NULL,
    `docFile` VARCHAR(191) NULL,
    `paymentOrderId` INTEGER NULL,
    `shiftId` INTEGER NULL,
    `createdById` INTEGER NOT NULL,
    `transferPairId` INTEGER NULL,
    `date` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `account` ADD CONSTRAINT `account_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `account_category` ADD CONSTRAINT `account_category_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `account_transaction` ADD CONSTRAINT `account_transaction_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `account_transaction` ADD CONSTRAINT `account_transaction_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `account`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `account_transaction` ADD CONSTRAINT `account_transaction_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `account_category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `account_transaction` ADD CONSTRAINT `account_transaction_paymentOrderId_fkey` FOREIGN KEY (`paymentOrderId`) REFERENCES `orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `account_transaction` ADD CONSTRAINT `account_transaction_shiftId_fkey` FOREIGN KEY (`shiftId`) REFERENCES `shifts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `account_transaction` ADD CONSTRAINT `account_transaction_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `employees`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
