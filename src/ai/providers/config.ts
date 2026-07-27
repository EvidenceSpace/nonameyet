import type { AiProvider } from "../provider.js";
import { requireServerCredential, ProviderConfigurationError } from "../provider.js";
import { OpenAiCompatibleProvider, type FetchLike } from "./openai-compatible.js";
export function providerFromEnvironment(environment: Record<string,string|undefined>,fetchImpl?:FetchLike):AiProvider|undefined{
  const hasKey=!!environment.AI_API_KEY?.trim(),hasModel=!!environment.AI_MODEL?.trim();if(!hasKey&&!hasModel)return undefined;if(!hasKey||!hasModel)throw new ProviderConfigurationError("AI_API_KEY and AI_MODEL must be configured together.");
  const base=(environment.AI_BASE_URL?.trim()||"https://api.openai.com/v1").replace(/\/+$/,"");const args={endpoint:`${base}/chat/completions`,model:requireServerCredential(environment,"AI_MODEL"),apiKey:requireServerCredential(environment,"AI_API_KEY")};return fetchImpl?new OpenAiCompatibleProvider({...args,fetchImpl}):new OpenAiCompatibleProvider(args);
}
