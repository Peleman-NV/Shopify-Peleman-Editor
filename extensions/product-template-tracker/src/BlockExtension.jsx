import { useEffect, useMemo, useState } from "react";
import {
  AdminBlock,
  Box,
  Button,
  Divider,
  Form,
  Icon,
  InlineStack,
  ProgressIndicator,
  Select,
  Text,
  reactExtension,
  useApi,
  Badge,
} from "@shopify/ui-extensions-react/admin";

import { getTemplates, updateTemplates } from "./utils";

// The target used here must match the target used in the extension's .toml file at ./shopify.extension.toml
const TARGET = "admin.product-details.block.render";
export default reactExtension(TARGET, () => <App />);

const PAGE_SIZE = 3;

function App() {
  const { navigation, data, i18n } = useApi(TARGET);
  const [loading, setLoading] = useState(true);
  const [initialValues, setInitialValues] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const productId = data.selected[0].id;
  const templatesCount = templates.length;
  const totalPages = templatesCount / PAGE_SIZE;
  const [variantTemplates, setVariantTemplates] = useState([]);

  useEffect(() => {
    (async function getProductInfo() {
      // Load the product's metafield of type Templates
      const productData = await getTemplates(productId);

      setLoading(false);
      if (productData?.data?.product?.metafield?.value) {
        const parsedTemplates = JSON.parse(
          productData.data.product.metafield.value
        );
        setInitialValues(
          parsedTemplates.map(({ completed }) => Boolean(completed))
        );
        setTemplates(parsedTemplates);

        // 🔽 add this:
        setVariantTemplates(parsedTemplates[0]?.variants || []);
      }
    })();
  }, []);

  const paginatedTemplates = useMemo(() => {
    if (templatesCount <= PAGE_SIZE) {
      // It's not necessary to paginate if there are fewer Templates than the page size
      return templates;
    }

    // Slice the array after the last item of the previous page
    return [...templates].slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE
    );
  }, [templates, currentPage]);

  // const handleChange = async (id, value) => {
  //   // Update the local state of the extension to reflect changes
  //   setTemplates((currentTemplates) => {
  //     // Create a copy of the array so that you don't mistakenly mutate the state
  //     const newTemplates = [...currentTemplates];
  //     // Find the index of the issue that you're interested in
  //     const editingIssueIndex = newTemplates.findIndex(
  //       (listIssue) => listIssue.id == id
  //     );
  //     // Overwrite that item with the new value
  //     newTemplates[editingIssueIndex] = {
  //       // Spread the previous item to retain the values that you're not changing
  //       ...newTemplates[editingIssueIndex],
  //       // Update the completed value
  //       completed: value === "completed" ? true : false,
  //     };
  //     return newTemplates;
  //   });
  // };

  const handleDelete = async (id) => {
    // Create a new array of Templates, leaving out the one that you're deleting
    const newTemplates = templates.filter((issue) => issue.id !== id);
    // Save to the local state
    setTemplates(newTemplates);
    // Commit changes to the database
    await updateTemplates(productId, newTemplates);
  };

  const onSubmit = async () => {
    // Commit changes to the database
    await updateTemplates(productId, templates);
  };

  const onReset = () => {};

  return loading ? (
    <InlineStack blockAlignment='center' inlineAlignment='center'>
      <ProgressIndicator size="large-100" />
    </InlineStack>
  ) : (
    <AdminBlock
      // Translate the block title with the i18n API, which uses the strings in the locale files
      title={i18n.translate("name")}
    >
      <Form id={`templates-form`} onSubmit={onSubmit} onReset={onReset}>
        {templates.length ? (
          <>
            {paginatedTemplates.map(
              ({ id, title, colorCode, imageUploadsEnabled, minImagesUpload, maxImagesUpload }, index) => {
                return (
                  <>
                    {index > 0 && <Divider />}
                    <Box key={id} padding="base small">
                      <InlineStack
                        blockAlignment="center"
                        inlineSize="100%"
                        gap="large"
                      >
                        <Box inlineSize="25%">
                          <Box inlineSize="100%">
                            <Text fontWeight="bold" textOverflow="ellipsis">Template</Text>
                            <Text textOverflow="ellipsis">{title}</Text>
                          </Box>
                        </Box>

                        <Box inlineSize="25%">
                          <Box inlineSize="100%">
                            <Text fontWeight="bold" textOverflow="ellipsis">Color Code</Text>
                            <Text textOverflow="ellipsis">
                              {colorCode || "-"}
                            </Text>
                          </Box>
                        </Box>

                        <Box inlineSize="25%">
                          <Box inlineSize="100%">
                            <Text fontWeight="bold" textOverflow="ellipsis">Image Uploads</Text>

                              {imageUploadsEnabled ? (
                                <Text textOverflow="ellipsis"><Badge tone="success">Enabled</Badge>&nbsp;&nbsp;{minImagesUpload || "-"}
                                     - 
                                    {maxImagesUpload || "-"} images</Text>
                              ) : (
                                <Text textOverflow="ellipsis">-</Text>
                              )}
                              
                          </Box>
                        </Box>

                        <Box inlineSize="25%">
                          <InlineStack
                            inlineSize="100%"
                            blockAlignment="center"
                            inlineAlignment="end"
                            gap="base"
                          >
                            <Button
                              variant="tertiary"
                              onPress={() =>
                                navigation?.navigate(
                                  `extension:product-template-fields?issueId=${id}`
                                )
                              }
                            >
                              <Icon name="EditMinor" />
                            </Button>
                            <Button
                              onPress={() => handleDelete(id)}
                              variant="tertiary"
                            >
                              <Icon name="DeleteMinor" />
                            </Button>
                          </InlineStack>
                        </Box>
                      </InlineStack>
                    </Box>
                  </>
                );
              }
            )}
            <Divider />

            {/*<InlineStack
              paddingBlockStart="large"
              blockAlignment="center"
              inlineAlignment="center"
            >
              <Button
                onPress={() => setCurrentPage((prev) => prev - 1)}
                disabled={currentPage === 1}
              >
                <Icon name="ChevronLeftMinor" />
              </Button>
              <InlineStack
                inlineSize={25}
                blockAlignment="center"
                inlineAlignment="center"
              >
                <Text>{currentPage}</Text>
              </InlineStack>
              <Button
                onPress={() => setCurrentPage((prev) => prev + 1)}
                disabled={currentPage >= totalPages}
              >
                <Icon name="ChevronRightMinor" />
              </Button>
            </InlineStack>*/}
          </>
        ) : (
          <>
            <Box paddingBlockEnd="large">
              <Text fontWeight="bold">This product doesn’t have a template connected.</Text>
            </Box>
            <Button
              onPress={() => navigation?.navigate(`extension:product-template-fields`)}
            >
              Add a template
            </Button>
          </>
        )}

        {variantTemplates.length > 0 && (
  <>
    <Box paddingBlockStart="large">
      <Text fontWeight="bold">Variant-specific templates</Text>
    </Box>

    {variantTemplates.map(
      ({ variantId, title, colorCode, imageUploadsEnabled, minImagesUpload, maxImagesUpload }) => (
        <>
          <Divider />
          <Box key={variantId} padding="base small">
            <InlineStack
              blockAlignment="center"
              inlineSize="100%"
              gap="large"
            >
              <Box inlineSize="25%">
                <Text fontWeight="bold" textOverflow="ellipsis">Variant ID</Text>
                <Text textOverflow="ellipsis">{variantId}</Text>
              </Box>

              <Box inlineSize="25%">
                <Text fontWeight="bold" textOverflow="ellipsis">Template</Text>
                <Text textOverflow="ellipsis">{title || "-"}</Text>
              </Box>

              <Box inlineSize="25%">
                <Text fontWeight="bold" textOverflow="ellipsis">Color Code</Text>
                <Text textOverflow="ellipsis">{colorCode || "-"}</Text>
              </Box>

              <Box inlineSize="25%">
                <Text fontWeight="bold" textOverflow="ellipsis">Image Uploads</Text>
                {imageUploadsEnabled ? (
                  <Text textOverflow="ellipsis">
                    <Badge tone="success">Enabled</Badge>&nbsp;&nbsp;
                    {minImagesUpload || "-"} - {maxImagesUpload || "-"} images
                  </Text>
                ) : (
                  <Text textOverflow="ellipsis">-</Text>
                )}
              </Box>
            </InlineStack>
          </Box>
        </>
      )
    )}
  </>
)}

      </Form>
    </AdminBlock>
  );
}
