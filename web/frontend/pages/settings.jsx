import { useState, useEffect } from "react";
import {
  Page,
  Layout,
  TextField,
  Button,
  Toast,
  Frame,
  Card,
  TextContainer,
  Heading,
  FormLayout,
  Stack,
  Badge,
  List,
  Text,
  Box,
} from "@shopify/polaris";
import { useNavigate } from "react-router-dom";

export default function SettingsPage() {
  const [fields, setFields] = useState({
    pie_editor_url: "",
    pie_customer_id: "",
    pie_api_key: "",
    pie_button_label_simple: "",
    pie_button_label_variable: "",
  });

  const [initialFields, setInitialFields] = useState({});
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("untested");
  const [lastTested, setLastTested] = useState(null);
  const navigate = useNavigate();

  const hasChanges = JSON.stringify(fields) !== JSON.stringify(initialFields);

  const handleChange = (field) => (value) => {
    setFields((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/save-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(fields),
      });

      if (res.ok) {
        setToast({ content: "Settings saved", error: false });
        setInitialFields(fields);
      } else {
        setToast({ content: "Failed to save settings", error: true });
      }
    } catch (e) {
      setToast({ content: "Error saving settings", error: true });
    }
    setLoading(false);
  };

  const testConnection = async (override = null) => {
  setTesting(true);
  const values = override || {
    pie_editor_url: fields.pie_editor_url,
    pie_customer_id: fields.pie_customer_id,
    pie_api_key: fields.pie_api_key,
  };

  try {
    const res = await fetch("/api/test-pie-connection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(values),
    });

    const now = new Date().toLocaleString();

    if (res.ok) {
      setToast({ content: "Connection successful 🎉", error: false });
      setConnectionStatus("connected");
      setLastTested(now);
    } else {
      setToast({ content: "Connection failed ❌", error: true });
      setConnectionStatus("failed");
      setLastTested(now);
    }
  } catch (e) {
    setToast({ content: "Error testing connection", error: true });
    setConnectionStatus("failed");
  }

  setTesting(false);
};


  const canTestConnection =
    fields.pie_editor_url && fields.pie_customer_id && fields.pie_api_key;

  useEffect(() => {
    const loadSettings = async () => {
      const res = await fetch("/api/load-settings", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const loaded = {
          pie_editor_url: data.pie_editor_url || "",
          pie_customer_id: data.pie_customer_id || "",
          pie_api_key: data.pie_api_key || "",
          pie_button_label_simple: data.pie_button_label_simple || "",
          pie_button_label_variable: data.pie_button_label_variable || "",
        };
        setFields(loaded);
        setInitialFields(loaded);

        if (
          loaded.pie_editor_url &&
          loaded.pie_customer_id &&
          loaded.pie_api_key
        ) {
          testConnection({
            pie_editor_url: loaded.pie_editor_url,
            pie_customer_id: loaded.pie_customer_id,
            pie_api_key: loaded.pie_api_key,
          });
        }
      }
    };
    loadSettings();
  }, []);

  return (
    <Frame>
      {toast && (
        <Toast
          content={toast.content}
          error={toast.error}
          onDismiss={() => setToast(null)}
        />
      )}

      <Page
        title="PIE App Settings"
        fullWidth
        primaryAction={{
          content: "Save Settings",
          onAction: handleSave,
          loading,
          disabled: !hasChanges || loading,
        }}
        secondaryActions={[
          {
            content: "Cancel and return",
            onAction: () => navigate("/"),
          },
        ]}
      >
        <Layout>
          {/* Main Section */}
          <Layout.Section>
            {/* Editor Settings */}
            <Card title="Peleman Image Editor Connection" sectioned>

              <FormLayout>
                <TextField
                  label="Editor URL"
                  value={fields.pie_editor_url}
                  onChange={handleChange("pie_editor_url")}
                  error={
                    fields.pie_editor_url !== initialFields.pie_editor_url
                      ? "Unsaved change"
                      : undefined
                  }
                />
                <TextField
                  label="Customer ID"
                  value={fields.pie_customer_id}
                  onChange={handleChange("pie_customer_id")}
                  error={
                    fields.pie_customer_id !== initialFields.pie_customer_id
                      ? "Unsaved change"
                      : undefined
                  }
                />
                <TextField
                  label="API Key"
                  value={fields.pie_api_key}
                  onChange={handleChange("pie_api_key")}
                  error={
                    !fields.pie_api_key
                      ? "API Key is required"
                      : fields.pie_api_key !== initialFields.pie_api_key
                      ? "Unsaved change"
                      : undefined
                  }
                />

                <Stack alignment="center" distribution="equalSpacing">
                  <Button
                    onClick={() => testConnection(null)}
                    loading={testing}
                    disabled={!canTestConnection}
                    primary
                  >
                    Test Connection
                  </Button>

                  <Badge
                    status={
                      connectionStatus === "connected"
                        ? "success"
                        : connectionStatus === "failed"
                        ? "critical"
                        : "attention"
                    }
                  >
                    {connectionStatus === "connected"
                      ? "Connected"
                      : connectionStatus === "failed"
                      ? "Not Connected"
                      : "Untested"}
                  </Badge>
                </Stack>
              </FormLayout>
            </Card>


            {/* Button Settings */}
            <Card title="Product Buttons" sectioned>

              <FormLayout>
                <TextField
                  label="Button Label (Simple)"
                  value={fields.pie_button_label_simple}
                  onChange={handleChange("pie_button_label_simple")}
                  error={
                    fields.pie_button_label_simple !==
                    initialFields.pie_button_label_simple
                      ? "Unsaved change"
                      : undefined
                  }
                />
                <TextField
                  label="Button Label (Variable)"
                  value={fields.pie_button_label_variable}
                  onChange={handleChange("pie_button_label_variable")}
                  error={
                    fields.pie_button_label_variable !==
                    initialFields.pie_button_label_variable
                      ? "Unsaved change"
                      : undefined
                  }
                />
              </FormLayout>
            </Card>
          </Layout.Section>

          {/* Sidebar Help */}
          <Layout.Section secondary>
            <Card title="Need help?" sectioned>
              <TextContainer>
                <List>
                  <List.Item>The domain should include `https://`.</List.Item>
                  <List.Item>
                    Your customer ID usually matches your Peleman account name.
                  </List.Item>
                  <List.Item>
                    The API key is unique for every customer. Contact Peleman if you lost yours.
                  </List.Item>
                </List>
              </TextContainer>

              <div style={{ marginTop: "1rem" }}>
                      <Button
                url="https://peleman.com/contact/?ref=shopify"
                external
                variant="primary"
              >
                Contact us
              </Button>
                    </div>
              
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </Frame>
  );
}
