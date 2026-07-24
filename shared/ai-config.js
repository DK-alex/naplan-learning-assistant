export const AI_PROVIDERS = {
  openai: {
    id: "openai",
    name: "OpenAI",
    defaultModel: "gpt-5.6-sol",
    defaultBaseUrl: "https://api.openai.com/v1",
    models: [
      { value: "gpt-5.6-sol", label: "GPT-5.6 Sol" },
      { value: "gpt-5.6-terra", label: "GPT-5.6 Terra" },
      { value: "gpt-5.6-luna", label: "GPT-5.6 Luna" },
    ],
  },
  google: {
    id: "google",
    name: "Google Gemini",
    defaultModel: "gemini-3.5-flash",
    defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta",
    models: [
      { value: "gemini-3.5-flash", label: "Gemini 3.5 Flash" },
      { value: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash-Lite" },
      { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
    ],
  },
  qwen: {
    id: "qwen",
    name: "Qwen",
    defaultModel: "qwen3.6-plus",
    defaultBaseUrl: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    models: [
      { value: "qwen3.6-plus", label: "Qwen 3.6 Plus" },
      { value: "qwen-plus", label: "Qwen Plus" },
      { value: "qwen-max", label: "Qwen Max" },
    ],
  },
  deepseek: {
    id: "deepseek",
    name: "DeepSeek",
    defaultModel: "deepseek-v4-pro",
    defaultBaseUrl: "https://api.deepseek.com",
    models: [
      { value: "deepseek-v4-pro", label: "DeepSeek V4 Pro" },
      { value: "deepseek-v4-flash", label: "DeepSeek V4 Flash" },
      { value: "deepseek-chat", label: "DeepSeek Chat (legacy)" },
      { value: "deepseek-reasoner", label: "DeepSeek Reasoner (legacy)" },
    ],
  },
};

export const DEFAULT_AI_PROVIDER = "openai";

export function getAiProvider(providerId) {
  return AI_PROVIDERS[providerId] || AI_PROVIDERS[DEFAULT_AI_PROVIDER];
}

export function normaliseBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

export function isAllowedProviderBaseUrl(providerId, rawBaseUrl) {
  let url;
  try {
    url = new URL(normaliseBaseUrl(rawBaseUrl));
  } catch {
    return false;
  }

  if (url.protocol !== "https:" || url.username || url.password || url.port) return false;

  if (providerId === "openai") {
    return url.hostname === "api.openai.com" && url.pathname === "/v1";
  }
  if (providerId === "google") {
    return url.hostname === "generativelanguage.googleapis.com" && ["/v1beta", "/v1"].includes(url.pathname);
  }
  if (providerId === "deepseek") {
    return url.hostname === "api.deepseek.com" && ["/", "/v1"].includes(url.pathname);
  }
  if (providerId === "qwen") {
    return (
      (url.hostname === "dashscope.aliyuncs.com" || url.hostname.endsWith(".aliyuncs.com"))
      && url.pathname.toLowerCase().includes("/compatible-mode/v1")
    );
  }
  return false;
}

export function createDefaultAiSettings() {
  const provider = getAiProvider(DEFAULT_AI_PROVIDER);
  return {
    aiProvider: provider.id,
    aiModel: provider.defaultModel,
    aiBaseUrl: provider.defaultBaseUrl,
  };
}
