# Life App Frontend Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add "生活助手" sidebar entry and implement 3 modules (travel plans, rental search, accommodation search) with full CRUD, async polling, and comparison features.

**Architecture:** Landing page with 3 module cards → each module has list + detail pages. All async searches use React Query `refetchInterval` polling. API calls go through `/life-api` proxy to `life-app.apps.svc.cluster.local:8000`. Types, hooks, and pages organized by module.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, React Query v5, React Router v6, Radix UI (Sheet/Dialog), Lucide icons, Recharts (not needed here)

**Spec:** `docs/superpowers/specs/2026-03-22-life-app-frontend-design.md`

---

### Task 1: Infrastructure — Client, Types, Proxy, Sidebar, Routes

**Files:**
- Modify: `src/api/client.ts`
- Create: `src/types/life-app.ts`
- Modify: `src/components/layout/sidebar.tsx`
- Modify: `src/App.tsx`
- Modify: `vite.config.ts`
- Modify: `nginx.conf`

- [ ] **Step 1: Add lifeAppClient to client.ts**

After the last `createApiClient` call (around line 18), add:

```typescript
export const lifeAppClient = createApiClient('/life-api', false, 120000);
```

- [ ] **Step 2: Add vite dev proxy**

In `vite.config.ts`, add to the `proxy` object (after the last proxy entry):

```typescript
'/life-api': {
  target: 'http://192.168.1.191:32009',
  changeOrigin: true,
  rewrite: (p) => p.replace(/^\/life-api/, ''),
},
```

- [ ] **Step 3: Add nginx production proxy**

In `nginx.conf`, add before the `# SPA fallback` location block:

```nginx
# Life App API (travel, rental, accommodation)
location /life-api/ {
    set $life_upstream http://life-app.apps.svc.cluster.local:8000;
    rewrite ^/life-api/(.*)$ /$1 break;
    proxy_pass $life_upstream;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_connect_timeout 10s;
    proxy_read_timeout 300s;
}
```

- [ ] **Step 4: Create types file**

Create `src/types/life-app.ts`:

```typescript
// ==================== Shared ====================

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

// ==================== Travel ====================

export interface TravelPreferences {
  pace?: 'relaxed' | 'moderate' | 'intensive';
  interests?: string[];
  accommodation_budget_per_night?: number | null;
  include_attractions?: string[];
  exclude_attractions?: string[];
  dietary_requirements?: string[];
}

export interface TravelPlanInput {
  title: string;
  start_date: string;
  end_date: string;
  departure_city: string;
  cities: string[];
  city_nights: Record<string, number>;
  adults: number;
  children: number;
  children_ages: number[];
  transport_mode: 'public_transit' | 'car' | 'coach';
  preferences: TravelPreferences;
}

export type TravelPlanStatus = 'pending' | 'generating' | 'searching_accommodation' | 'completed' | 'failed';

export interface TravelPlanSummary {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  cities: string[];
  status: TravelPlanStatus;
  created_at: string | null;
}

export interface Activity {
  time: string;
  name: string;
  type: 'attraction' | 'meal' | 'transport' | 'rest';
  price_adult: number;
  child_free: boolean;
  duration_min: number;
  child_friendly_rating: number;
  address: string | null;
  notes: string | null;
  booking_url: string | null;
}

export interface DayItinerary {
  date: string;
  day_number: number;
  city: string;
  theme: string;
  activities: Activity[];
}

export interface TransportLeg {
  from_city: string;
  to_city: string;
  mode: string;
  operator: string | null;
  duration_min: number;
  price_estimate_per_adult: number;
  child_free: boolean;
  notes: string | null;
}

export interface BudgetSummary {
  accommodation: number;
  transport: number;
  attractions: number;
  dining_estimate: number;
  currency: string;
}

export interface TravelPlan extends TravelPlanSummary {
  departure_city: string;
  city_nights: Record<string, number>;
  adults: number;
  children: number;
  transport_legs: TransportLeg[];
  total_budget: BudgetSummary | null;
  days: DayItinerary[];
  error_message: string | null;
  completed_at: string | null;
}

// ==================== Rental ====================

export type SearchStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface RentalSearchInput {
  location: string;
  location_identifier: string;
  max_price: number;
  min_bedrooms: number;
  property_types: string[];
  dont_show: string[];
  radius: number;
}

export interface RentalSearchResult {
  id: string;
  status: SearchStatus;
  location: string;
  max_price: number;
  total_found: number;
  error_message: string | null;
  created_at: string | null;
  completed_at: string | null;
}

export interface PropertySummary {
  id: string;
  title: string;
  address: string;
  price_pcm: number;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  source_url: string;
}

export interface Property extends PropertySummary {
  price_pw: number | null;
  size_sqft: string | null;
  furnish_type: string | null;
  available_date: string | null;
  deposit: string | null;
  min_tenancy: string | null;
  council_tax_band: string | null;
  epc_rating: string | null;
  nearest_station: string | null;
  has_garden: boolean;
  has_parking: boolean;
  description: string | null;
  key_features: string[];
  agent_name: string | null;
  agent_phone: string | null;
  images: string[];
  is_valid: boolean;
}

// ==================== Accommodation ====================

export interface AccommodationSearchInput {
  destination: string;
  checkin: string;
  checkout: string;
  adults: number;
  children: number;
  children_ages: number[];
  rooms: number;
  max_price_total: number | null;
  sort_by: 'price' | 'rating' | 'distance';
  min_rating: number | null;
}

export interface AccommodationSearchResult {
  id: string;
  status: SearchStatus;
  destination: string;
  checkin: string;
  checkout: string;
  total_found: number;
  sold_out_percentage: number | null;
  error_message: string | null;
  created_at: string | null;
  completed_at: string | null;
}

export interface ListingSummary {
  id: string;
  name: string;
  total_price: number;
  price_per_night: number;
  rating: number | null;
  review_count: number;
  distance_from_centre: string | null;
  has_free_cancellation: boolean;
  breakfast_included: boolean;
  booking_url: string;
}

export interface Listing extends ListingSummary {
  currency: string;
  location_rating: number | null;
  property_type: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sleeps: number | null;
  has_kitchen: boolean;
  has_free_parking: boolean;
  has_free_wifi: boolean;
  child_stays_free: boolean;
  has_pool: boolean;
  has_hot_tub: boolean;
  pets_allowed: boolean;
  images: string[];
  is_valid: boolean | null;
}
```

- [ ] **Step 5: Add sidebar entry**

In `src/components/layout/sidebar.tsx`, add `Compass` to the lucide import, then insert after the game-dev entry in `navItems`:

```typescript
{ path: '/life', icon: Compass, label: '生活助手' },
```

This goes after `{ path: '/game-dev', ...}` and before `{ path: '/members', ...}`.

- [ ] **Step 6: Add routes to App.tsx**

Add imports at the top of App.tsx:

```typescript
import LifeLanding from '@/pages/life/landing';
import LifeTravelList from '@/pages/life/travel-list';
import LifeTravelDetail from '@/pages/life/travel-detail';
import LifeRentalList from '@/pages/life/rental-list';
import LifeRentalDetail from '@/pages/life/rental-detail';
import LifeAccommodationList from '@/pages/life/accommodation-list';
import LifeAccommodationDetail from '@/pages/life/accommodation-detail';
```

Add routes after the game-dev routes block (before `<Route path="machines">`):

```tsx
{/* Life App — landing + sub-modules */}
<Route path="life" element={<LifeLanding />} />
<Route path="life/travel" element={<LifeTravelList />} />
<Route path="life/travel/:planId" element={<LifeTravelDetail />} />
<Route path="life/rental" element={<LifeRentalList />} />
<Route path="life/rental/:propertyId" element={<LifeRentalDetail />} />
<Route path="life/accommodation" element={<LifeAccommodationList />} />
<Route path="life/accommodation/:id" element={<LifeAccommodationDetail />} />
```

- [ ] **Step 7: Create placeholder pages so routes don't break**

Create `src/pages/life/` directory and 7 placeholder files. Each file:

```typescript
// src/pages/life/landing.tsx (and same pattern for all 7)
export default function LifeLanding() {
  return <div className="p-6">Landing — TODO</div>;
}
```

Do the same for: `travel-list.tsx`, `travel-detail.tsx`, `rental-list.tsx`, `rental-detail.tsx`, `accommodation-list.tsx`, `accommodation-detail.tsx`.

- [ ] **Step 8: Verify compilation**

Run: `cd E:/projects/coding/python/foreend-platform && npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 9: Commit**

```bash
git add src/api/client.ts src/types/life-app.ts src/components/layout/sidebar.tsx src/App.tsx src/pages/life/ vite.config.ts nginx.conf
git commit -m "feat(life): add infrastructure — client, types, proxy, sidebar, routes"
```

---

### Task 2: TagInput Component

**Files:**
- Create: `src/components/ui/tag-input.tsx`

- [ ] **Step 1: Create TagInput component**

Create `src/components/ui/tag-input.tsx`:

```typescript
import { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function TagInput({ value, onChange, placeholder, className }: TagInputProps) {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      if (!value.includes(input.trim())) {
        onChange([...value, input.trim()]);
      }
      setInput('');
    }
    if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  return (
    <div className={cn('flex flex-wrap gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm', className)}>
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-0.5 text-xs font-medium"
        >
          {tag}
          <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive">
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[60px] bg-transparent outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd E:/projects/coding/python/foreend-platform && npx tsc --noEmit 2>&1 | head -10`

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/tag-input.tsx
git commit -m "feat(ui): add TagInput component for multi-value input"
```

---

### Task 3: Hooks — Travel, Rental, Accommodation

**Files:**
- Create: `src/hooks/use-travel.ts`
- Create: `src/hooks/use-rental.ts`
- Create: `src/hooks/use-accommodation.ts`

- [ ] **Step 1: Create travel hooks**

Create `src/hooks/use-travel.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lifeAppClient } from '@/api/client';
import type {
  TravelPlanSummary,
  TravelPlan,
  TravelPlanInput,
  PaginatedResponse,
} from '@/types/life-app';

export const travelKeys = {
  all: ['travel'] as const,
  plans: () => [...travelKeys.all, 'plans'] as const,
  plan: (id: string) => [...travelKeys.all, 'plan', id] as const,
};

export function useTravelPlans(page = 1, pageSize = 10) {
  return useQuery({
    queryKey: [...travelKeys.plans(), page, pageSize],
    queryFn: async () => {
      const { data } = await lifeAppClient.get<PaginatedResponse<TravelPlanSummary>>(
        `/api/v1/travel/plans?page=${page}&page_size=${pageSize}`
      );
      return data;
    },
    staleTime: 60_000,
  });
}

export function useTravelPlan(planId: string) {
  return useQuery({
    queryKey: travelKeys.plan(planId),
    queryFn: async () => {
      const { data } = await lifeAppClient.get<TravelPlan>(
        `/api/v1/travel/plans/${planId}`
      );
      return data;
    },
    enabled: !!planId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'completed' || status === 'failed' ? false : 3000;
    },
  });
}

export function useCreateTravelPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: TravelPlanInput) => {
      const { data } = await lifeAppClient.post<{ id: string; status: string }>(
        '/api/v1/travel/plans',
        input
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: travelKeys.plans() });
    },
  });
}

export function useExportTravelPlan() {
  return useMutation({
    mutationFn: async (planId: string) => {
      const { data } = await lifeAppClient.get<string>(
        `/api/v1/travel/plans/${planId}/export`,
        { responseType: 'text' as never }
      );
      const blob = new Blob([data], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `travel-plan-${planId}.md`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });
}
```

- [ ] **Step 2: Create rental hooks**

Create `src/hooks/use-rental.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lifeAppClient } from '@/api/client';
import type {
  RentalSearchInput,
  RentalSearchResult,
  PropertySummary,
  Property,
  PaginatedResponse,
} from '@/types/life-app';

export const rentalKeys = {
  all: ['rental'] as const,
  searches: () => [...rentalKeys.all, 'searches'] as const,
  search: (id: string) => [...rentalKeys.all, 'search', id] as const,
  properties: () => [...rentalKeys.all, 'properties'] as const,
  property: (id: string) => [...rentalKeys.all, 'property', id] as const,
};

export function useRentalProperties(page = 1, pageSize = 20, sortBy = 'price_pcm', order = 'asc') {
  return useQuery({
    queryKey: [...rentalKeys.properties(), page, pageSize, sortBy, order],
    queryFn: async () => {
      const { data } = await lifeAppClient.get<PaginatedResponse<PropertySummary>>(
        `/api/v1/rental/properties?page=${page}&page_size=${pageSize}&sort_by=${sortBy}&order=${order}`
      );
      return data;
    },
    staleTime: 60_000,
  });
}

export function useRentalProperty(propertyId: string) {
  return useQuery({
    queryKey: rentalKeys.property(propertyId),
    queryFn: async () => {
      const { data } = await lifeAppClient.get<Property>(
        `/api/v1/rental/properties/${propertyId}`
      );
      return data;
    },
    enabled: !!propertyId,
  });
}

export function useCreateRentalSearch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: RentalSearchInput) => {
      const { data } = await lifeAppClient.post<{ id: string; status: string }>(
        '/api/v1/rental/search',
        input
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rentalKeys.properties() });
    },
  });
}

export function useRentalSearchResult(searchId: string | null) {
  return useQuery({
    queryKey: rentalKeys.search(searchId || ''),
    queryFn: async () => {
      const { data } = await lifeAppClient.get<RentalSearchResult>(
        `/api/v1/rental/search/${searchId}`
      );
      return data;
    },
    enabled: !!searchId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'completed' || status === 'failed' ? false : 3000;
    },
  });
}
```

- [ ] **Step 3: Create accommodation hooks**

Create `src/hooks/use-accommodation.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lifeAppClient } from '@/api/client';
import type {
  AccommodationSearchInput,
  AccommodationSearchResult,
  ListingSummary,
  Listing,
  PaginatedResponse,
} from '@/types/life-app';

export const accommodationKeys = {
  all: ['accommodation'] as const,
  searches: () => [...accommodationKeys.all, 'searches'] as const,
  search: (id: string) => [...accommodationKeys.all, 'search', id] as const,
  listings: () => [...accommodationKeys.all, 'listings'] as const,
  listing: (id: string) => [...accommodationKeys.all, 'listing', id] as const,
  compare: (ids: string[]) => [...accommodationKeys.all, 'compare', ...ids] as const,
};

export function useAccommodationListings(page = 1, pageSize = 20, sortBy = 'total_price', order = 'asc') {
  return useQuery({
    queryKey: [...accommodationKeys.listings(), page, pageSize, sortBy, order],
    queryFn: async () => {
      const { data } = await lifeAppClient.get<PaginatedResponse<ListingSummary>>(
        `/api/v1/accommodation/listings?page=${page}&page_size=${pageSize}&sort_by=${sortBy}&order=${order}`
      );
      return data;
    },
    staleTime: 60_000,
  });
}

export function useAccommodationListing(listingId: string) {
  return useQuery({
    queryKey: accommodationKeys.listing(listingId),
    queryFn: async () => {
      const { data } = await lifeAppClient.get<Listing>(
        `/api/v1/accommodation/listings/${listingId}`
      );
      return data;
    },
    enabled: !!listingId,
  });
}

export function useCreateAccommodationSearch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AccommodationSearchInput) => {
      const { data } = await lifeAppClient.post<{ id: string; status: string }>(
        '/api/v1/accommodation/search',
        input
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: accommodationKeys.listings() });
    },
  });
}

export function useAccommodationSearchResult(searchId: string | null) {
  return useQuery({
    queryKey: accommodationKeys.search(searchId || ''),
    queryFn: async () => {
      const { data } = await lifeAppClient.get<AccommodationSearchResult>(
        `/api/v1/accommodation/search/${searchId}`
      );
      return data;
    },
    enabled: !!searchId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'completed' || status === 'failed' ? false : 3000;
    },
  });
}

export function useCompareAccommodations(ids: string[]) {
  return useQuery({
    queryKey: accommodationKeys.compare(ids),
    queryFn: async () => {
      const { data } = await lifeAppClient.get<{ listings: Listing[] }>(
        `/api/v1/accommodation/compare?ids=${ids.join(',')}`
      );
      return data.listings;
    },
    enabled: ids.length >= 2,
  });
}

export function useVerifyListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (listingId: string) => {
      const { data } = await lifeAppClient.post<{ id: string; is_valid: boolean | null }>(
        `/api/v1/accommodation/listings/${listingId}/verify`
      );
      return data;
    },
    onSuccess: (_, listingId) => {
      qc.invalidateQueries({ queryKey: accommodationKeys.listing(listingId) });
    },
  });
}
```

- [ ] **Step 4: Verify compilation**

Run: `cd E:/projects/coding/python/foreend-platform && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 5: Commit**

```bash
git add src/hooks/use-travel.ts src/hooks/use-rental.ts src/hooks/use-accommodation.ts
git commit -m "feat(life): add React Query hooks for travel, rental, accommodation"
```

---

### Task 4: Landing Page

**Files:**
- Modify: `src/pages/life/landing.tsx`

- [ ] **Step 1: Implement landing page**

Replace `src/pages/life/landing.tsx` with the full implementation. The page shows 3 module cards in a 3-column grid, each fetching its count from the respective list API (page=1, page_size=1 to get only `total`). Cards use `useNavigate` to navigate to sub-pages.

Key elements:
- Page title: "生活助手" with subtitle "life-app"
- 3 cards: 旅游计划 (indigo, Plane icon), 找房 (orange, Home icon), 住宿搜索 (green, Hotel icon)
- Each card shows: icon, title, description, count, "查看 →" link
- White background, consistent with app style
- Uses `useTravelPlans`, `useRentalProperties`, `useAccommodationListings` to get counts

- [ ] **Step 2: Verify compilation and commit**

```bash
npx tsc --noEmit
git add src/pages/life/landing.tsx
git commit -m "feat(life): implement landing page with 3 module cards"
```

---

### Task 5: Travel Module — List + Detail Pages

**Files:**
- Modify: `src/pages/life/travel-list.tsx`
- Modify: `src/pages/life/travel-detail.tsx`

- [ ] **Step 1: Implement travel list page**

Key elements:
- Breadcrumb: "← 返回生活助手" → navigates to `/life`
- Header: "旅行计划" + "+ 新建计划" button
- Plan cards: title, dates·party·departure, status badge
  - Status colors: completed=green, generating/searching_accommodation=orange+animate-pulse, pending=gray, failed=red
- Click card → navigate to `/life/travel/{id}`
- "+ 新建计划" → opens Sheet with form:
  - title, start_date, end_date, departure_city (default "London")
  - cities (TagInput), city_nights (dynamic number inputs per city)
  - adults, children, children_ages (TagInput)
  - transport_mode (Select), preferences.pace (Select), preferences.interests (TagInput)
- Submit → `useCreateTravelPlan` → toast success → close sheet
- Empty state: "还没有旅行计划，点击上方按钮创建第一个计划"
- Pagination if total > page_size

- [ ] **Step 2: Implement travel detail page**

Key elements:
- Breadcrumb: "← 返回计划列表" → `/life/travel`
- Header: plan title + "导出 Markdown" button (disabled if status !== completed)
- Summary bar: 📅 dates | 👥 adults+children | 🚂 transport | 💰 budget total
- Tab navigation: "概览" + D1/D2/D3... per day
- **概览 tab**: transport_legs table (from→to, mode, operator, duration, price) + budget summary table
- **Day tabs**: activity timeline with colored left borders:
  - transport → `border-indigo-500 bg-indigo-50`
  - attraction → `border-green-500 bg-green-50`
  - meal → `border-orange-500 bg-orange-50`
  - rest → `border-purple-500 bg-purple-50`
- Each activity row: time | name | type·price·duration·child_friendly_rating
- Loading state: show spinner when status is not completed, auto-poll via `useTravelPlan`
- Error state: show error_message if failed

- [ ] **Step 3: Verify and commit**

```bash
npx tsc --noEmit
git add src/pages/life/travel-list.tsx src/pages/life/travel-detail.tsx
git commit -m "feat(life): implement travel plan list and detail pages"
```

---

### Task 6: Rental Module — List + Detail Pages

**Files:**
- Modify: `src/pages/life/rental-list.tsx`
- Modify: `src/pages/life/rental-detail.tsx`

- [ ] **Step 1: Implement rental list page**

Key elements:
- Breadcrumb: "← 返回生活助手"
- Header: "房源列表" + "+ 新建搜索" button
- Filter tags (gray badges): shows last search params if available
- Property cards: address + price (green if within budget, orange if over), type·beds·baths, feature tags (EPC, budget status)
- "+ 新建搜索" → Sheet with form:
  - location (default "Rotherhithe"), location_identifier, max_price (default 2800), min_bedrooms (default 3)
  - property_types (multi-select checkboxes), radius, dont_show
  - Warning: "⏳ 搜索约需 1-3 分钟"
- Submit → `useCreateRentalSearch` → track search_id → poll `useRentalSearchResult` → on completed, invalidate properties list
- Empty state when no properties

- [ ] **Step 2: Implement rental detail page**

Key elements:
- Breadcrumb: "← 返回房源列表"
- Price (pcm + pw if available), address
- Info grid: type, bedrooms, bathrooms, size, furnish, EPC, council tax
- Terms: available_date, deposit, min_tenancy
- Amenities: garden, parking (check/x icons)
- Description text
- Key features list
- Agent info: name, phone
- Image gallery (if images exist)
- "打开 Rightmove" external link button → source_url

- [ ] **Step 3: Verify and commit**

```bash
npx tsc --noEmit
git add src/pages/life/rental-list.tsx src/pages/life/rental-detail.tsx
git commit -m "feat(life): implement rental search list and detail pages"
```

---

### Task 7: Accommodation Module — List + Detail + Compare

**Files:**
- Modify: `src/pages/life/accommodation-list.tsx`
- Modify: `src/pages/life/accommodation-detail.tsx`

- [ ] **Step 1: Implement accommodation list page**

Key elements:
- Breadcrumb: "← 返回生活助手"
- Header: "住宿记录" + "比较已选 (N)" button + "+ 新建搜索" button
- Filter tags: destination, dates, party size
- 2-column card grid, each card:
  - Checkbox (for compare selection, local state `selectedIds: string[]`)
  - Name, rating (review_count), price_per_night, total_price
  - Distance from centre
  - Feature tags: free_cancellation(green), breakfast(purple), wifi(green), parking(green), kitchen, pets
- Sort buttons: 按价格/评分/距离
- "+ 新建搜索" → Sheet form: destination, checkin, checkout, adults, children, children_ages (TagInput), rooms, max_price_total, sort_by, min_rating
- "比较已选" → opens Dialog with comparison table (enabled when selectedIds.length >= 2)
- Compare Dialog: uses `useCompareAccommodations(selectedIds)`, renders table with rows for: total_price, price_per_night, rating, review_count, distance, kitchen, parking, cancellation, breakfast, wifi, child_free, pool, hot_tub, pets

- [ ] **Step 2: Implement accommodation detail page**

Key elements:
- Breadcrumb: "← 返回住宿列表"
- Name, rating, price summary
- Property details: type, bedrooms, bathrooms, sleeps
- Amenities grid (boolean fields as check/x)
- "验证链接" button → `useVerifyListing` → shows result
- "打开 Booking" external link → booking_url
- Images gallery

- [ ] **Step 3: Verify and commit**

```bash
npx tsc --noEmit
git add src/pages/life/accommodation-list.tsx src/pages/life/accommodation-detail.tsx
git commit -m "feat(life): implement accommodation list, detail, and compare"
```

---

### Task 8: Build Verification + Deploy

- [ ] **Step 1: Full build**

Run: `cd E:/projects/coding/python/foreend-platform && npm run build 2>&1 | tail -10`
Expected: Build succeeds

- [ ] **Step 2: Docker build + push + deploy**

```bash
docker build -t lzjxccode/personal-info-frontend:v1.0.26 -t lzjxccode/personal-info-frontend:latest .
docker push lzjxccode/personal-info-frontend:v1.0.26
docker push lzjxccode/personal-info-frontend:latest
kubectl rollout restart deployment/foreend-platform -n apps
kubectl rollout status deployment/foreend-platform -n apps --timeout=120s
```

- [ ] **Step 3: Playwright browser verification**

```
mcp__playwright__browser_navigate(url="http://192.168.1.191:31765/life")
# Verify: Landing page with 3 module cards
mcp__playwright__browser_take_screenshot(type="png", fullPage=true)

# Navigate to travel module
mcp__playwright__browser_click(element="旅游计划 card")
# Verify: Travel plan list page loads

# Navigate back and test rental
mcp__playwright__browser_navigate(url="http://192.168.1.191:31765/life/rental")
# Verify: Rental list page loads

# Test accommodation
mcp__playwright__browser_navigate(url="http://192.168.1.191:31765/life/accommodation")
# Verify: Accommodation list page loads
```

- [ ] **Step 4: Final commit if cleanup needed**

Only commit if changes were made during verification.
