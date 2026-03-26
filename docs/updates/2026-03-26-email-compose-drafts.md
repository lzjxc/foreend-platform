# 2026-03-26: Email Compose & Drafts Feature

## Summary

Added email compose and draft management capabilities to the email module within the messaging gateway.

## Changes

### Types (`src/types/email.ts`)
- Added `ComposeEmailInput` type for composing new emails
- Added `DraftUpdateInput` type for editing existing drafts
- Widened `direction` union to include `'draft'`

### API Layer (`src/api/emails.ts`)
- `composeEmail(input)` — POST `/api/v1/emails/compose` (send=false saves draft, send=true sends)
- `listDrafts(params)` — GET `/api/v1/emails/drafts` (paginated)
- `getDraft(id)` — GET `/api/v1/emails/drafts/{id}`
- `updateDraft(id, input)` — PUT `/api/v1/emails/drafts/{id}`
- `deleteDraft(id)` — DELETE `/api/v1/emails/drafts/{id}`
- `sendDraft(id)` — POST `/api/v1/emails/drafts/{id}/send`

### Hooks (`src/hooks/use-emails.ts`)
- `useDraftList` — query hook for draft listing
- `useDraftDetail` — query hook for single draft
- `useCompose` — mutation hook for composing emails
- `useUpdateDraft` — mutation hook for editing drafts
- `useDeleteDraft` — mutation hook for deleting drafts
- `useSendDraft` — mutation hook for sending drafts
- Added `draftKeys` to query key factory

### Components
- **NEW** `src/components/email/email-compose.tsx` — Compact form editor for composing new emails and editing drafts
- **MODIFIED** `src/components/email/email-list.tsx` — Added compose button, draft direction filter, draft item styling
- **MODIFIED** `src/components/email/email-inbox.tsx` — Added panel mode switching (view / compose / edit-draft)

## Documentation Updated
- `CLAUDE.md` — Sections 1.3, 2, 3.2, and changelog
