# AGENTS.md - Dental Leave Management System

> **⚠️ CRITICAL**: 사용자와의 모든 대화는 **반드시 한국어**로 진행하십시오. (코드, 로그, 에러 메시지 제외)

이 문서는 **더데이치과 연차 관리 시스템 (Dental Leave Management System)** 프로젝트의 AI 에이전트를 위한 **Master Guide**입니다.
이 프로젝트는 구글 스프레드시트를 백엔드로 활용하는 직원 연차 및 휴가 관리 웹 애플리케이션입니다.

## Agent Mapping (OpenCode/OmO)

서브에이전트/모델 매핑 (~/.config/opencode/oh-my-opencode.json 기준):

### 주요 에이전트

- sisyphus: google/antigravity-gemini-3-pro (high) - 메인 코딩 에이전트
- oracle: openai/gpt-5.2-codex-high - 분석/설계/고난이도 디버깅
- prometheus: google/antigravity-claude-opus-4-5-thinking (low) - 계획 수립
- librarian: google/antigravity-gemini-3-pro (high) - 외부 docs/OSS
- explore: google/antigravity-gemini-3-flash (high) - 코드베이스 탐색
- multimodal-looker: google/antigravity-gemini-3-flash (high) - 이미지/PDF
- metis: google/antigravity-gemini-3-pro (high) - 사전 분석
- momus: google/antigravity-claude-opus-4-5-thinking (max) - 검토
- atlas: google/antigravity-claude-opus-4-5-thinking (max) - 오케스트레이터

### 카테고리별 모델

- visual-engineering: google/antigravity-claude-sonnet-4-5-thinking (low) - UI/UX
- ultrabrain: openai/gpt-5.2-codex-high - 복잡한 아키텍처
- artistry: google/antigravity-gemini-3-pro (high) - 창의적 작업
- quick: google/antigravity-gemini-3-flash (high) - 간단한 작업
- unspecified-low: google/antigravity-gemini-3-flash (high) - 분류 불가 (저)
- unspecified-high: google/antigravity-gemini-3-pro (high) - 분류 불가 (고)
- writing: google/antigravity-gemini-3-pro (high) - 문서 작성

내장 에이전트: general(일반 작업), plan(계획), build(빌드 전용)
도구 사용: 파일 수정은 edit, 계획/체크리스트는 todowrite 사용

## Project Context

### Business Goal

더데이치과 구성원의 연차 및 휴가 일정을 효율적으로 관리하고 공유함.
- **현황판**: 당일 휴가자 및 근무자 실시간 확인
- **캘린더**: 월별 연차/오프 일정 시각화
- **자동화**: 구글 시트와 양방향 동기화로 관리 편의성 증대
- **신청서**: 연차 신청서 양식 자동 생성 및 인쇄

### Architecture

Next.js 기반의 하이브리드 애플리케이션 (App Router + Pages Router API).

- **Frontend**: Next.js 16.1.6 (React 19), Tailwind CSS v4, Shadcn UI (Radix UI)
- **Backend**: Next.js API Routes (`pages/api`), Server Actions
- **Database**: Google Sheets (via Google Sheets API v4)
- **Auth**: NextAuth.js v4 (Google OAuth)
- **PWA**: next-pwa (앱 설치 지원)

### Tech Stack

- **Runtime**: Node.js (>=22.0.0)
- **Package Manager**: npm (lockfile: `package-lock.json`)
- **Framework**: Next.js 16.1.6
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4, Shadcn UI, Lucide React
- **State/Data**: Google Sheets API (No SQL DB)
- **Testing**: Vitest

## Operations

### Environment Requirements

- Node.js: 22+ 필수
- npm: 필수
- `.env` 설정 필수 (GOOGLE_CLIENT_ID, GOOGLE_SHEET_ID, NEXTAUTH_URL 등)

### Build Commands

- **개발 서버**: `npm run dev`
- **프로덕션 빌드**: `npm run build`
- **프로덕션 실행**: `npm run start`
- **린트**: `npm run lint`
- **테스트**: `npm run test`

### Database Operations (Google Sheets)

- 이 프로젝트는 전통적인 DB 마이그레이션이 없습니다.
- **데이터 구조**: 구글 시트의 컬럼 순서 및 시트 이름(`연차계산`, `2026년`, `2026년_오프`)에 의존합니다.
- **주의**: 시트 구조 변경 시 코드(`services/`, `pages/api/`) 수정이 필요합니다.

## Golden Rules (Immutable)

### Communication

- 사용자와의 대화: **한국어**
- 코드 내 로그/에러 메시지: 영어
- 주석: 한국어 또는 영어 (맥락에 맞게)

### Package Manager

- **npm 사용**: 프로젝트 루트에 `package-lock.json`이 존재하므로 `npm`을 사용합니다.
- `yarn`이나 `pnpm` 혼용 금지.

### Code Style & Patterns

- **Hybrid Structure**:
  - `app/`: 최신 App Router 페이지 및 레이아웃 (Server/Client Components)
  - `pages/api/`: 백엔드 API 로직 (Google Sheets 연동 등)
- **UI Components**: `components/` 디렉토리 내 Shadcn UI 및 커스텀 컴포넌트 활용
- **Styling**: Tailwind CSS 유틸리티 클래스 우선 사용
- **Type Safety**: `any` 사용 지양, Google Sheets 데이터 파싱 시 타입 가드 활용

## Context Map

작업 영역에 따라 아래 디렉토리를 참조하십시오.

- **[App Router (app)](./app)**
  - `page.tsx`: 메인 대시보드
  - `layout.tsx`: 전역 레이아웃 및 테마 제공자
- **[API Routes (pages/api)](./pages/api)**
  - `sheets.ts`: 구글 시트 데이터 동기화
  - `off.ts`: 오프 관리
  - `auth/`: 인증 핸들러
- **[Components (components)](./components)**
  - `ui/`: Shadcn UI 기본 컴포넌트
  - `HelpPanel.tsx`, `UserMenu.tsx`: 비즈니스 컴포넌트
- **[Services & Hooks (services, hooks)](./services)**
  - `services/`: 구글 시트 API 호출 및 데이터 비즈니스 로직
  - `hooks/`: 커스텀 React 훅
- **[Public (public)](./public)**
  - 정적 자산 및 PWA 설정 파일 (manifest.json 등)

---

**Dental Leave Management System Team**
