# Mandatory Security Verification Gate Rule

This rule defines the mandatory security verification gate that must be enforced for all tasks, code modifications, feature developments, and refactorings.

---

## 🔒 Mandatory Security Checklist

Every implementation plan and verification phase MUST evaluate:

1. **Broken Object-Level Authorization (BOLA / IDOR):**
   - Verify that any endpoint accepting an ID (`/api/items/:id`, `/users/:id/data`) explicitly checks resource ownership (`resource.userId === auth.userId` or tenant boundary).
   - Never trust client-supplied user identifiers without server-side validation.

2. **Broken Authentication & Session Security:**
   - Verify proper JWT token verification, expiration handling, and secret isolation.
   - Enforce secure cookie settings (`HttpOnly`, `Secure`, `SameSite=Lax` or `Strict`).
   - Prevent transmission of sensitive tokens in URLs or insecure storage.

3. **Injection Flaws (SQL, NoSQL, OS Command, Code):**
   - Ensure all database queries use parameterized statements or ORM query builders.
   - Forbid raw string concatenation in SQL or shell executions.
   - Validate all input bodies and query params using strict schema validators (Zod, Pydantic, etc.).

4. **Sensitive Data Exposure & SSRF:**
   - Verify that no API keys, credentials, or secrets are hardcoded or leaked into client bundles.
   - Filter response DTOs to strip sensitive fields (`password_hash`, `tokens`, `internal_ids`).
   - Validate any server-side fetch URL to block SSRF into internal networks (`localhost`, `127.0.0.1`, `169.254.169.254`).

5. **Client-Side & Web API Hardening:**
   - Forbid `dangerouslySetInnerHTML` or raw HTML interpolation unless sanitized with DOMPurify.
   - Enforce CORS restrictions and proper Content-Security-Policy headers where applicable.

---

## 🚦 Completion Requirement

No task may be marked as complete without documenting the security verification results in the walkthrough.
