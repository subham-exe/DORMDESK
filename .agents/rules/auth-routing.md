---
name: dormdesk-auth-routing
description: Strict architectural constraints for DORMDESK authentication, routing, and E2E validation.
trigger: always_on
---

# DORMDESK Auth & Routing Invariants

When working on DORMDESK authentication, authorization, or routing logic:

1. **Canonical Authority**: Always use `getAuthorityName(user)` to resolve roles. Do not use ad-hoc `any` casts or check legacy `user.role` strings for routing.
2. **Server-Side Gating**: Enforce domain isolation using Next.js Server Components in `layout.tsx` files. Do not rely exclusively on client-side routing guards.
3. **Seed Integrity**: Ensure seed scripts populate canonical authority relationships (e.g., `authorityId`, `departmentRefId`). Without these, server-side layouts will block seeded users.
4. **Validation Pattern**: For any auth/routing modifications, you MUST execute this full validation pipeline before declaring success:
   `Playwright E2E + Vitest + tsc + npm run build + schema/migration check + git diff audit`.
5. **Schema Freeze**: Do not modify `v-final` files or schemas during post-freeze development unless explicitly instructed to break the freeze.
