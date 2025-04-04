/*
  Warnings:

  - You are about to drop the column `createdAt` on the `ProductTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `ProductTemplate` table. All the data in the column will be lost.
  - You are about to alter the column `productId` on the `ProductTemplate` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - Added the required column `shop` to the `ProductTemplate` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProductTemplate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "templateId" TEXT NOT NULL
);
INSERT INTO "new_ProductTemplate" ("id", "productId", "templateId") SELECT "id", "productId", "templateId" FROM "ProductTemplate";
DROP TABLE "ProductTemplate";
ALTER TABLE "new_ProductTemplate" RENAME TO "ProductTemplate";
CREATE UNIQUE INDEX "ProductTemplate_shop_productId_key" ON "ProductTemplate"("shop", "productId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
