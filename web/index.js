// @ts-check
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";
import shopify from "./shopify.js";

import productCreator from "./product-creator.js";
import PrivacyWebhookHandlers from "./privacy.js";

import fetch from "node-fetch";
import FormData from "form-data";

import cors from 'cors';

const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "3000",
  10
);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();


app.use(cors({
   origin: 'https://dev-peleman.myshopify.com',
   methods: ['GET', 'POST'],
   allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use("/api", shopify.validateAuthenticatedSession());
// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: PrivacyWebhookHandlers })
);

// If you are adding routes outside of the /api path, remember to
// also add a proxy rule for them in web/frontend/vite.config.js

app.use("/api/*", shopify.validateAuthenticatedSession());

app.use(express.json());

app.get("/api/products/count", async (_req, res) => {
  const client = new shopify.api.clients.Graphql({
    session: res.locals.shopify.session,
  });

  const countData = await client.request(`
    query shopifyProductCount {
      productsCount {
        count
      }
    }
  `);

  res.status(200).send({ count: countData.data.productsCount.count });
});

app.post("/api/products", async (_req, res) => {
  let status = 200;
  let error = null;

  try {
    await productCreator(res.locals.shopify.session);
  } catch (e) {
    console.log(`Failed to process products/create: ${e.message}`);
    status = 500;
    error = e.message;
  }
  res.status(status).send({ success: status === 200, error });
});

app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Save settings
app.post("/api/save-settings", express.json(), async (req, res) => {
  try {
    // console.log("🔄 Incoming settings save request...");
    const session = res.locals.shopify.session;

    if (!session?.shop) {
      console.error("❌ Session or shop not found");
      return res.status(401).send("Unauthorized");
    }

    // console.log("✅ Session loaded for shop:", session.shop);

    await prisma.shopSettings.upsert({
      where: { shop: session.shop },
      update: req.body,
      create: { shop: session.shop, ...req.body },
    });

    res.status(200).send({ success: true });
  } catch (err) {
    console.error("❌ Failed to save settings to DB", err);
    res.status(500).send("Error saving settings");
  }
});

// Load settings
app.get("/api/load-settings", async (req, res) => {
  try {
    const session = res.locals.shopify.session; // 🛠️ Make sure this is at the top!
    
    if (!session?.shop) {
      return res.status(401).send("Unauthorized");
    }

    // console.log("📥 Loading settings for:", session.shop);

    const settings = await prisma.shopSettings.findUnique({
      where: { shop: session.shop },
    });

    // console.log("📦 Loaded settings:", settings);

    res.status(200).send(settings || {});
  } catch (err) {
    console.error("❌ Failed to load settings", err);
    res.status(500).send("Error loading settings");
  }
});

// Test button in app settings to test Editor Connection
app.post("/api/test-pie-connection", express.json(), async (req, res) => {
  const { pie_editor_url, pie_customer_id, pie_api_key } = req.body;

  if (!pie_editor_url || !pie_customer_id || !pie_api_key) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const formData = new FormData();
    formData.append("c", pie_customer_id);
    formData.append("a", pie_api_key);

    const response = await fetch(`${pie_editor_url}/editor/api/checkcredentials.php`, {
      method: "POST",
      body: formData,
    });

    const text = await response.text();

    // Handle plain string response or JSON depending on the API
    if (text.includes("Success")) {
      return res.status(200).json({ result: "OK" });
    } else {
      return res.status(401).json({ result: "Invalid credentials", raw: text });
    }
  } catch (error) {
    console.error("❌ Connection test failed:", error);
    return res.status(500).json({ error: "Connection test failed" });
  }
});

app.get("/api/shop", async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    if (!session?.shop) {
      return res.status(401).send("Unauthorized");
    }

    const shopDomain = session.shop; // e.g. "dev-peleman.myshopify.com"
    const shopSlug = shopDomain.split(".")[0]; // → "dev-peleman"

    res.status(200).json({ shopSlug });
  } catch (err) {
    console.error("❌ Failed to get shop slug", err);
    res.status(500).send("Error getting shop");
  }
});

// App Proxy Route Handler
app.post('/apps/app-proxy', async (req, res) => {
  const { shop, productId, templateId } = req.body;
  console.log("Received data:", req.body);

  if (!shop || !productId || !templateId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Save the templateId to the database using Prisma

// Save the templateId to the database using Prisma
    const productTemplate = await prisma.productTemplate.upsert({
      where: {
        shop_product: {
          shop: shop,
          productId: productId,
        },
      },
      update: {
        templateId: templateId,
      },
      create: {
        shop: shop,
        productId: productId,
        templateId: templateId,
      },
    });
    
    // console.log("Template ID saved to database:", productTemplate);
    res.json({ success: true, message: "Template ID saved" });
  } catch (error) {
    console.error("❌ Failed to save template ID", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// App Proxy Route Handler
app.post('/api/proxy', (req, res) => {
  const { shop, productId, templateId } = req.body;
  console.log("Received data:", req.body);
  
  // Handle saving the templateId (logic goes here)
  
  res.json({ success: true, message: "Template ID saved" });
});

// Proxy endpoint for saving the template ID
app.post('/api/save-template-id', async (req, res) => {
  const { shop, productId, templateId } = req.body;

  if (!shop || !productId || !templateId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Shopify API endpoint
    const url = `https://${shop}/admin/api/2025-01/products/${productId}/metafields.json`;

    // Prepare the data for the metafield
    const metafieldData = {
      metafield: {
        namespace: 'peleman_editor',
        key: 'template_id',
        value: templateId,
        value_type: 'string',
      },
    };

    // Make the request to the Shopify Admin API to create or update the metafield
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': 'your-shopify-access-token', // Add your Shopify access token here
      },
      body: JSON.stringify(metafieldData),
    });

    const jsonResponse = await response.json();

    if (response.ok) {
      // Optionally store the template ID in your database
      await prisma.productTemplate.upsert({
        where: { productId: Number(productId) },
        update: { templateId },
        create: { productId: Number(productId), templateId },
      });

      return res.status(200).json({ success: true, message: 'Template ID saved successfully' });
    } else {
      return res.status(500).json({ error: jsonResponse.errors });
    }
  } catch (error) {
    console.error('Error saving template ID to Shopify', error);
    return res.status(500).json({ error: 'Error saving template ID' });
  }
});

app.post('/api/app-proxy', async (req, res) => {
  const { shop, productId, templateId } = req.body;

  if (!shop || !productId || !templateId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await prisma.productTemplate.upsert({
      where: {
        shop_product: {
          shop,
          productId: Number(productId),
        },
      },
      update: { templateId },
      create: {
        shop,
        productId: Number(productId),
        templateId,
      },
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Failed to save to DB", err);
    return res.status(500).json({ error: 'DB save failed' });
  }
});

app.get("/*", shopify.ensureInstalledOnShop(), async (_req, res) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(
      readFileSync(join(STATIC_PATH, "index.html"))
        .toString()
        .replace("%VITE_SHOPIFY_API_KEY%", process.env.SHOPIFY_API_KEY || "")
    );
});

app.listen(PORT);