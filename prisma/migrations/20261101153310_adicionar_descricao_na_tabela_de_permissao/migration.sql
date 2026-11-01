/*
  Warnings:

  - Added the required column `description` to the `permissions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "permissions" ADD COLUMN     "description" VARCHAR(200) NOT NULL;
