/*
  Warnings:

  - You are about to alter the column `productId` on the `ProductTemplate` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProductTemplate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "productId" BIGINT NOT NULL,
    "templateId" TEXT NOT NULL
);
INSERT INTO "new_ProductTemplate" ("id", "productId", "shop", "templateId") SELECT "id", "productId", "shop", "templateId" FROM "ProductTemplate";
DROP TABLE "ProductTemplate";
ALTER TABLE "new_ProductTemplate" RENAME TO "ProductTemplate";
CREATE UNIQUE INDEX "ProductTemplate_shop_productId_key" ON "ProductTemplate"("shop", "productId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
