-- CreateTable
CREATE TABLE "ShopSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "pie_editor_url" TEXT NOT NULL,
    "pie_customer_id" TEXT NOT NULL,
    "pie_api_key" TEXT NOT NULL,
    "pie_button_label_simple" TEXT NOT NULL,
    "pie_button_label_variable" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopSettings_shop_key" ON "ShopSettings"("shop");
