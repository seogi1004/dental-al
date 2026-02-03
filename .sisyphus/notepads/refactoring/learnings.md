## TypeScript Setup
- Installed typescript, @types/react, @types/node, @types/react-dom
- Created tsconfig.json with strict: true
- Included app/ and pages/ directories in tsconfig.json
- Next.js automatically generated next-env.d.ts during build
## Patterns & Conventions
- Defined core domain types for Staff and Leave.
- Separated API request/response types for better maintenance.
- Used re-export pattern in  for cleaner imports.
## Patterns & Conventions
- Defined core domain types for Staff and Leave.
- Separated API request/response types for better maintenance.
- Used re-export pattern in types/index.ts for cleaner imports.

## Vitest Setup (2026-02-03)
- Successfully configured Vitest for a Next.js project.
- Key packages installed: vitest, @vitejs/plugin-react, jsdom, @testing-library/react, @testing-library/jest-dom.
- Configured `vitest.config.ts` with `jsdom` environment and `@` alias support.
- Added `vitest.setup.ts` to include `jest-dom` matchers.
- Verified setup with a basic test in `lib/__tests__/example.test.ts`.
- Explicitly import 'describe', 'it', 'expect' from 'vitest' in test files to pass 'tsc --noEmit' even if globals are enabled in vitest config.
### Service Layer Pattern
- Created a service layer in `services/` to abstract API calls from UI components.
- Standardized error handling using a `handleResponse` helper that maintains the existing error message extraction logic.
- Applied TypeScript types from `@/types` to ensure type safety.
- Extracted data fetching and calculation logic into custom hooks to improve maintainability and readability.
- Used TypeScript to ensure type safety in the newly created hooks.

## Component Extraction - Learnings (2026-02-03)

### Task: Extract 5 UI components from app/page.js

#### Components Extracted:
1. UserMenu.tsx - User profile dropdown with login/logout
2. TodayStatusCard.tsx - Today's leave status display
3. MobileScheduleList.tsx - Mobile view of monthly leaves
4. DesktopCalendar.tsx - Desktop calendar grid view
5. HelpPanel.tsx - Static help guide component

#### Key Patterns:
- All components use 'use client' directive
- Import types from @/types
- Import utilities from @/lib/date
- Consistent prop interface naming: {ComponentName}Props
- WarningBanner duplicated in MobileScheduleList and DesktopCalendar (future refactor opportunity)

#### Type System Notes:
- StaffData is a type alias for Staff[] (not an individual staff)
- Props must use Staff[] not StaffData[]
- Leave types properly imported from @/types

#### Verification:
- npx tsc --noEmit passed successfully
- All components properly typed with TypeScript
## API Routes TypeScript Conversion
- Successfully converted sheets.js, calendar.js, and [...nextauth].js to .ts
- Applied NextApiRequest, NextApiResponse, and NextAuthOptions types
- Fixed pre-existing build errors in app/page.tsx related to formatDate and NextAuth session properties
- Added types/next-auth.d.ts for module augmentation of Session and JWT
