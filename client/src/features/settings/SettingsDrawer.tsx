import {
  Button,
  Divider,
  Drawer,
  Form,
  Input,
  Select,
  Space,
  message,
} from "antd";
import { useEffect, useMemo, useState } from "react";

import {
  createModel,
  createProvider,
  fetchProviders,
  fetchSettings,
  saveSettings,
  testConnection,
  updateProvider,
  type AiProvider,
} from "../../services/aiCatalog";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function SettingsDrawer({ open, onClose }: Props) {
  const [form] = Form.useForm();
  const [providers, setProviders] = useState<AiProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  const selectedProviderId = Form.useWatch("provider_id", form);
  const selectedModelId = Form.useWatch("model_id", form);

  const selectedProvider = useMemo(
    () => providers.find((p) => p.id === selectedProviderId),
    [providers, selectedProviderId]
  );

  const modelOptions = useMemo(() => {
    return (selectedProvider?.ai_models || []).map((m) => ({
      label: `${m.name} (${m.model_name})`,
      value: m.id,
    }));
  }, [selectedProvider]);

  useEffect(() => {
    if (open) {
      setLoading(true);
      Promise.all([fetchProviders(), fetchSettings()])
        .then(([pRes, sRes]) => {
          const normalizedProviders = pRes.data.data.map((p) => ({
            ...p,
            id: Number(p.id),
            ai_models: (p.ai_models || []).map((m) => ({
              ...m,
              id: Number(m.id),
              provider_id: Number(m.provider_id),
            })),
          }));
          setProviders(normalizedProviders);
          const settings = sRes.data.data
            ? {
                ...sRes.data.data,
                default_provider_id: sRes.data.data.default_provider_id
                  ? Number(sRes.data.data.default_provider_id)
                  : null,
                default_model_id: sRes.data.data.default_model_id
                  ? Number(sRes.data.data.default_model_id)
                  : null,
              }
            : null;
          const providerId = settings?.default_provider_id ?? normalizedProviders[0]?.id;
          const provider = normalizedProviders.find((p) => p.id === providerId);
          const modelId =
            settings?.default_model_id ?? provider?.ai_models?.[0]?.id ?? null;
          form.setFieldsValue({
            provider_id: providerId ?? null,
            model_id: modelId ?? null,
            api_key: provider?.api_key || "",
            base_url: provider?.base_url || "",
          });
        })
        .catch((err) => {
          message.error(err instanceof Error ? err.message : "加载配置失败");
        })
        .finally(() => setLoading(false));
    }
  }, [open, form]);

  const handleSave = async () => {
    const values = await form.validateFields();
    if (!values.provider_id || !values.model_id) {
      message.error("请选择供应商和模型");
      return;
    }
    await updateProvider(values.provider_id, { api_key: values.api_key });
    await saveSettings({
      default_provider_id: values.provider_id,
      default_model_id: values.model_id,
    });
    message.success("设置已保存到后端");
    onClose();
  };

  return (
    <Drawer title="系统设置" open={open} onClose={onClose} size="large">
      <Form layout="vertical" form={form} disabled={loading}>
        <Form.Item label="供应商" name="provider_id" rules={[{ required: true }]}>
          <Select
            placeholder="选择供应商"
            options={providers.map((p) => ({ label: p.name, value: p.id }))}
            onChange={(val) => {
              const provider = providers.find((p) => p.id === val);
              form.setFieldsValue({
                api_key: provider?.api_key || "",
                base_url: provider?.base_url || "",
                model_id: provider?.ai_models?.[0]?.id ?? null,
              });
            }}
          />
        </Form.Item>

        <Form.Item label="模型" name="model_id" rules={[{ required: true }]}>
          <Select placeholder="选择模型" options={modelOptions} />
        </Form.Item>

        <Form.Item label="API Key" name="api_key">
          <Input.Password placeholder="请输入 API Key" />
        </Form.Item>

        <Form.Item label="Base URL">
          <Input value={selectedProvider?.base_url || ""} disabled />
        </Form.Item>

        <Space>
          <Button type="primary" onClick={handleSave}>
            保存到后端
          </Button>
          <Button
            onClick={async () => {
              if (!selectedProviderId || !selectedModelId) {
                message.error("请选择供应商与模型");
                return;
              }
              setTesting(true);
              try {
                const res = await testConnection({
                  provider_id: selectedProviderId,
                  model_id: selectedModelId,
                });
                message.success(`连接成功，延迟 ${res.data.latency_ms} ms`);
              } catch (err) {
                message.error(err instanceof Error ? err.message : "连接失败");
              } finally {
                setTesting(false);
              }
            }}
            loading={testing}
          >
            测试连接
          </Button>
        </Space>

        <Divider />

        <Form.Item label="新增自定义供应商">
          <Space direction="vertical" style={{ width: "100%" }}>
            <Input
              placeholder="供应商名称"
              value={form.getFieldValue("custom_provider_name")}
              onChange={(e) => form.setFieldsValue({ custom_provider_name: e.target.value })}
            />
            <Input
              placeholder="Base URL"
              value={form.getFieldValue("custom_provider_base_url")}
              onChange={(e) => form.setFieldsValue({ custom_provider_base_url: e.target.value })}
            />
            <Input.Password
              placeholder="API Key（可选）"
              value={form.getFieldValue("custom_provider_key")}
              onChange={(e) => form.setFieldsValue({ custom_provider_key: e.target.value })}
            />
            <Button
              onClick={async () => {
                const values = form.getFieldsValue();
                const name = values.custom_provider_name;
                const base_url = values.custom_provider_base_url;
                const api_key = values.custom_provider_key;
                if (!name || !base_url) {
                  message.error("请填写供应商名称与 Base URL");
                  return;
                }
                const res = await createProvider({ name, base_url, api_key });
                const list = await fetchProviders();
                const normalized = list.data.data.map((p) => ({
                  ...p,
                  id: Number(p.id),
                  ai_models: (p.ai_models || []).map((m) => ({
                    ...m,
                    id: Number(m.id),
                    provider_id: Number(m.provider_id),
                  })),
                }));
                setProviders(normalized);
                form.setFieldsValue({
                  provider_id: res.data.data.id,
                  model_id: null,
                  api_key: api_key || "",
                  base_url,
                  custom_provider_name: "",
                  custom_provider_base_url: "",
                  custom_provider_key: "",
                });
                message.success("供应商已创建");
              }}
            >
              添加供应商
            </Button>
          </Space>
        </Form.Item>

        <Form.Item label="新增自定义模型">
          <Space direction="vertical" style={{ width: "100%" }}>
            <Input
              placeholder="模型显示名"
              value={form.getFieldValue("custom_model_name")}
              onChange={(e) => form.setFieldsValue({ custom_model_name: e.target.value })}
            />
            <Input
              placeholder="模型标识（model_name）"
              value={form.getFieldValue("custom_model_id")}
              onChange={(e) => form.setFieldsValue({ custom_model_id: e.target.value })}
            />
            <Button
              onClick={async () => {
                if (!selectedProviderId) {
                  message.error("请先选择供应商");
                  return;
                }
                const values = form.getFieldsValue();
                const name = values.custom_model_name;
                const model_name = values.custom_model_id;
                if (!name || !model_name) {
                  message.error("请填写模型名称与标识");
                  return;
                }
                await createModel({
                  provider_id: selectedProviderId,
                  name,
                  model_name,
                });
                const list = await fetchProviders();
                const normalized = list.data.data.map((p) => ({
                  ...p,
                  id: Number(p.id),
                  ai_models: (p.ai_models || []).map((m) => ({
                    ...m,
                    id: Number(m.id),
                    provider_id: Number(m.provider_id),
                  })),
                }));
                setProviders(normalized);
                form.setFieldsValue({
                  custom_model_name: "",
                  custom_model_id: "",
                });
                message.success("模型已创建");
              }}
            >
              添加模型
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Drawer>
  );
}
