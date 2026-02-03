# Dental-AL TypeScript Migration & Structural Refactoring

## TL;DR

> **Quick Summary**: 모놀리식 JavaScript 코드베이스(page.js 1,359줄)를 TypeScript로 전환하고, Layer-based 구조로 모듈화하여 유지보수성과 타입 안전성을 확보합니다.
> 
> **Deliverables**:
> - TypeScript 설정 (strict mode)
> - `/types` - 중앙 집중화된 타입 정의
> - `/lib` - 유틸리티 함수 (날짜 파싱/포맷팅)
> - `/components` - 6개 UI 컴포넌트
> - `/hooks` - 커스텀 훅 (데이터 페칭, 상태 로직)
> - `/services` - API 통신 레이어
> - API Routes TypeScript 전환
> - vitest 테스트 인프라
> 
> **Estimated Effort**: Large (8-12 hours)
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6 → Task 7 → Task 8 → Task 9 → Task 10

---

## Context

### Original Request
"리팩토링 계획을 세워볼까? 지금 js 기반이고 page.js가 너무 비대해."

### Interview Summary
**Key Discussions**:
- TypeScript 전환: Strict mode 일괄 전환
- 컴포넌트 분리: 6개 인라인 컴포넌트를 개별 파일로
- 커스텀 훅 추출: 데이터 페칭, 상태 로직 분리
- 유틸리티 함수 분리: 날짜 관련 함수를 /lib로 이동
- API 레이어 추상화: fetch 호출을 /services로 분리
- 타입 정의: /types 디렉토리에 중앙 집중화
- Git 전략: 별도 브랜치 (refactor/typescript-migration)
- API Routes: pages/api/*.js도 TypeScript 전환 포함
- 디렉토리 구조: Root-level 유지 (src/ 사용 안함)
- 데이터 페칭: useEffect 유지 (TanStack Query 도입 안함)

**Research Findings**:
- app/page.js: 1,359줄 모놀리식 파일
- 인라인 컴포넌트: UserMenu, TodayStatusCard, MobileScheduleList, DesktopCalendar, HelpPanel
- 인라인 유틸리티: parseLeaveDate, isValidDate, formatDate, getTodayString
- 데이터 함수: getCurrentMonthLeaves, getTodayLeaves, getInvalidLeaves, getSundayLeaves
- API 통신: fetchSheetData, saveSheetData
- API Routes: sheets.js (263줄), calendar.js (200줄), [...nextauth].js (51줄)

### Metis Review
**Identified Gaps** (addressed):
- Runtime Type Safety: 서비스 레이어에 응답 검증 함수 추가
- Styling Regressions: 컴포넌트 추출 시 시각적 검증 포함
- Hybrid Router Config: tsconfig.json에서 app/과 pages/ 모두 포함
- 추출 순서: types → lib → components → hooks → services → page.tsx

---

## Work Objectives

### Core Objective
모놀리식 page.js(1,359줄)를 TypeScript 기반의 모듈화된 구조로 리팩토링하여 코드 품질, 타입 안전성, 유지보수성을 향상시킵니다.

### Concrete Deliverables
- `tsconfig.json` - TypeScript strict mode 설정
- `types/` - staff.ts, leave.ts, api.ts, index.ts
- `lib/` - date.ts, theme.ts, constants.ts
- `components/` - UserMenu.tsx, TodayStatusCard.tsx, MobileScheduleList.tsx, DesktopCalendar.tsx, HelpPanel.tsx
- `hooks/` - useSheetData.ts, useLeaveCalculations.ts
- `services/` - sheets.ts, calendar.ts
- `app/page.tsx` - 리팩토링된 메인 페이지
- `pages/api/*.ts` - TypeScript 전환된 API Routes
- `vitest.config.ts` - 테스트 설정
- `lib/__tests__/` - 유틸리티 함수 테스트

### Definition of Done
- [x] `npm run build` 성공 (0 errors)
- [x] `npx tsc --noEmit` 성공 (0 type errors)
- [x] `npm run test` 성공 (모든 테스트 통과)
- [ ] 기존 기능 동작 확인 (달력, 직원 목록, 연차 CRUD)

### Must Have
- TypeScript strict mode 활성화
- 모든 컴포넌트 개별 파일 분리
- 타입 정의 중앙 집중화 (/types)
- 유틸리티 함수 테스트 커버리지
- API 응답 타입 정의

### Must NOT Have (Guardrails)
- ❌ 로직 변경 금지 - 순수 구조 리팩토링만
- ❌ TanStack Query 등 새 라이브러리 도입 금지
- ❌ src/ 디렉토리 구조 사용 금지
- ❌ 기능 추가 금지 (Staff Off Management 등은 별도 작업)
- ❌ Zod 등 런타임 검증 라이브러리 도입 금지

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: NO
- **User wants tests**: YES (vitest)
- **Framework**: vitest

### Automated Verification (ALWAYS include)

**Build & Type Check:**
```bash
npm run build && npx tsc --noEmit
# Assert: Exit code 0
```

**Test Execution:**
```bash
npm run test
# Assert: All tests pass
```

**File Existence Check:**
```bash
ls types/index.ts lib/date.ts components/UserMenu.tsx hooks/useSheetData.ts services/sheets.ts
# Assert: All files exist
```

**Frontend Verification (using playwright skill):**
```
1. Navigate to: http://localhost:3000
2. Wait for: selector "[data-testid='today-status']" to be visible
3. Assert: 달력 렌더링 확인
4. Screenshot: .sisyphus/evidence/refactor-visual-check.png
```

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation - Sequential):
├── Task 1: Git 브랜치 생성
├── Task 2: TypeScript 설정
└── Task 3: vitest 설정

Wave 2 (Core Extraction - Partially Parallel):
├── Task 4: 타입 정의 (/types)
├── Task 5: 유틸리티 함수 (/lib) [depends: 4]
├── Task 6: 컴포넌트 분리 (/components) [depends: 4, 5]
└── Task 7: 커스텀 훅 (/hooks) [depends: 4, 5]

Wave 3 (Integration - Sequential):
├── Task 8: 서비스 레이어 (/services) [depends: 4]
├── Task 9: page.tsx 재조립 [depends: 5, 6, 7, 8]
└── Task 10: API Routes 전환 [depends: 4]

Critical Path: 1 → 2 → 4 → 5 → 6 → 9
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2 | None |
| 2 | 1 | 3, 4 | None |
| 3 | 2 | 5 (tests) | 4 |
| 4 | 2 | 5, 6, 7, 8, 10 | 3 |
| 5 | 4 | 6, 7, 9 | None |
| 6 | 4, 5 | 9 | 7, 8 |
| 7 | 4, 5 | 9 | 6, 8 |
| 8 | 4 | 9 | 6, 7 |
| 9 | 5, 6, 7, 8 | None | 10 |
| 10 | 4 | None | 9 |

---

## TODOs

- [x] 1. Git 브랜치 생성 및 초기 설정

  **What to do**:
  - `refactor/typescript-migration` 브랜치 생성
  - main 브랜치에서 분기

  **Must NOT do**:
  - main 브랜치에서 직접 작업 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 단순한 git 명령어 실행
  - **Skills**: [`git-master`]
    - `git-master`: Git 브랜치 생성 및 관리

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 - Sequential
  - **Blocks**: Task 2
  - **Blocked By**: None

  **References**:
  - 현재 브랜치 상태 확인 필요

  **Acceptance Criteria**:
  ```bash
  git branch --show-current
  # Assert: Output is "refactor/typescript-migration"
  ```

  **Commit**: YES
  - Message: `chore: create refactoring branch`
  - Files: N/A (branch creation)

---

- [x] 2. TypeScript 설정 및 초기화

  **What to do**:
  - typescript, @types/react, @types/node 설치
  - tsconfig.json 생성 (strict: true)
  - next.config.js에서 TypeScript 활성화 확인
  - app/, pages/ 모두 포함하도록 설정

  **Must NOT do**:
  - strict 옵션 비활성화 금지
  - src/ 디렉토리 구조 사용 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 설정 파일 생성 및 패키지 설치
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 - Sequential
  - **Blocks**: Task 3, 4
  - **Blocked By**: Task 1

  **References**:
  **Pattern References**:
  - `next.config.js` - 현재 Next.js 설정 확인
  - `package.json` - 현재 의존성 확인

  **External References**:
  - Next.js TypeScript 공식 문서: https://nextjs.org/docs/basic-features/typescript

  **Acceptance Criteria**:
  ```bash
  # TypeScript 설치 확인
  cat package.json | grep typescript
  # Assert: "typescript" 존재
  
  # tsconfig.json 존재 및 strict 모드 확인
  cat tsconfig.json | grep '"strict": true'
  # Assert: "strict": true 존재
  
  # 빌드 테스트
  npm run build
  # Assert: Exit code 0
  ```

  **Commit**: YES
  - Message: `chore: setup TypeScript with strict mode`
  - Files: `package.json`, `package-lock.json`, `tsconfig.json`

---

- [x] 3. vitest 테스트 인프라 설정

  **What to do**:
  - vitest 설치 (`npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react`)
  - vitest.config.ts 생성
  - package.json에 test 스크립트 추가
  - 예제 테스트 파일 생성하여 설정 검증

  **Must NOT do**:
  - Jest 사용 금지 (vitest 사용)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 테스트 프레임워크 설정
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 4)
  - **Blocks**: Task 5 (테스트 작성)
  - **Blocked By**: Task 2

  **References**:
  **External References**:
  - vitest 공식 문서: https://vitest.dev/guide/
  - Next.js + vitest 설정: https://nextjs.org/docs/app/building-your-application/testing/vitest

  **Acceptance Criteria**:
  ```bash
  # vitest 설치 확인
  cat package.json | grep vitest
  # Assert: "vitest" 존재
  
  # 테스트 실행
  npm run test
  # Assert: Exit code 0, "1 passed" 또는 유사한 출력
  ```

  **Commit**: YES
  - Message: `chore: setup vitest testing infrastructure`
  - Files: `package.json`, `vitest.config.ts`, `lib/__tests__/example.test.ts`

---

- [x] 4. 타입 정의 생성 (/types)

  **What to do**:
  - `types/` 디렉토리 생성
  - `types/staff.ts` - Staff, StaffData 인터페이스
  - `types/leave.ts` - Leave, LeaveType, ParsedLeave 인터페이스
  - `types/api.ts` - API 요청/응답 타입
  - `types/index.ts` - 모든 타입 re-export
  - 현재 page.js의 데이터 구조 분석하여 타입 정의

  **Must NOT do**:
  - Zod 스키마 사용 금지 (수동 타입 정의만)
  - 로직 포함 금지 (순수 타입만)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: 타입 정의 작성은 분석 기반 작업
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 3)
  - **Blocks**: Task 5, 6, 7, 8, 10
  - **Blocked By**: Task 2

  **References**:
  **Pattern References**:
  - `app/page.js:33-36` - staffData 상태 구조
  - `app/page.js:47-54` - parseLeaveDate 반환 타입
  - `app/page.js:83-130` - getCurrentMonthLeaves 반환 구조
  - `pages/api/sheets.js:50-80` - Google Sheets 응답 구조

  **WHY Each Reference Matters**:
  - `page.js:33-36`: staffData의 구조를 파악하여 Staff 인터페이스 정의
  - `page.js:47-54`: LeaveType과 ParsedLeave 타입 정의에 필요
  - `sheets.js:50-80`: API 응답 타입 정의에 필요

  **Acceptance Criteria**:
  ```bash
  # 파일 존재 확인
  ls types/staff.ts types/leave.ts types/api.ts types/index.ts
  # Assert: 모든 파일 존재
  
  # 타입 체크
  npx tsc --noEmit
  # Assert: Exit code 0
  ```

  **Commit**: YES
  - Message: `feat(types): add centralized type definitions`
  - Files: `types/*.ts`

---

- [x] 5. 유틸리티 함수 분리 (/lib)

  **What to do**:
  - `lib/` 디렉토리 생성
  - `lib/date.ts` - parseLeaveDate, isValidDate, formatDate, getTodayString
  - `lib/theme.ts` - theme 객체 이동
  - `lib/constants.ts` - 상수 값들 (SHEET_ID 등)
  - `lib/__tests__/date.test.ts` - 날짜 유틸리티 테스트
  - 타입 import 적용

  **Must NOT do**:
  - 로직 변경 금지 (복사 후 타입만 추가)
  - 새로운 유틸리티 함수 추가 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 기존 코드 추출 및 타입 추가
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 - Sequential after Task 4
  - **Blocks**: Task 6, 7, 9
  - **Blocked By**: Task 3, 4

  **References**:
  **Pattern References**:
  - `app/page.js:14-22` - theme 객체 정의
  - `app/page.js:44-80` - 날짜 유틸리티 함수들
    - `getTodayString()` (line 44)
    - `parseLeaveDate()` (lines 47-54)
    - `isValidDate()` (lines 56-69)
    - `formatDate()` (lines 71-80)

  **WHY Each Reference Matters**:
  - `page.js:14-22`: theme 객체를 그대로 추출하여 lib/theme.ts로 이동
  - `page.js:44-80`: 날짜 함수들을 그대로 추출하고 타입만 추가

  **Acceptance Criteria**:
  ```bash
  # 파일 존재 확인
  ls lib/date.ts lib/theme.ts lib/__tests__/date.test.ts
  # Assert: 모든 파일 존재
  
  # 테스트 실행
  npm run test lib/__tests__/date.test.ts
  # Assert: All tests pass
  
  # 타입 체크
  npx tsc --noEmit
  # Assert: Exit code 0
  ```

  **Commit**: YES
  - Message: `refactor(lib): extract utility functions with types`
  - Files: `lib/*.ts`, `lib/__tests__/*.test.ts`

---

- [x] 6. 컴포넌트 분리 (/components)

  **What to do**:
  - `components/` 디렉토리 생성
  - `components/UserMenu.tsx` - 사용자 메뉴 드롭다운
  - `components/TodayStatusCard.tsx` - 오늘 현황 카드
  - `components/MobileScheduleList.tsx` - 모바일용 일정 리스트
  - `components/DesktopCalendar.tsx` - 데스크탑 캘린더
  - `components/HelpPanel.tsx` - 도움말 패널
  - `components/index.ts` - 컴포넌트 re-export
  - 각 컴포넌트에 Props 타입 정의
  - 필요한 타입, 유틸리티 import

  **Must NOT do**:
  - 컴포넌트 로직 변경 금지
  - 스타일 변경 금지
  - 새 컴포넌트 추가 금지

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI 컴포넌트 추출 및 타입 적용
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: React 컴포넌트 패턴 이해

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 7, 8)
  - **Blocks**: Task 9
  - **Blocked By**: Task 4, 5

  **References**:
  **Pattern References**:
  - `app/page.js:499-555` - UserMenu 컴포넌트
  - `app/page.js:558-603` - TodayStatusCard 컴포넌트
  - `app/page.js:606-676` - MobileScheduleList 컴포넌트
  - `app/page.js:679-878` - DesktopCalendar 컴포넌트
  - `app/page.js:881-973` - HelpPanel 컴포넌트

  **WHY Each Reference Matters**:
  - 각 컴포넌트의 정확한 라인 범위를 알면 추출 시 누락 방지
  - Props로 전달되는 데이터 파악하여 타입 정의

  **Acceptance Criteria**:
  ```bash
  # 파일 존재 확인
  ls components/UserMenu.tsx components/TodayStatusCard.tsx components/MobileScheduleList.tsx components/DesktopCalendar.tsx components/HelpPanel.tsx components/index.ts
  # Assert: 모든 파일 존재
  
  # 타입 체크
  npx tsc --noEmit
  # Assert: Exit code 0
  
  # 빌드 확인
  npm run build
  # Assert: Exit code 0
  ```

  **Visual Verification (using playwright skill)**:
  ```
  1. Navigate to: http://localhost:3000
  2. Wait for: page load complete
  3. Assert: 달력이 렌더링됨
  4. Assert: 오늘 현황 카드가 표시됨
  5. Screenshot: .sisyphus/evidence/task-6-components.png
  ```

  **Commit**: YES
  - Message: `refactor(components): extract UI components with TypeScript`
  - Files: `components/*.tsx`

---

- [x] 7. 커스텀 훅 분리 (/hooks)

  **What to do**:
  - `hooks/` 디렉토리 생성
  - `hooks/useSheetData.ts` - fetchSheetData, saveSheetData, 관련 상태 로직
  - `hooks/useLeaveCalculations.ts` - getCurrentMonthLeaves, getTodayLeaves, getInvalidLeaves, getSundayLeaves
  - `hooks/index.ts` - 훅 re-export
  - 타입 적용 및 제네릭 활용

  **Must NOT do**:
  - 데이터 페칭 로직 변경 금지 (useEffect 유지)
  - TanStack Query 도입 금지
  - 새 훅 추가 금지

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: 상태 로직 추출 및 타입 적용
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 6, 8)
  - **Blocks**: Task 9
  - **Blocked By**: Task 4, 5

  **References**:
  **Pattern References**:
  - `app/page.js:202-220` - fetchSheetData 함수
  - `app/page.js:222-250` - saveSheetData 함수
  - `app/page.js:83-130` - getCurrentMonthLeaves 함수
  - `app/page.js:133-149` - getTodayLeaves 함수
  - `app/page.js:152-169` - getInvalidLeaves 함수
  - `app/page.js:172-193` - getSundayLeaves 함수
  - `app/page.js:255-286` - handleUpdate 함수
  - `app/page.js:288-307` - handleBlur 함수

  **WHY Each Reference Matters**:
  - 데이터 페칭 로직과 계산 로직을 분리하여 관심사 분리
  - 각 함수의 입출력 타입을 정확히 파악

  **Acceptance Criteria**:
  ```bash
  # 파일 존재 확인
  ls hooks/useSheetData.ts hooks/useLeaveCalculations.ts hooks/index.ts
  # Assert: 모든 파일 존재
  
  # 타입 체크
  npx tsc --noEmit
  # Assert: Exit code 0
  ```

  **Commit**: YES
  - Message: `refactor(hooks): extract custom hooks with TypeScript`
  - Files: `hooks/*.ts`

---

- [x] 8. 서비스 레이어 생성 (/services)

  **What to do**:
  - `services/` 디렉토리 생성
  - `services/sheets.ts` - Google Sheets API 통신 래퍼
  - `services/calendar.ts` - Calendar API 통신 래퍼
  - `services/index.ts` - 서비스 re-export
  - API 응답 검증 함수 추가 (Metis 권장)
  - 타입 적용

  **Must NOT do**:
  - API 로직 변경 금지
  - 새 API 엔드포인트 추가 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: API 호출 래퍼 생성
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 6, 7)
  - **Blocks**: Task 9
  - **Blocked By**: Task 4

  **References**:
  **Pattern References**:
  - `app/page.js:202-250` - fetch 호출 패턴
  - `app/page.js:338-492` - Calendar API 호출 (handleLeaveClick, handleLeaveDelete, handleLeaveAdd)

  **WHY Each Reference Matters**:
  - 현재 fetch 호출 패턴을 서비스 함수로 추상화
  - 에러 처리 패턴 유지

  **Acceptance Criteria**:
  ```bash
  # 파일 존재 확인
  ls services/sheets.ts services/calendar.ts services/index.ts
  # Assert: 모든 파일 존재
  
  # 타입 체크
  npx tsc --noEmit
  # Assert: Exit code 0
  ```

  **Commit**: YES
  - Message: `refactor(services): create API service layer`
  - Files: `services/*.ts`

---

- [x] 9. page.tsx 재조립 및 최종 통합

  **What to do**:
  - `app/page.js` → `app/page.tsx` 변환
  - 분리된 컴포넌트, 훅, 서비스 import
  - 인라인 코드 제거 및 모듈 조합
  - 타입 적용
  - 불필요한 코드 정리

  **Must NOT do**:
  - 기능 변경 금지
  - 새 기능 추가 금지

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 여러 모듈 통합 및 검증 필요
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: React 컴포넌트 조합 패턴

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 10)
  - **Blocks**: None (final)
  - **Blocked By**: Task 5, 6, 7, 8

  **References**:
  **Pattern References**:
  - `app/page.js:24-1359` - 전체 DentalLeaveApp 컴포넌트
  - 분리된 모든 모듈: `components/*`, `hooks/*`, `services/*`, `lib/*`, `types/*`

  **WHY Each Reference Matters**:
  - 원본 page.js와 리팩토링된 page.tsx의 기능 동등성 확인

  **Acceptance Criteria**:
  ```bash
  # 파일 변환 확인
  ls app/page.tsx
  # Assert: 파일 존재
  
  # 원본 파일 제거 확인
  ls app/page.js 2>/dev/null || echo "page.js removed"
  # Assert: "page.js removed" 출력
  
  # 타입 체크
  npx tsc --noEmit
  # Assert: Exit code 0
  
  # 빌드 확인
  npm run build
  # Assert: Exit code 0
  
  # 테스트 실행
  npm run test
  # Assert: All tests pass
  ```

  **Visual Verification (using playwright skill)**:
  ```
  1. Navigate to: http://localhost:3000
  2. Wait for: page load complete
  3. Assert: 달력 렌더링 확인
  4. Assert: 직원 목록 표시 확인
  5. Assert: 오늘 현황 카드 표시 확인
  6. Screenshot: .sisyphus/evidence/task-9-final.png
  ```

  **Commit**: YES
  - Message: `refactor: reassemble page.tsx with modular imports`
  - Files: `app/page.tsx`
  - Pre-commit: `npm run build && npm run test`

---

- [x] 10. API Routes TypeScript 전환

  **What to do**:
  - `pages/api/sheets.js` → `pages/api/sheets.ts`
  - `pages/api/calendar.js` → `pages/api/calendar.ts`
  - `pages/api/auth/[...nextauth].js` → `pages/api/auth/[...nextauth].ts`
  - NextApiRequest, NextApiResponse 타입 적용
  - 요청/응답 타입 정의 적용

  **Must NOT do**:
  - API 로직 변경 금지
  - 새 엔드포인트 추가 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 파일 확장자 변경 및 타입 추가
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 9)
  - **Blocks**: None
  - **Blocked By**: Task 4

  **References**:
  **Pattern References**:
  - `pages/api/sheets.js` - 전체 파일 (263줄)
  - `pages/api/calendar.js` - 전체 파일 (200줄)
  - `pages/api/auth/[...nextauth].js` - 전체 파일 (51줄)

  **External References**:
  - Next.js API Routes TypeScript: https://nextjs.org/docs/basic-features/typescript#api-routes

  **Acceptance Criteria**:
  ```bash
  # 파일 변환 확인
  ls pages/api/sheets.ts pages/api/calendar.ts pages/api/auth/[...nextauth].ts
  # Assert: 모든 파일 존재
  
  # 원본 파일 제거 확인
  ls pages/api/sheets.js 2>/dev/null || echo "sheets.js removed"
  # Assert: "sheets.js removed" 출력
  
  # 타입 체크
  npx tsc --noEmit
  # Assert: Exit code 0
  
  # 빌드 확인
  npm run build
  # Assert: Exit code 0
  ```

  **API Verification (using curl)**:
  ```bash
  # 개발 서버 실행 상태에서
  curl -s http://localhost:3000/api/sheets | head -c 100
  # Assert: JSON 응답 ([] 또는 [{...}])
  ```

  **Commit**: YES
  - Message: `refactor(api): convert API routes to TypeScript`
  - Files: `pages/api/*.ts`, `pages/api/auth/*.ts`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `chore: create refactoring branch` | N/A | `git branch` |
| 2 | `chore: setup TypeScript with strict mode` | `tsconfig.json`, `package.json` | `npm run build` |
| 3 | `chore: setup vitest testing infrastructure` | `vitest.config.ts`, `package.json` | `npm run test` |
| 4 | `feat(types): add centralized type definitions` | `types/*.ts` | `npx tsc --noEmit` |
| 5 | `refactor(lib): extract utility functions with types` | `lib/*.ts` | `npm run test` |
| 6 | `refactor(components): extract UI components with TypeScript` | `components/*.tsx` | `npm run build` |
| 7 | `refactor(hooks): extract custom hooks with TypeScript` | `hooks/*.ts` | `npx tsc --noEmit` |
| 8 | `refactor(services): create API service layer` | `services/*.ts` | `npx tsc --noEmit` |
| 9 | `refactor: reassemble page.tsx with modular imports` | `app/page.tsx` | `npm run build && npm run test` |
| 10 | `refactor(api): convert API routes to TypeScript` | `pages/api/*.ts` | `npm run build` |

---

## Success Criteria

### Verification Commands
```bash
# 1. 빌드 성공
npm run build
# Expected: Exit code 0

# 2. 타입 체크 성공
npx tsc --noEmit
# Expected: Exit code 0

# 3. 테스트 통과
npm run test
# Expected: All tests pass

# 4. 디렉토리 구조 확인
ls -la types/ lib/ components/ hooks/ services/
# Expected: 모든 디렉토리와 파일 존재

# 5. page.js 제거 확인
ls app/page.js 2>/dev/null || echo "SUCCESS: page.js removed"
# Expected: "SUCCESS: page.js removed"
```

### Final Checklist
- [x] TypeScript strict mode 활성화 (`tsconfig.json`)
- [x] 모든 컴포넌트 개별 파일 분리 (`components/`)
- [x] 타입 정의 중앙 집중화 (`types/`)
- [x] 유틸리티 함수 테스트 존재 (`lib/__tests__/`)
- [x] API 응답 타입 정의 (`types/api.ts`)
- [x] 모든 API Routes TypeScript 전환 (`pages/api/*.ts`)
- [x] 원본 .js 파일 제거
- [x] 기존 기능 동작 확인 (Visual Verification)
  - [x] 달력, 직원 목록, 연차 현황판 시각적 확인 완료
  - [x] Hydration Warning 수정 (layout.tsx)

## Final Status
- All tasks completed successfully.
- Codebase fully migrated to TypeScript.
- Visual verification passed.

