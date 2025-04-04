import {
  reactExtension,
  AdminBlock,
  TextField,
  BlockStack,
} from '@shopify/ui-extensions-react/admin';
import { useState, useEffect } from 'react';

const TARGET = 'admin.product-details.block.render';

export default reactExtension(TARGET, () => <App />);

function App() {
  const [templateId, setTemplateId] = useState('');
  const [productId, setProductId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const product = window.shopify?.admin?.productDetails?.product;
      if (!product?.id) {
        console.log("❌ No product ID found"); 
        return;
      }

      const productId = product.id.split("/").pop(); // grab the numeric ID
      console.log("📦 Product ID:", productId);
      setProductId(productId);

      try {
        const res = await fetch(`/api/product-template/${productId}`, {
          credentials: "include",
        });

        console.log("🌐 Response status:", res.status);
        const data = await res.json();
        console.log("📬 Received data:", data);

        if (data?.templateId) setTemplateId(data.templateId);
      } catch (error) {
        console.error("❌ Error fetching template ID", error);
      }
    };

    fetchData();
  }, []);

  const handleChange = async (val) => {
    setTemplateId(val);
    if (!productId) return;
    await fetch("/api/product-template", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ productId, templateId: val }),
    });
  };

  return (
    <AdminBlock title="Peleman Editor Connection">
      <BlockStack spacing="loose">
        <TextField
          label="Template ID"
          value={templateId}
          onChange={handleChange}
        />
      </BlockStack>
    </AdminBlock>
  );
}
