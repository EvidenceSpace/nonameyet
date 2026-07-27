import type { AiProvider, ProviderRequest } from "../provider.js";
export type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
export class OpenAiCompatibleProvider implements AiProvider {
  readonly id = "openai-compatible";
  readonly #endpoint: string; readonly #model: string; readonly #apiKey: string; readonly #fetch: FetchLike;
  constructor(args: { endpoint: string; model: string; apiKey: string; fetchImpl?: FetchLike }) {
    const endpoint = new URL(args.endpoint);
    if (endpoint.protocol !== "https:" && endpoint.hostname !== "127.0.0.1" && endpoint.hostname !== "localhost") throw new Error("Provider endpoint must use HTTPS.");
    if (!args.model.trim() || !args.apiKey.trim()) throw new Error("Provider model and API key are required.");
    this.#endpoint=endpoint.toString();this.#model=args.model;this.#apiKey=args.apiKey;this.#fetch=args.fetchImpl??fetch;
  }
  async complete(request: ProviderRequest): Promise<string> {
    const response=await this.#fetch(this.#endpoint,{method:"POST",signal:request.signal,headers:{"authorization":`Bearer ${this.#apiKey}`,"content-type":"application/json"},body:JSON.stringify({model:this.#model,messages:[{role:"system",content:request.system},{role:"user",content:request.user}],response_format:{type:"json_object"},max_tokens:request.maxOutputTokens,temperature:0})});
    const raw=await response.text();if(!response.ok)throw new Error(`Provider request failed with status ${response.status}.`);if(raw.length>200_000)throw new Error("Provider response exceeded the adapter limit.");
    let body:unknown;try{body=JSON.parse(raw)}catch{throw new Error("Provider returned invalid transport JSON.")}
    const content=(body as {choices?:Array<{message?:{content?:unknown}}>}).choices?.[0]?.message?.content;if(typeof content!=="string"||!content.trim())throw new Error("Provider returned no message content.");return content;
  }
}
