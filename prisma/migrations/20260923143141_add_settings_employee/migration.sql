-- CreateTable
CREATE TABLE `organizations_settings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `currencyCode` VARCHAR(191) NOT NULL DEFAULT 'THB',
    `currencyLabel` VARCHAR(191) NOT NULL DEFAULT 'บาท · THB',
    `businessHours` VARCHAR(191) NOT NULL DEFAULT '08:00 - 22:30',
    `phone` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `receiptFooter` VARCHAR(191) NULL,
    `organizationId` INTEGER NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `organizations_settings_organizationId_key`(`organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employees` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'พนักงาน',
    `pin` VARCHAR(191) NOT NULL,
    `img` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `organizationId` INTEGER NOT NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_permissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `accessPos` BOOLEAN NOT NULL DEFAULT false,
    `accessSettings` BOOLEAN NOT NULL DEFAULT false,
    `accessReports` BOOLEAN NOT NULL DEFAULT false,
    `accessExpenses` BOOLEAN NOT NULL DEFAULT false,
    `cancelRefund` BOOLEAN NOT NULL DEFAULT false,
    `employeeId` INTEGER NOT NULL,

    UNIQUE INDEX `employee_permissions_employeeId_key`(`employeeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `organizations_settings` ADD CONSTRAINT `organizations_settings_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_permissions` ADD CONSTRAINT `employee_permissions_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
