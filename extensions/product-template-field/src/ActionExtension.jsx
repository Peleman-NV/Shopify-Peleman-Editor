import { useCallback, useEffect, useState } from "react";
import {
  reactExtension,
  useApi,
  TextField,
  NumberField,
  Checkbox,
  AdminAction,
  Button,
  BlockStack,
  InlineStack,
  Box,
  Text,
  Heading,
  HeadingGroup,
  Divider,
} from "@shopify/ui-extensions-react/admin";
import { getTemplates, updateTemplates } from "./utils";

function generateId(allTemplates) {
  return !allTemplates?.length ? 0 : allTemplates[allTemplates.length - 1].id + 1;
}

// Place this at the top of your file or in a shared component file
function SectionBlock({ title, description, children }) {
  return (
    <Box paddingBlockStart="extraLoose" paddingBlockEnd="extraLoose">
      <BlockStack spacing="tight">
        <Text fontWeight="bold">{title}</Text>
        {description && <Text size="small">{description}</Text>}
        <Divider />

        <Box paddingBlockStart="base">{children}</Box>
      </BlockStack>
    </Box>
  );
}

function validateForm({ title, imageUploadsEnabled, minImagesUpload, maxImagesUpload }) {
  const errors = {
    title: !title,
  };

  const isNumber = (value) => /^\d+$/.test(value);

  if (imageUploadsEnabled) {
    if (!minImagesUpload) {
      errors.minImagesUpload = "Please enter a minimum value";
    } else if (!isNumber(minImagesUpload)) {
      errors.minImagesUpload = "Please enter only numbers";
    }

    if (!maxImagesUpload) {
      errors.maxImagesUpload = "Please enter a maximum value";
    } else if (!isNumber(maxImagesUpload)) {
      errors.maxImagesUpload = "Please enter only numbers";
    }

    if (
      isNumber(minImagesUpload) &&
      isNumber(maxImagesUpload) &&
      Number(maxImagesUpload) < Number(minImagesUpload)
    ) {
      errors.maxImagesUpload = "Maximum must be greater than or equal to minimum";
    }
  }

  const isValid = Object.values(errors).every((val) => !val);

  return { isValid, errors };
}

const TARGET = "admin.product-details.action.render";

export default reactExtension(TARGET, () => <App />);

function App() {
  const { close, data } = useApi(TARGET);

  const [template, setTemplate] = useState({
    title: "",
    colorCode: "",
    imageUploadsEnabled: "",
    minImagesUpload: "",
    maxImagesUpload: "",
  });

  const [variantTemplates, setVariantTemplates] = useState([]);
  const [variants, setVariants] = useState([]);
  const [allTemplates, setAllTemplates] = useState([]);
  const [formErrors, setFormErrors] = useState(null);
  const [collapsedVariants, setCollapsedVariants] = useState({});

  const { title, colorCode, imageUploadsEnabled, minImagesUpload, maxImagesUpload } = template;

  const toggleVariant = (variantId) => {
    setCollapsedVariants((prev) => ({
      ...prev,
      [variantId]: !prev[variantId],
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      const productId = data.selected[0].id;

      const templates = await getTemplates(productId);
      const existing = templates?.[0];

      if (existing) {
        setTemplate({
          title: existing.title || "",
          colorCode: existing.colorCode || "",
          imageUploadsEnabled: existing.imageUploadsEnabled ?? false,
          minImagesUpload: existing.minImagesUpload?.toString() || "",
          maxImagesUpload: existing.maxImagesUpload?.toString() || "",
        });

        setVariantTemplates(existing.variants || []);
      }

      setAllTemplates(templates || []);

      // Fetch product variants
      const res = await fetch("shopify:admin/api/graphql.json", {
        method: "POST",
        body: JSON.stringify({
          query: `
            query GetVariants($id: ID!) {
              product(id: $id) {
                variants(first: 50) {
                  edges {
                    node {
                      id
                      title
                    }
                  }
                }
              }
            }
          `,
          variables: { id: productId },
        }),
      });

      const json = await res.json();
      const fetchedVariants = json.data.product.variants.edges.map((edge) => edge.node);
      setVariants(fetchedVariants);
    };

    fetchData();
  }, [data.selected]);

  const onSubmit = useCallback(async () => {
    const { isValid, errors } = validateForm(template);
    setFormErrors(errors);

    if (!isValid) return;

    const existing = allTemplates?.[0];

    const updatedTemplate = {
      ...(existing ? { id: existing.id } : { id: generateId(allTemplates) }),
      ...template,
      variants: variantTemplates,
    };

    await updateTemplates(data.selected[0].id, [updatedTemplate]);
    close();
  }, [template, variantTemplates, data.selected, allTemplates, close]);

  return (
    <AdminAction
      title="Add a template ID"
      primaryAction={<Button onPress={onSubmit}>Save changes</Button>}
      secondaryAction={<Button onPress={close}>Cancel</Button>}
    >
      <SectionBlock
        title="Global product template"
        description="These settings apply to the product & all variants by default."
      >

        {/* Global Template Settings */}
        <TextField
          label="Template ID"
          value={title}
          error={formErrors?.title ? "Please enter a template ID" : undefined}
          onChange={(val) => setTemplate((prev) => ({ ...prev, title: val }))}
        />

        <Box paddingBlockStart="base" />

        <TextField
          label="Color Code (optional)"
          value={colorCode}
          onChange={(val) => setTemplate((prev) => ({ ...prev, colorCode: val }))}
        />

        <Box paddingBlockStart="base" />

        <Checkbox
          label="Use image uploads (optional)"
          checked={imageUploadsEnabled}
          onChange={(val) =>
            setTemplate((prev) => ({
              ...prev,
              imageUploadsEnabled: val,
              minImagesUpload: val ? "0" : "",
              maxImagesUpload: val ? "150" : "",
            }))
          }
        />

        {imageUploadsEnabled && (
          <>
            <Box paddingBlockStart="base" />
            <NumberField
              label="Minimum images for upload (required)"
              step="1"
              min={0}
              value={minImagesUpload}
              error={formErrors?.minImagesUpload || undefined}
              onChange={(val) => setTemplate((prev) => ({ ...prev, minImagesUpload: val }))}
            />

            <Box paddingBlockStart="base" />
            <NumberField
              label="Maximum images for upload (required)"
              step="1"
              min={1}
              value={maxImagesUpload}
              error={formErrors?.maxImagesUpload || undefined}
              onChange={(val) => setTemplate((prev) => ({ ...prev, maxImagesUpload: val }))}
            />
          </>
        )}

      </SectionBlock>

      {/* Variant-specific Template Overrides */}
      {variants.length > 0 && (
        <>
          <Box paddingBlockStart="large" />
          <Box paddingBlockStart="large" />

          <SectionBlock
            title="Variant-specific templates"
            description="Apply different settings to each variation"
          >

            {variants.map((variant) => {
              const current = variantTemplates.find((v) => v.variantId === variant.id) || {};
              const isOpen = collapsedVariants[variant.id] ?? false;

              const updateVariant = (changes) => {
                setVariantTemplates((prev) => {
                  const existing = prev.find((v) => v.variantId === variant.id) || {};
                  const others = prev.filter((v) => v.variantId !== variant.id);
                  return [...others, { ...existing, variantId: variant.id, ...changes }];
                });
              };

              return (
                <Box key={variant.id} paddingBlockStart="base">
                  <Button
                    onPress={() => toggleVariant(variant.id)}
                    variant="tertiary"
                    size="slim"
                  >
                    {isOpen ? "▼" : "▶"} {variant.title}
                  </Button>

                  {isOpen && (
                    <BlockStack spacing="base">
                      <TextField
                        label="Template ID"
                        value={current.title || ""}
                        onChange={(val) => updateVariant({ title: val })}
                      />

                      <TextField
                        label="Color Code"
                        value={current.colorCode || ""}
                        onChange={(val) => updateVariant({ colorCode: val })}
                      />

                      <Checkbox
                        label="Use image uploads"
                        checked={current.imageUploadsEnabled || false}
                        onChange={(val) =>
                          updateVariant({
                            imageUploadsEnabled: val,
                            minImagesUpload: val ? "0" : "",
                            maxImagesUpload: val ? "150" : "",
                          })
                        }
                      />

                      {current.imageUploadsEnabled && (
                        <>
                          <NumberField
                            label="Min images"
                            step="1"
                            value={current.minImagesUpload || ""}
                            onChange={(val) => updateVariant({ minImagesUpload: val })}
                          />

                          <NumberField
                            label="Max images"
                            step="1"
                            value={current.maxImagesUpload || ""}
                            onChange={(val) => updateVariant({ maxImagesUpload: val })}
                          />
                        </>
                      )}
                    </BlockStack>
                  )}
                </Box>
              );

            })}
          </SectionBlock>
        </>
      )}
    </AdminAction>
  );
}
