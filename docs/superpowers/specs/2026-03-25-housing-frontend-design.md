# Housing Management Frontend — Design Spec

> Date: 2026-03-25
> Project: foreend-platform
> Status: Approved
> Backend Spec: `E:\projects\coding\python\backend-life-app\docs\superpowers\specs\2026-03-24-housing-module-design.md`

## Goal

Add a housing management frontend module under the Life Assistant (`/life`) section, providing UI for managing properties, tenancies, utilities, bills, documents, and email correspondence. Integrates with the backend life-app housing API (22 endpoints) and msg-gw for email features.

## Non-Goals

- Notification/reminder UI (deferred — backend doesn't support yet)
- Payment integration
- Multi-user/permission system

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Route location | Under `/life/housing/*` | Groups with existing life-app modules (travel, rental, accommodation) |
| Tenancy detail layout | Single-page scroll + side anchor nav | User can see all info at a glance without tab switching |
| Init from email entry points | Both: housing list button + email detail button | Maximum discoverability |
| Email sync result display | Detailed dialog with per-item confirm/undo | User can verify and correct auto-matches |
| Theme | White/light theme | Per `~/.claude/rules/frontend-style.md` |
| API client | Reuse `lifeAppClient` + `msgGwClient` | No new Axios instances needed |

## Status Color Mapping

Per `~/.claude/rules/frontend-style.md`:

| Status | Color | Usage |
|--------|-------|-------|
| Active / Paid | Green | Tenancy active, bill `paid === true` |
| Draft | Yellow | New tenancy not yet confirmed |
| Unpaid | Orange | Bill `paid === false` and `due_date` not past |
| Overdue | Red | Bill `paid === false` and `due_date` past |
| Ended / Inactive | Gray | Past tenancies |
| Auto match | Blue | Webhook auto-classified emails |
| Utility match / Document | Purple | Utility-level email match, document types |
| Failed / Error | Red | Sync failures, API errors |

## Route Structure

```
/life                                          → Landing (add housing card)
/life/housing                                  → Property list (card grid + search/filter + pagination)
/life/housing/new                              → Create property (manual / from email)
/life/housing/:propertyId                      → Property detail (tenancy list + edit)
/life/housing/:propertyId/tenancy/:tenancyId   → Tenancy detail (single-page scroll)
```

**Route ordering**: In `App.tsx`, `/life/housing/new` must be defined **before** `/life/housing/:propertyId` so the static route takes precedence over the dynamic segment. All routes are flat (no nested `<Route>` with `<Outlet>`).

## Page Designs

### 1. Property List (`/life/housing`)

- **Top bar**: Search input (address/postcode) + city filter dropdown
- **Pagination**: Page controls at bottom (backend supports `page` + `page_size` params)
- **Action buttons**: "手动创建" (primary blue) + "从邮件初始化" (purple)
- **Card grid**: 2-column grid, each card shows:
  - Property address, city, postcode, type, bedrooms
  - Active tenancy summary: rent/month, agent, date range
  - Unpaid bill count (orange warning)
  - Status badge: Active (green), Ended (gray, card 70% opacity)

### 2. Property Detail (`/life/housing/:propertyId`)

- **Header**: Property address + type + edit button
- **Tenancy list**: Cards for each tenancy with status badge, click to navigate
- **Create tenancy button**: "新建租约" or "从邮件初始化"

### 3. Tenancy Detail (`/life/housing/:pid/tenancy/:tid`)

Single-page scroll with sticky side anchor navigation. Five sections:

**Header area:**
- Back link → property list
- Address, agent, rent/month, date range
- Status badge + edit button

**Section: 📋 租约信息**
- 2-column card grid: landlord/agent info + deposit/contract info
- Email keywords displayed as secondary text

**Section: ⚡ 水电账户**
- 2-column card grid, each utility card shows: type icon, provider, account number, monthly cost
- "添加" button (outline-accent)
- Click card to expand edit form

**Section: 💷 账单**
- Table with rounded border: type, amount, period, due date, status badge
- Filters: type dropdown + status dropdown
- Click row to expand inline edit (mark paid, update amount)
- Source email ID is clickable → opens email detail

**Section: 📄 文档**
- 3-column card grid: icon with colored background, name, type badge, file size
- "上传" button → react-dropzone dialog, uploads via file-gateway to MinIO
- Click card → download via file-gateway accelerated URL

**Section: 📧 关联邮件**
- Table: sender, subject, date, match type badge (Auto blue / Utility purple), matched keyword, unbind action
- "同步邮件" button → triggers sync, shows result dialog
- "手动关联" button → search dialog to bind email

**Side anchor nav:**
- Sticky positioned, right side
- Active section highlighted with blue left border indicator
- Smooth scroll on click
- Section count badges

### 4. Email Sync Result Dialog

Modal dialog shown after email sync completes:
- Summary stats: scanned count, new matches, skipped duplicates
- Table: sender, subject, matched keyword (orange), linked to (utility/tenancy), undo button (red)
- Confirm/Cancel buttons

### 5. Init From Email — Two Entry Points

**Entry A: Housing list "从邮件初始化" button**
1. Dialog: search emails via msg-gw API
2. Select email → click "初始化"
3. Loading spinner (LLM parsing, up to 30s)
4. Show parsed result (property address + tenancy info) in editable form
5. Confirm → creates property + tenancy, navigate to tenancy detail

**Entry B: Email detail page "初始化为房产" button**
1. New button in email-detail.tsx action bar
2. Click → navigate to `/life/housing/new?email_id=xxx`
3. Auto-triggers LLM parsing, then same flow as Entry A steps 3-5

## API Integration

### Client

Reuse existing clients — no new Axios instances:

```typescript
// All housing endpoints via lifeAppClient (/life-api)
// Email search/detail via msgGwClient (/notification-api)
```

### Endpoint Mapping

| Frontend Action | Method | Endpoint | Client |
|----------------|--------|----------|--------|
| List properties | GET | `/api/v1/housing/properties` | lifeAppClient |
| Create property | POST | `/api/v1/housing/properties` | lifeAppClient |
| Property detail | GET | `/api/v1/housing/properties/{id}` | lifeAppClient |
| Update property | PATCH | `/api/v1/housing/properties/{id}` | lifeAppClient |
| Delete property | DELETE | `/api/v1/housing/properties/{id}` | lifeAppClient |
| List tenancies | GET | `/api/v1/housing/tenancies` | lifeAppClient |
| Create tenancy | POST | `/api/v1/housing/tenancies` | lifeAppClient |
| Tenancy detail | GET | `/api/v1/housing/tenancies/{id}` | lifeAppClient |
| Update tenancy | PATCH | `/api/v1/housing/tenancies/{id}` | lifeAppClient |
| Delete tenancy | DELETE | `/api/v1/housing/tenancies/{id}` | lifeAppClient |
| Init from email | POST | `/api/v1/housing/init-from-email` | lifeAppClient |
| Add utility | POST | `/api/v1/housing/tenancies/{id}/utilities` | lifeAppClient |
| Update utility | PATCH | `/api/v1/housing/utilities/{id}` | lifeAppClient |
| Add bill | POST | `/api/v1/housing/utilities/{id}/bills` | lifeAppClient |
| Update bill | PATCH | `/api/v1/housing/bills/{id}` | lifeAppClient |
| Upload document | POST | `/api/v1/housing/tenancies/{id}/documents` | lifeAppClient |
| Download document | GET | `/api/v1/housing/documents/{id}/download` | lifeAppClient |
| Sync emails | POST | `/api/v1/housing/tenancies/{id}/emails/sync` | lifeAppClient |
| Bind email | POST | `/api/v1/housing/tenancies/{id}/emails` | lifeAppClient |
| Unbind email | DELETE | `/api/v1/housing/email-links/{id}` | lifeAppClient |
| Search emails (for init) | GET | `/api/v1/emails` | msgGwClient |
| Email detail (for init) | GET | `/api/v1/emails/{id}` | msgGwClient |

## File Structure

### New Files (13)

```
src/
├── types/
│   └── housing.ts                    # Property, Tenancy, Utility, Bill, Document, EmailLink types + enums + Create/Update input types
├── hooks/
│   └── use-housing.ts                # React Query hooks + inline API calls (follows existing life module pattern, imports lifeAppClient directly)
├── components/
│   └── housing/
│       ├── property-card.tsx          # Property card for list page
│       ├── property-form.tsx          # Property create/edit form (React Hook Form + Zod)
│       ├── tenancy-form.tsx           # Tenancy create/edit form
│       ├── utility-section.tsx        # Utilities grid section
│       ├── bill-section.tsx           # Bills table with filters + inline edit
│       ├── document-section.tsx       # Documents grid with drag-drop upload
│       ├── email-section.tsx          # Email links table
│       ├── email-sync-dialog.tsx      # Sync result dialog with undo
│       ├── email-init-dialog.tsx      # Email search + LLM init dialog
│       └── tenancy-anchor-nav.tsx     # Sticky side anchor navigation
├── pages/
│   └── life/
│       ├── housing-list.tsx           # Property list page
│       ├── housing-new.tsx            # Create property page (manual + email init)
│       ├── housing-detail.tsx         # Property detail with tenancy list
│       └── housing-tenancy-detail.tsx # Tenancy detail (single-page scroll)
```

### Modified Files (3)

```
src/
├── pages/life/landing.tsx             # Add housing module card (icon, count, path)
├── components/email/email-detail.tsx  # Add "初始化为房产" action button
└── App.tsx                            # Add /life/housing/* routes (new before :propertyId)
```

**Total: 13 new files + 3 modified files**

## Type Definitions

```typescript
// src/types/housing.ts

// Enums (mirror backend)
export type PropertyType = 'apartment' | 'house' | 'studio' | 'room' | 'other';
export type TenancyStatus = 'draft' | 'active' | 'ended';
export type UtilityType = 'electricity' | 'gas' | 'water' | 'internet' | 'council_tax' | 'other';
export type HousingDocumentType = 'contract' | 'epc' | 'gas_safety' | 'how_to_rent' | 'inventory' | 'deposit_cert' | 'other';
export type MatchType = 'auto' | 'manual';

// Property
export interface Property {
  id: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  postcode: string;
  country: string;
  property_type: PropertyType;
  bedrooms: number | null;
  bathrooms: number | null;
  notes: string | null;
  tenancies: Tenancy[];
  created_at: string;
  updated_at: string;
}

export interface PropertyCreate {
  address_line1: string;
  address_line2?: string;
  city: string;
  postcode: string;
  country?: string;
  property_type?: PropertyType;
  bedrooms?: number;
  bathrooms?: number;
  notes?: string;
}

export interface PropertyUpdate extends Partial<PropertyCreate> {}

// Tenancy
export interface TenancyCreate {
  property_id: string;
  status?: TenancyStatus;
  landlord_name?: string;
  landlord_contact?: string;
  agent_name?: string;
  agent_contact?: string;
  agent_email?: string;
  rent_pcm?: number;
  deposit_amount?: number;
  deposit_scheme?: string;
  start_date?: string;
  end_date?: string;
  contract_signed_date?: string;
  email_keywords?: string[];
  notes?: string;
}

export interface TenancyUpdate extends Partial<Omit<TenancyCreate, 'property_id'>> {}

// Utility
export interface UtilityCreate {
  type: UtilityType;
  provider: string;
  account_number?: string;
  monthly_cost?: number;
  contact_info?: string;
  email_keywords?: string[];
  notes?: string;
}

export interface UtilityUpdate extends Partial<UtilityCreate> {}

// Bill
export interface BillCreate {
  amount: number;
  period_start?: string;
  period_end?: string;
  due_date?: string;
  paid?: boolean;
  paid_date?: string;
  notes?: string;
}

export interface BillUpdate extends Partial<BillCreate> {}

export interface Tenancy {
  id: string;
  property_id: string;
  status: TenancyStatus;
  landlord_name: string | null;
  landlord_contact: string | null;
  agent_name: string | null;
  agent_contact: string | null;
  agent_email: string | null;
  rent_pcm: number | null;
  deposit_amount: number | null;
  deposit_scheme: string | null;
  start_date: string | null;
  end_date: string | null;
  contract_signed_date: string | null;
  email_keywords: string[];
  notes: string | null;
  utilities: Utility[];
  documents: HousingDocument[];
  email_links: EmailLink[];
  created_at: string;
  updated_at: string;
}

// Utility
export interface Utility {
  id: string;
  tenancy_id: string;
  type: UtilityType;
  provider: string;
  account_number: string | null;
  monthly_cost: number | null;
  contact_info: string | null;
  email_keywords: string[];
  notes: string | null;
  bills: Bill[];
  created_at: string;
  updated_at: string;
}

// Bill
export interface Bill {
  id: string;
  utility_id: string;
  amount: number;
  period_start: string | null;
  period_end: string | null;
  due_date: string | null;
  paid: boolean;
  paid_date: string | null;
  source_email_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Document
export interface HousingDocument {
  id: string;
  tenancy_id: string;
  type: HousingDocumentType;
  name: string;
  minio_bucket: string;
  minio_key: string;
  file_size: number;
  content_type: string;
  source_email_id: string | null;
  uploaded_at: string;
  updated_at: string;
  notes: string | null;
}

// EmailLink
export interface EmailLink {
  id: string;
  tenancy_id: string;
  utility_id: string | null;
  email_id: string;
  email_subject: string;
  email_from: string;
  email_date: string;
  match_type: MatchType;
  matched_keyword: string | null;
  created_at: string;
}

// Email sync result
export interface EmailSyncResult {
  matched: number;
  new_links: number;
  skipped_duplicates: number;
}

// Init from email result
export interface InitFromEmailResult {
  property: Property;
  tenancy: Tenancy;
}
```

## React Query Hook Structure

```typescript
// src/hooks/use-housing.ts
export const housingKeys = {
  all: ['housing'] as const,
  properties: () => [...housingKeys.all, 'properties'] as const,
  propertyList: (filters?: object) => [...housingKeys.properties(), 'list', filters] as const,
  propertyDetail: (id: string) => [...housingKeys.properties(), 'detail', id] as const,
  tenancies: () => [...housingKeys.all, 'tenancies'] as const,
  tenancyDetail: (id: string) => [...housingKeys.tenancies(), 'detail', id] as const,
};

// Query hooks: useProperties, useProperty, useTenancy
// Mutation hooks: useCreateProperty, useUpdateProperty, useDeleteProperty,
//   useCreateTenancy, useUpdateTenancy, useDeleteTenancy,
//   useCreateUtility, useUpdateUtility,
//   useCreateBill, useUpdateBill,
//   useUploadDocument, useDownloadDocument,
//   useSyncEmails, useBindEmail, useUnbindEmail,
//   useInitFromEmail
```

## UI States

- **Loading**: Skeleton placeholders for cards and tables (consistent with existing modules)
- **Empty**: Illustration + CTA text ("还没有房产，创建第一个吧") for lists
- **Error**: Toast notification (Sonner) for API errors, inline error messages for forms

## Error Handling

- API errors → toast notification (Sonner)
- Init from email LLM timeout → show raw email content, fall back to manual creation form
- File upload failure → toast with retry option
- Email sync partial failure → dialog still shows successful matches

## Known Limitations

- **No delete for utilities/bills/documents individually** — backend only supports cascade delete via tenancy/property. Utility edit form is inline within `utility-section.tsx` (expand on card click).
- **Standalone tenancy list endpoint** (`GET /api/v1/housing/tenancies`) — used only for the property detail page to fetch tenancies for a given property. No cross-property tenancy view in this iteration.

## Mockup Reference

Visual mockups: `.superpowers/brainstorm/32411-1774433891/full-design-v2.html`

## 引用上下文

- rules/frontend-style.md
- rules/service-calls.md
- references/service-urls.md
- E:\projects\coding\python\backend-life-app\docs\superpowers\specs\2026-03-24-housing-module-design.md
