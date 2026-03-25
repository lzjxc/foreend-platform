# Documentation Update - 2026-03-25

## Summary

Added housing management module documentation to CLAUDE.md after implementing the full frontend for property/tenancy management under `/life/housing/*`.

## Changes

### CLAUDE.md
- **Added**: Housing module to feature table (row: 房产管理 `/life/housing`)
- **Added**: `use-housing.ts` to hooks section
- **Added**: 10 housing components (`src/components/housing/`) to project structure
- **Added**: 5 housing pages (`src/pages/life/housing-*.tsx`) to project structure
- **Added**: `housing.ts` to types section (23 total types now)
- **Added**: 15 housing API endpoints to endpoint table (via `/life-api`)
- **Added**: Housing route entry to Tab navigation section (single-page scroll + anchor nav)
- **Updated**: Types count from 22 to 23
- **Updated**: Life landing description to include housing card

### docs/api.md
- No changes (housing APIs are backend endpoints, not frontend-served)

### README.md
- No changes needed (auto-generated from CLAUDE.md)

## New Files in This Iteration

| File | Lines | Purpose |
|------|-------|---------|
| `src/types/housing.ts` | 248 | Types, enums, display helpers |
| `src/hooks/use-housing.ts` | 419 | 18 React Query hooks |
| `src/components/housing/*.tsx` | 1070 | 10 components |
| `src/pages/life/housing-*.tsx` | 697 | 4 pages |
| **Total** | **2993** | **16 new files + 3 modified** |
