# PDF failure recovery

Browser PDF processing classifies failures before saving or displaying them. Password-protected, damaged, incomplete, over-limit, and locally unavailable-engine failures are permanent for the current input or session; unknown failures remain retryable once.

Permanent failures show **Needs attention**, preserve the original for review, and do not offer an in-row retry that would repeat the same result. Guidance asks for an explicit unlocked, complete, or bounded replacement file, or instructs the user to reload when the local engine is unavailable.

Raw PDF.js errors are not displayed. No failed extraction creates an artifact, extracted-text view, or AI-analysis action.
