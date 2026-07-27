export interface ProviderRequest {
  system: string;
  user: string;
  responseSchema: "file-extraction.v1";
  maxOutputTokens: number;
  signal: AbortSignal;
}
export interface AiProvider { readonly id: string; complete(request: ProviderRequest): Promise<string>; }
export class ProviderConfigurationError extends Error { constructor(message: string) { super(message); this.name = "ProviderConfigurationError"; } }
export function requireServerCredential(environment: Record<string, string | undefined>, name: string): string {
  const value = environment[name]?.trim();
  if (!value) throw new ProviderConfigurationError(`Missing server credential: ${name}`);
  return value;
}
