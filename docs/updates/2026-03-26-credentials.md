# Documentation Update - 2026-03-26 (Credentials Module)

## Summary

Added web credentials (account/password) management module to the frontend platform. This allows storing and managing website login credentials per family member, with features like password masking, copy-to-clipboard, category filtering, and integration into the members overview stats.

## Changes

### CLAUDE.md
- **Added**: `src/types/credential.ts` to types listing
- **Added**: `src/hooks/use-credentials.ts` to hooks listing
- **Added**: `src/components/credentials/` to components listing
- **Added**: Credential API endpoints (`/api/v1/persons/{id}/credentials`, search)
- **Added**: Changelog entry for credentials module

### New Files
| File | Purpose |
|------|---------|
| `src/types/credential.ts` | WebCredential type, category options, maskPassword utility |
| `src/hooks/use-credentials.ts` | React Query hooks: usePersonCredentials, CRUD mutations, useSearchCredentials |
| `src/components/credentials/credentials-tab.tsx` | Full CRUD component with form, card list, masking, copy, category filter |

### Modified Files
| File | Change |
|------|--------|
| `src/types/index.ts` | Re-export credential types |
| `src/pages/member-detail.tsx` | Added "网站账号" tab + overview stat card |
| `src/pages/members.tsx` | Added "网站账号" stat card + detail dialog with 22 credential entries |

## Backend API
- `GET /api/v1/persons/{id}/credentials` — List person credentials
- `POST /api/v1/persons/{id}/credentials` — Create credential
- `PUT /api/v1/persons/{id}/credentials/{cred_id}` — Update credential
- `DELETE /api/v1/persons/{id}/credentials/{cred_id}` — Delete credential
- `GET /api/v1/credentials/search?q=keyword` — Search across all credentials
