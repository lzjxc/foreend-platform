# Housing Management Frontend — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add housing management UI under `/life/housing/*` with property list, tenancy detail (single-page scroll), utility/bill tracking, document upload, email classification, and init-from-email via LLM.

**Architecture:** New housing module under the existing life-app section. Types in `src/types/housing.ts`, hooks in `src/hooks/use-housing.ts` (inline API calls via `lifeAppClient`), 10 components in `src/components/housing/`, 4 pages in `src/pages/life/`. Modify `App.tsx` for routes, `landing.tsx` for module card, `email-detail.tsx` for init button.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, React Query, Zustand, React Hook Form + Zod, react-dropzone, Recharts, Lucide icons, Sonner toast

**Spec:** `docs/superpowers/specs/2026-03-25-housing-frontend-design.md`

---

## File Structure

```
src/
├── types/
│   └── housing.ts                        # NEW — all types + enums + Create/Update input types
├── hooks/
│   └── use-housing.ts                    # NEW — React Query hooks (inline API via lifeAppClient)
├── components/
│   └── housing/
│       ├── property-card.tsx             # NEW — property card for list page
│       ├── property-form.tsx             # NEW — property create/edit Sheet form
│       ├── tenancy-form.tsx              # NEW — tenancy create/edit Sheet form
│       ├── utility-section.tsx           # NEW — utilities grid + inline edit
│       ├── bill-section.tsx              # NEW — bills table + filters + inline edit
│       ├── document-section.tsx          # NEW — documents grid + drag-drop upload
│       ├── email-section.tsx             # NEW — email links table
│       ├── email-sync-dialog.tsx         # NEW — sync result dialog
│       ├── email-init-dialog.tsx         # NEW — email search + LLM init dialog
│       └── tenancy-anchor-nav.tsx        # NEW — sticky side anchor navigation
├── pages/
│   └── life/
│       ├── housing-list.tsx              # NEW — property list page
│       ├── housing-new.tsx               # NEW — create property (manual + email init)
│       ├── housing-detail.tsx            # NEW — property detail (tenancy list)
│       └── housing-tenancy-detail.tsx    # NEW — tenancy detail (single-page scroll)
├── pages/life/landing.tsx                # MOD — add housing module card
├── components/email/email-detail.tsx     # MOD — add "初始化为房产" button
└── App.tsx                               # MOD — add /life/housing/* routes
```

---

### Task 1: Types + Enums

**Files:**
- Create: `src/types/housing.ts`

- [ ] **Step 1: Create housing type definitions**

Create `src/types/housing.ts` with all types from the spec. Mirror backend Pydantic models. Include:
- Enums: `PropertyType`, `TenancyStatus`, `UtilityType`, `DocumentType`, `MatchType`
- Entity interfaces: `Property`, `Tenancy`, `Utility`, `Bill`, `HousingDocument`, `EmailLink`
- Input types: `PropertyCreate`, `PropertyUpdate`, `TenancyCreate`, `TenancyUpdate`, `UtilityCreate`, `UtilityUpdate`, `BillCreate`, `BillUpdate`
- Result types: `EmailSyncResult`, `InitFromEmailResult`
- Reuse `PaginatedResponse<T>` from `src/types/life-app.ts`

```typescript
// src/types/housing.ts
export type PropertyType = 'apartment' | 'house' | 'studio' | 'room' | 'other';
export type TenancyStatus = 'draft' | 'active' | 'ended';
export type UtilityType = 'electricity' | 'gas' | 'water' | 'internet' | 'council_tax' | 'other';
export type HousingDocumentType = 'contract' | 'epc' | 'gas_safety' | 'how_to_rent' | 'inventory' | 'deposit_cert' | 'other';
export type MatchType = 'auto' | 'manual';

// --- Property ---
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

// --- Tenancy ---
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

// --- Utility ---
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

// --- Bill ---
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

// --- Document ---
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

// --- EmailLink ---
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

// --- API Results ---
export interface EmailSyncResult {
  matched: number;
  new_links: number;
  skipped_duplicates: number;
}

export interface InitFromEmailResult {
  property: Property;
  tenancy: Tenancy;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd E:/projects/coding/python/foreend-platform && npx tsc --noEmit src/types/housing.ts 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/types/housing.ts && git commit -m "feat(housing): add type definitions"
```

---

### Task 2: React Query Hooks

**Files:**
- Create: `src/hooks/use-housing.ts`

**Dependencies:** Task 1

- [ ] **Step 1: Create hooks file with query keys and all hooks**

Create `src/hooks/use-housing.ts`. Follow the existing pattern in `src/hooks/use-travel.ts` and `src/hooks/use-rental.ts` — import `lifeAppClient` and `msgGwClient` directly, define API calls inline.

Include:
- Query key factory: `housingKeys`
- **Query hooks**: `useProperties(page, pageSize, search?, city?)`, `useProperty(id)`, `useTenancy(id)`
- **Mutation hooks**: `useCreateProperty`, `useUpdateProperty`, `useDeleteProperty`, `useCreateTenancy`, `useUpdateTenancy`, `useDeleteTenancy`, `useCreateUtility`, `useUpdateUtility`, `useCreateBill`, `useUpdateBill`, `useUploadDocument`, `useDownloadDocument`, `useSyncEmails`, `useBindEmail`, `useUnbindEmail`, `useInitFromEmail`

**Important: All update mutations must use `PATCH` (not `PUT`).** The backend housing API uses PATCH for partial updates. This differs from the personal-info API which uses PUT.

**No delete hooks for utilities, bills, or documents** — per spec limitation, the backend only supports cascade delete via property/tenancy. Do not implement individual delete hooks for these sub-entities.

Key patterns from existing hooks:
- `staleTime: 60_000` for list queries
- `enabled: !!id` for detail queries
- `onSuccess` → `queryClient.invalidateQueries` for mutations
- `useDownloadDocument` should fetch download URL and open in new tab
- `useUploadDocument` uses `multipart/form-data`

```typescript
// Query key factory
export const housingKeys = {
  all: ['housing'] as const,
  properties: () => [...housingKeys.all, 'properties'] as const,
  propertyList: (filters?: Record<string, unknown>) => [...housingKeys.properties(), 'list', filters] as const,
  propertyDetail: (id: string) => [...housingKeys.properties(), 'detail', id] as const,
  tenancies: () => [...housingKeys.all, 'tenancies'] as const,
  tenancyDetail: (id: string) => [...housingKeys.tenancies(), 'detail', id] as const,
};
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit src/hooks/use-housing.ts 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-housing.ts && git commit -m "feat(housing): add React Query hooks"
```

---

### Task 3: Property Card Component

**Files:**
- Create: `src/components/housing/property-card.tsx`

**Dependencies:** Task 1

- [ ] **Step 1: Create property card component**

Card displays: address, city/postcode, type, bedrooms, active tenancy summary (rent, agent, date range, unpaid bills count). Status badge: active tenancy → green "Active", all ended → gray "Ended" with 70% opacity. Click navigates to property detail.

Follow pattern from `src/components/members/member-card.tsx` — motion.div with hover effect, dropdown menu for edit/delete.

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit src/components/housing/property-card.tsx 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/components/housing/property-card.tsx && git commit -m "feat(housing): add property card component"
```

---

### Task 4: Property Form Component

**Files:**
- Create: `src/components/housing/property-form.tsx`

**Dependencies:** Task 1

- [ ] **Step 1: Create property form in a Sheet**

Sheet-based form using React Hook Form + Zod. Fields:
- address_line1 (required), address_line2, city (required), postcode (required)
- country (default "UK"), property_type (select, default "apartment")
- bedrooms (number), bathrooms (number), notes (textarea)

Follow pattern from travel-list.tsx Sheet form. Accept `defaultValues` prop for edit mode, `onSubmit` callback, `isLoading` state.

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit src/components/housing/property-form.tsx 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/components/housing/property-form.tsx && git commit -m "feat(housing): add property form component"
```

---

### Task 5: Tenancy Form Component

**Files:**
- Create: `src/components/housing/tenancy-form.tsx`

**Dependencies:** Task 1

- [ ] **Step 1: Create tenancy form in a Sheet**

Sheet form with fields: status (select: draft/active/ended), landlord_name, landlord_contact, agent_name, agent_contact, agent_email, rent_pcm (number), deposit_amount (number), deposit_scheme, start_date (date), end_date (date), contract_signed_date (date), email_keywords (tag input — comma-separated text input that splits into array), notes (textarea).

Accept `propertyId` prop (used in create), `defaultValues` for edit, `onSubmit` callback.

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit src/components/housing/tenancy-form.tsx 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/components/housing/tenancy-form.tsx && git commit -m "feat(housing): add tenancy form component"
```

---

### Task 6: Property List Page

**Files:**
- Create: `src/pages/life/housing-list.tsx`

**Dependencies:** Tasks 2, 3, 4

- [ ] **Step 1: Create property list page**

Page with:
- Header: "房产管理" title
- Search input + city filter + "手动创建" button (opens property form Sheet) + "从邮件初始化" button (opens email-init-dialog)
- 2-column card grid using `PropertyCard` component
- Pagination at bottom (page/page_size state, total from API)
- Loading: skeleton cards. Empty: "还没有房产" + CTA.

Follow pattern from `src/pages/life/rental-list.tsx`. Use `useProperties(page, pageSize, search, city)` hook.

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit src/pages/life/housing-list.tsx 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/life/housing-list.tsx && git commit -m "feat(housing): add property list page"
```

---

### Task 7: Property Detail Page

**Files:**
- Create: `src/pages/life/housing-detail.tsx`

**Dependencies:** Tasks 2, 5

- [ ] **Step 1: Create property detail page**

Page with:
- Back button → `/life/housing`
- Property header: address, type, bedrooms/bathrooms, edit button (opens property form Sheet in edit mode)
- Tenancy list: cards with status badge (green Active, yellow Draft, gray Ended), click → navigate to tenancy detail
- "新建租约" button (opens tenancy form Sheet)
- Delete property button (with confirm dialog, only if no active tenancies)

Use `useProperty(propertyId)` from `useParams()`. Follow pattern from `src/pages/life/rental-detail.tsx`.

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit src/pages/life/housing-detail.tsx 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/life/housing-detail.tsx && git commit -m "feat(housing): add property detail page"
```

---

### Task 8: Tenancy Anchor Nav Component

**Files:**
- Create: `src/components/housing/tenancy-anchor-nav.tsx`

**Dependencies:** Task 1

- [ ] **Step 1: Create sticky side anchor navigation**

Component that:
- Accepts `sections: { id: string; label: string; icon: string; count?: number }[]`
- Renders sticky sidebar (right side) with section links
- Uses IntersectionObserver to track active section on scroll
- Active section: blue left border, accent color text
- Click → `document.getElementById(id).scrollIntoView({ behavior: 'smooth' })`
- Count badge next to each label

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit src/components/housing/tenancy-anchor-nav.tsx 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/components/housing/tenancy-anchor-nav.tsx && git commit -m "feat(housing): add tenancy anchor nav component"
```

---

### Task 9: Utility Section Component

**Files:**
- Create: `src/components/housing/utility-section.tsx`

**Dependencies:** Tasks 1, 2

- [ ] **Step 1: Create utility section**

Component that:
- Accepts `tenancyId: string`, `utilities: Utility[]`
- Renders 2-column card grid, each card: type icon + name, provider, account number, monthly cost
- "添加" button → inline form at bottom (type select, provider input, account number, monthly cost, email_keywords, notes)
- Click card → expand inline edit form below the card (same fields, pre-filled)
- Uses `useCreateUtility` and `useUpdateUtility` mutations
- Type icons: ⚡ electricity, 🔥 gas, 💧 water, 🌐 internet, 🏛 council_tax, 📦 other

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit src/components/housing/utility-section.tsx 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/components/housing/utility-section.tsx && git commit -m "feat(housing): add utility section component"
```

---

### Task 10: Bill Section Component

**Files:**
- Create: `src/components/housing/bill-section.tsx`

**Dependencies:** Tasks 1, 2

- [ ] **Step 1: Create bill section**

Component that:
- Accepts `tenancyId: string`, `utilities: Utility[]` (bills are nested in utilities)
- Flattens all bills from all utilities into one list, sorted by due_date desc
- Table: utility type icon, amount (bold), period (start→end), due date, status badge
- Status badge logic: `paid === true` → green "已付", `paid === false && due_date < today` → red "逾期", else → orange "待付"
- Filters at top: utility type dropdown + status dropdown (All/Paid/Unpaid/Overdue)
- Click row → expand inline edit: amount, due_date, paid checkbox, paid_date, notes. Save → `useUpdateBill`
- "添加账单" button per utility → `useCreateBill`
- Source email ID → clickable link opening `/msg-gateway` email detail

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit src/components/housing/bill-section.tsx 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/components/housing/bill-section.tsx && git commit -m "feat(housing): add bill section component"
```

---

### Task 11: Document Section Component

**Files:**
- Create: `src/components/housing/document-section.tsx`

**Dependencies:** Tasks 1, 2

- [ ] **Step 1: Create document section**

Component that:
- Accepts `tenancyId: string`, `documents: HousingDocument[]`
- 3-column card grid: icon with colored background (per type), name, type badge (purple), file size formatted
- "上传" button → react-dropzone dialog (accept: pdf, images, docs)
  - On drop: call `useUploadDocument` (multipart/form-data with file + type select + name input)
  - Show upload progress
- Click card → call `useDownloadDocument` → opens download URL in new tab
- Icon mapping: 📑 contract, 🏠 epc, 🔥 gas_safety, 📖 how_to_rent, 📋 inventory, 🔒 deposit_cert, 📄 other
- Background color: purple-bg for contract, green-bg for epc, orange-bg for gas_safety, etc.

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit src/components/housing/document-section.tsx 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/components/housing/document-section.tsx && git commit -m "feat(housing): add document section component"
```

---

### Task 12: Email Section + Sync Dialog

**Files:**
- Create: `src/components/housing/email-section.tsx`
- Create: `src/components/housing/email-sync-dialog.tsx`

**Dependencies:** Tasks 1, 2

- [ ] **Step 1: Create email sync dialog**

Dialog component that:
- Accepts `open: boolean`, `onClose`, `syncResult: EmailSyncResult | null`, `newLinks: EmailLink[]`
- Header: summary stats (scanned, new matches, skipped)
- Table: sender (`email_from`), subject (`email_subject`), matched keyword (orange), linked to (utility type or "租约级"), undo button
- Undo → call `useUnbindEmail` → remove row from table
- Confirm/Cancel buttons

- [ ] **Step 2: Create email section**

Component that:
- Accepts `tenancyId: string`, `emailLinks: EmailLink[]`
- Table: sender, subject (truncated), date, match type badge (Auto=blue, Manual=gray), matched keyword, unbind button (red)
- "同步邮件" button → calls `useSyncEmails(tenancyId)`, on success opens sync dialog with result
- "手动关联" button → simple dialog: email ID input, call `useBindEmail`
- Unbind → confirm dialog → `useUnbindEmail`

- [ ] **Step 3: Verify both compile**

```bash
npx tsc --noEmit src/components/housing/email-sync-dialog.tsx src/components/housing/email-section.tsx 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add src/components/housing/email-section.tsx src/components/housing/email-sync-dialog.tsx && git commit -m "feat(housing): add email section and sync dialog"
```

---

### Task 13: Email Init Dialog

**Files:**
- Create: `src/components/housing/email-init-dialog.tsx`

**Dependencies:** Tasks 1, 2

- [ ] **Step 1: Create email init dialog**

Dialog component with multi-step flow:
1. **Search step**: search input → calls `msgGwClient.get('/api/v1/emails', { params: { search, size: 20 } })` → renders email list (from, subject, date). Click selects email.
2. **Parsing step**: loading spinner with "LLM 解析中..." text. Calls `useInitFromEmail({ email_id })`. 30s timeout fallback.
3. **Review step**: show parsed property + tenancy fields in editable form (reuse property-form and tenancy-form field layouts). User can modify before confirming.
4. **Confirm**: creates property + tenancy, navigates to tenancy detail.

Accept `open`, `onClose`, `onSuccess(result: InitFromEmailResult)` props. Also accept optional `emailId` prop (for Entry B — pre-selected email, skip to step 2).

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit src/components/housing/email-init-dialog.tsx 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/components/housing/email-init-dialog.tsx && git commit -m "feat(housing): add email init dialog"
```

---

### Task 14: Tenancy Detail Page (Single-Page Scroll)

**Files:**
- Create: `src/pages/life/housing-tenancy-detail.tsx`

**Dependencies:** Tasks 2, 5, 8, 9, 10, 11, 12

- [ ] **Step 1: Create tenancy detail page**

This is the core page. Single-page scroll layout with:

**Header:**
- Back link → `/life/housing/${propertyId}` (use `useParams()` for both `propertyId` and `tenancyId`)
- Address (from property on tenancy), agent, rent/month, date range
- Status badge + edit button (opens tenancy form Sheet)

**Layout:** flex container — main content (flex-1, overflow-y-auto) + TenancyAnchorNav (sticky right sidebar, ~110px)

**Sections (each with `id` attribute for anchor nav):**
1. `id="info"` — 📋 租约信息: 2-col grid showing landlord/agent info + deposit/contract info + email keywords
2. `id="utilities"` — ⚡ 水电账户: `<UtilitySection>` component
3. `id="bills"` — 💷 账单: `<BillSection>` component
4. `id="docs"` — 📄 文档: `<DocumentSection>` component
5. `id="emails"` — 📧 关联邮件: `<EmailSection>` component

Use `useTenancy(tenancyId)` hook. Loading state: full page skeleton. Error: toast + back button.

Anchor nav sections config:
```typescript
const sections = [
  { id: 'info', label: '租约', icon: '📋' },
  { id: 'utilities', label: '水电', icon: '⚡', count: tenancy.utilities.length },
  { id: 'bills', label: '账单', icon: '💷', count: allBills.length },
  { id: 'docs', label: '文档', icon: '📄', count: tenancy.documents.length },
  { id: 'emails', label: '邮件', icon: '📧', count: tenancy.email_links.length },
];
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit src/pages/life/housing-tenancy-detail.tsx 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/life/housing-tenancy-detail.tsx && git commit -m "feat(housing): add tenancy detail page with single-page scroll"
```

---

### Task 15: Create Property Page (housing-new)

**Files:**
- Create: `src/pages/life/housing-new.tsx`

**Dependencies:** Tasks 2, 4, 13

- [ ] **Step 1: Create housing-new page**

Page that handles two creation flows:
1. **Manual**: renders PropertyForm directly on the page. On submit → `useCreateProperty` → navigate to `/life/housing/${id}`
2. **From email**: reads `?email_id=xxx` from URL search params. If present, auto-opens EmailInitDialog with that email pre-selected. On success → navigate to tenancy detail.

Page header: "新建房产" title + back button. Two mode tabs or buttons: "手动创建" / "从邮件初始化".

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit src/pages/life/housing-new.tsx 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/life/housing-new.tsx && git commit -m "feat(housing): add create property page"
```

---

### Task 16: Route Registration + Landing Card + Email Detail Button

**Files:**
- Modify: `src/App.tsx` (lines ~46-52 for imports, ~128-136 for routes)
- Modify: `src/pages/life/landing.tsx` (lines ~25-56 for modules array)
- Modify: `src/components/email/email-detail.tsx` (lines ~154-214 for action bar)

**Dependencies:** Tasks 6, 7, 14, 15

- [ ] **Step 1: Add routes to App.tsx**

Add imports and route definitions. **Critical: `/life/housing/new` must come before `/life/housing/:propertyId`.**

```typescript
// Imports to add (after existing life imports ~line 52)
import LifeHousingList from '@/pages/life/housing-list';
import LifeHousingNew from '@/pages/life/housing-new';
import LifeHousingDetail from '@/pages/life/housing-detail';
import LifeHousingTenancyDetail from '@/pages/life/housing-tenancy-detail';

// Routes to add (after existing life routes ~line 136)
<Route path="life/housing" element={<LifeHousingList />} />
<Route path="life/housing/new" element={<LifeHousingNew />} />
<Route path="life/housing/:propertyId" element={<LifeHousingDetail />} />
<Route path="life/housing/:propertyId/tenancy/:tenancyId" element={<LifeHousingTenancyDetail />} />
```

- [ ] **Step 2: Add housing card to landing page**

In `src/pages/life/landing.tsx`, add to the modules array (~line 25-56):
- Import `useProperties` from hooks
- Call `useProperties(1, 1)` to get total count
- Add module card: `{ id: 'housing', title: '房产管理', description: '管理房产、租约、水电账单和文档', icon: Home, path: '/life/housing', iconBg: 'bg-emerald-500', countLabel: (n) => \`${n} 处房产\`, count: propertiesData?.total }`

- [ ] **Step 3: Add "初始化为房产" button in email detail**

In `src/components/email/email-detail.tsx`, in the action bar area (~line 154-214), add a button next to the reply button:

```typescript
// Add after the reply button, inside the action bar
<Button
  variant="outline"
  onClick={() => navigate(`/life/housing/new?email_id=${email.id}`)}
>
  <Home className="mr-2 h-4 w-4" />
  初始化为房产
</Button>
```

Import `Home` from lucide-react and `useNavigate` from react-router-dom (if not already imported).

- [ ] **Step 4: Verify everything compiles**

```bash
npx tsc --noEmit 2>&1 | tail -20
```

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/pages/life/landing.tsx src/components/email/email-detail.tsx && git commit -m "feat(housing): register routes, landing card, and email init button"
```

---

### Task 17: Build Verification + Dev Server Test

**Files:** None (verification only)

**Dependencies:** All previous tasks

- [ ] **Step 1: Run full TypeScript check**

```bash
cd E:/projects/coding/python/foreend-platform && npx tsc --noEmit 2>&1 | tail -30
```

Fix any type errors.

- [ ] **Step 2: Run dev build**

```bash
npm run build 2>&1 | tail -30
```

Fix any build errors.

- [ ] **Step 3: Start dev server and verify pages load**

```bash
npm run dev
```

Verify in browser:
- `/life` → housing card appears with count
- `/life/housing` → property list page loads
- `/life/housing/new` → create page loads
- Navigation between pages works

- [ ] **Step 4: Final commit if any fixes were needed**

```bash
git add -A && git commit -m "fix(housing): resolve build issues"
```

---

## 引用上下文
- docs/superpowers/specs/2026-03-25-housing-frontend-design.md
- rules/frontend-style.md
- rules/service-calls.md
- rules/dev-workflow.md
