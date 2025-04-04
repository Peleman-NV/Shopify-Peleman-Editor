import {
  Page,
  Layout,
  Card,
  Text,
  TextContainer,
  Heading,
  List,
  Button,
  Link,
  Stack,
  Toast,
  Frame,
  Image,
  Box,
} from "@shopify/polaris";
import { useEffect, useState } from "react";
import { trophyImage } from "../assets";
import { Link as RouterLink, useNavigate } from "react-router-dom";



export default function HomePage() {
  const [toastActive, setToastActive] = useState(false);
  const [shopSlug, setShopSlug] = useState(null); // ✅ moved inside
  const navigate = useNavigate();

  useEffect(() => {
    const fetchShopSlug = async () => {
      const res = await fetch("/api/shop", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setShopSlug(data.shopSlug);
      }
    };
    fetchShopSlug();
  }, []);
  return (
    <Frame>
      {toastActive && (
        <Toast
          content="Welcome to the Peleman Products Extender"
          onDismiss={() => setToastActive(false)}
        />
      )}

      <Page
        fullWidth
        title="Peleman Products Extender"
        primaryAction={{
          content: "Go to Settings",
          onAction: () => navigate("/settings"),
        }}
      >
        <Layout>
          {/* Left: Main Content with trophy */}
          <Layout.Section>
            <Card sectioned>
              <Stack alignment="center" wrap={false}>
                {/* Text content */}
                <Stack.Item fill>
                  <TextContainer spacing="tight">
                    <Heading>Peleman Products Extender</Heading>

                    <Text as="p">
                      Peleman Products Extender allows you to enhance your product pages with customizable options powered by the Peleman Image Editor.
                    </Text>

                    <Text as="p">With this app, you can:</Text>
                    <List>
                      <List.Item>Add extra options to products when creating or editing them in Shopify</List.Item>
                      <List.Item>Enable customers to personalize their product through the Peleman Editor</List.Item>
                      <List.Item>Replace the default "Add to Cart" button with a "Create Your Product" experience</List.Item>
                    </List>

                    <Heading>Getting started</Heading>
                    <Text as="p">To activate the connection with the Peleman Editor:</Text>
                    <List>
                      <List.Item>
                        Go to the <RouterLink to="/settings">Settings</RouterLink> page of this app
                      </List.Item>
                      <List.Item>Fill in your Peleman API key, domain, and customer ID</List.Item>
                      <List.Item>Once saved, the connection will be established</List.Item>
                    </List>

                    <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
                      <RouterLink to="/settings">
                        <Button>Go to Settings</Button>
                      </RouterLink>
                    </div>

                    <Heading>Connect a product</Heading>
                    <Text as="p">To connect a product with the Peleman Editor:</Text>
                    <List>
                      <List.Item>Edit the product that needs to be connected</List.Item>
                      <List.Item>Fill in the template ID in the Template ID input field</List.Item>
                      <List.Item>Save the product</List.Item>
                      <List.Item>The Add To Cart button will now be replaced with a Create Your Product button</List.Item>
                    </List>

                    {shopSlug && (
                      <div style={{ marginTop: "1rem" }}>  
                        <Button
                          url={`https://admin.shopify.com/store/${shopSlug}/products`}
                        >
                          Go to Products
                        </Button>
                      </div>
                    )}
                  </TextContainer>
                </Stack.Item>

                {/* Trophy image */}
                <Stack.Item>
                  <Image
                    source={trophyImage}
                    alt="Trophy icon"
                  />
                </Stack.Item>
              </Stack>
            </Card>
          </Layout.Section>

          {/* Right: Sidebar info */}
          <Layout.Section secondary>
            <Stack vertical spacing="loose">
              <Card sectioned>
                <TextContainer spacing="tight">
                  <Heading>Peleman Products Extender</Heading>
                  <Stack alignment="baseline" distribution="equalSpacing">
                    <Text as="span" variation="subdued">Version</Text>
                    <Text>1.0.0</Text>
                  </Stack>
                  <Stack alignment="baseline" distribution="equalSpacing">
                    <Text as="span" variation="subdued">Released</Text>
                    <Text>March 25th, 2025</Text>
                  </Stack>
                  <Stack alignment="baseline" distribution="equalSpacing">
                    <Text as="span" variation="subdued">By</Text>
                    <Link url="https://peleman.com" target="_blank" removeUnderline>Peleman Industries</Link>
                  </Stack>
                  <Stack alignment="baseline" distribution="equalSpacing">
                    <Text as="span" variation="subdued">Documentation</Text>
                    <Link url="https://peleman.com" target="_blank" removeUnderline>Manual</Link>
                  </Stack>
                </TextContainer>
              </Card>

              <Card sectioned>
                <TextContainer spacing="tight">
                  <Heading>Changelog</Heading>
                  <Text variant="headingSm">v1.0.0 - March 25th, 2025</Text>
                  <List>
                    <List.Item>Added a plugin settings page</List.Item>
                    <List.Item>Added options for PIE API connection</List.Item>
                    <List.Item>Added main plugin information page</List.Item>
                  </List>
                </TextContainer>
              </Card>
            </Stack>
          </Layout.Section>
        </Layout>
      </Page>
    </Frame>
  );
}
