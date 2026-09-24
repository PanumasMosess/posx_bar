/*
  Warnings:

  - A unique constraint covering the columns `[pin]` on the table `employees` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `employees_pin_key` ON `employees`(`pin`);
