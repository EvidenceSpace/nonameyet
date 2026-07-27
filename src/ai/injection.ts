export interface InjectionSignal {
  rule: string;
  excerpt: string;
}

interface InjectionRule {
  rule: string;
  pattern: RegExp;
}

const INJECTION_RULES: readonly InjectionRule[] = [
  {
    rule: "instruction_override",
    pattern: /ignore\s+(?:all\s+|any\s+)?(?:the\s+)?(?:previous|prior|above|earlier)\s+(?:instructions?|prompts?|rules?)/gi,
  },
  { rule: "role_impersonation", pattern: /(?:^|\n)\s*(?:system|assistant|developer)\s*:/gi },
  {
    rule: "verification_bypass",
    pattern: /mark\s+(?:this|it|them|all|everything)\s+as\s+(?:confirmed|verified|approved|resolved)/gi,
  },
  { rule: "authority_claim", pattern: /you\s+(?:must|should|are\s+required\s+to)\s+(?:confirm|approve|verify|accept)/gi },
  { rule: "tool_invocation", pattern: /<\/?(?:tool|function|invoke|antml)[^>]*>/gi },
  {
    rule: "exfiltration",
    pattern: /(?:send|email|post|upload|forward|share)\s+(?:this|the|all|these|my)\s+(?:case|files?|data|documents?|records?|evidence)(?:\s+(?:files?|data|documents?|records?|content))?\s+to\b/gi,
  },
  {
    rule: "destructive_request",
    pattern: /(?:delete|erase|wipe|remove)\s+(?:the\s+|this\s+)?(?:case|all\s+files|everything|all\s+records)/gi,
  },
  { rule: "prompt_disclosure", pattern: /(?:reveal|print|repeat|show)\s+(?:your|the)\s+(?:system\s+)?(?:prompt|instructions)/gi },
];

function excerptAround(text: string, index: number, length: number): string {
  const start = Math.max(0, index - 40);
  const end = Math.min(text.length, index + length + 40);
  return text.slice(start, end).replace(/\s+/g, " ").trim();
}

/**
 * Detects text inside a document that tries to act as an instruction. Signals
 * are recorded and surfaced to the user. They are never obeyed.
 */
export function detectInjectionSignals(text: string): InjectionSignal[] {
  const signals: InjectionSignal[] = [];
  const seen = new Set<string>();

  for (const { rule, pattern } of INJECTION_RULES) {
    const matcher = new RegExp(pattern.source, pattern.flags);
    let match = matcher.exec(text);
    while (match) {
      const excerpt = excerptAround(text, match.index, match[0].length);
      const key = `${rule}:${excerpt}`;
      if (!seen.has(key)) {
        seen.add(key);
        signals.push({ rule, excerpt });
      }
      if (match[0].length === 0) break;
      match = matcher.exec(text);
    }
  }

  return signals;
}
