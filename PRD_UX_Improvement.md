# PRD: 연차/오프 관리 UX/UI 개선

## 1. 개요 (Overview)
본 문서는 더데이치과 연차 관리 시스템의 사용자 경험(UX) 및 인터페이스(UI) 개선, 특히 **연차 및 오프(Off)의 추가/수정 프로세스**를 현대화하고 직관적으로 개선하기 위한 요구사항을 정의합니다.

## 2. 배경 및 문제점 (Background & Problem Statement)
현재 시스템은 연차 및 오프 관리에 있어 다음과 같은 UX/UI 문제점을 가지고 있습니다:
*   **브라우저 기본 알림창 사용**: 데이터 입력(이름, 날짜, 타입 등)을 위해 `window.prompt`와 `window.confirm`을 연속적으로 사용하고 있어 사용자 경험이 매우 낙후되어 있습니다.
*   **입력 오류 가능성**: 사용자가 날짜 형식(예: `1/1`)이나 타입(AM/PM)을 텍스트로 직접 입력해야 하므로 오타 및 형식 오류가 빈번하게 발생합니다.
*   **모바일 사용성 저하**: 모바일 환경에서 여러 번의 팝업창이 뜨는 방식은 조작이 불편하고 흐름이 끊깁니다.
*   **피드백 부족**: 입력 즉시 유효성 검사(중복, 잘못된 날짜 등) 결과를 확인하기 어렵고, 저장이 완료된 후에야 목록에서 확인이 가능합니다.

## 3. 목표 (Goals)
*   **Shadcn UI 도입**: 브라우저 기본 `prompt` 창을 제거하고, **Shadcn UI (Radix UI + Tailwind CSS)** 기반의 모던한 모달 컴포넌트로 전면 교체합니다.
*   **입력 편의성 증대**: `Calendar`, `Select`, `RadioGroup` 등 직관적인 UI 컴포넌트를 활용하여 텍스트 입력을 최소화하고 오류를 방지합니다.
*   **통합된 경험 제공**: 연차와 오프 추가/수정을 일관된 UI(OffModal)에서 처리하여 학습 곡선을 낮춥니다.
*   **접근성 및 디자인**: Radix UI의 웹 접근성 준수와 Tailwind CSS의 유연한 스타일링을 통해 완성도 높은 UX를 제공합니다.

## 4. 주요 기능 요구사항 (Key Feature Requirements)

### 4.1 통합 일정 관리 모달 (Unified Schedule Modal: `OffModal`)
연차 및 오프를 추가하거나 수정할 때 사용할 `OffModal` 컴포넌트를 Shadcn UI 컴포넌트로 조립하여 구현합니다.

*   **진입점 (Entry Points)**:
    *   **데스크탑**: 캘린더 날짜의 `+` 버튼(연차), `OFF` 버튼(오프) 클릭 시.
    *   **모바일**: 일정 리스트 상단의 `연차 추가`, `오프 추가` 버튼 클릭 시.
    *   **수정 시**: 기존 일정 아이템 클릭 시.

*   **상세 UI 구성 (Shadcn Components)**:
    1.  **Container**: `Dialog`
        *   `DialogContent`: 모달 본문.
        *   `DialogHeader` > `DialogTitle`: "일정 추가" / "일정 수정".
    2.  **Form**: `Form` (react-hook-form Provider) -> `form.handleSubmit`.
    3.  **Fields**:
        *   **Type Switch**: `Tabs` 또는 `RadioGroup` (UI에 따라 결정)으로 [연차/오프] 전환.
        *   **Staff**: `FormField` > `FormItem` > `Select` (직원 목록 드롭다운).
        *   **Date**: `FormField` > `FormItem` > `Popover` (Trigger as Button) > `Calendar` (Content).
        *   **Leave Type** (연차 시): `FormField` > `RadioGroup` (종일/오전/오후).
        *   **Memo**: `FormField` > `Input` 또는 `Textarea` (비고/사유).
    4.  **Footer**:
        *   `DialogFooter`: `Button` (Cancel/Submit/Delete).

*   **Validation Schema (Zod Example)**:
    ```typescript
    const formSchema = z.object({
      staffName: z.string().min(1, "직원을 선택해주세요."),
      date: z.date({ required_error: "날짜를 선택해주세요." }),
      type: z.enum(["종일", "오전", "오후", "OFF"], {
        required_error: "일정 타입을 선택해주세요.",
      }),
      memo: z.string().optional(), // 오프일 경우 사유 등
    });
    ```

### 4.2 유효성 검사 및 피드백 (Validation & Feedback)
*   `Form` (react-hook-form + zod): 실시간 유효성 검사 및 에러 메시지 표시 (`FormMessage`).
*   **중복/휴일 체크**: 입력 값 변경 시 즉시 로직 수행 후 폼 에러 상태 업데이트.
*   **확인/취소**: 삭제 등 위험한 동작 시 `AlertDialog`를 띄워 재확인.

### 4.3 모바일 최적화 (Mobile Optimization)
*   Shadcn UI의 `Dialog`는 기본적으로 반응형을 지원하나, 모바일에서는 꽉 찬 화면이나 바텀 시트 느낌을 주도록 스타일 조정.
*   터치 타겟(버튼, 입력창) 크기 확보.

## 5. 기술적 고려사항 (Technical Considerations)

### 5.1 기술 스택 및 컴포넌트 (Tech Stack & Components)
*   **Core UI Library**: Shadcn UI (Radix UI + Tailwind CSS)
*   **Required Shadcn Components**:
    *   `Dialog`: 모달 컨테이너.
    *   `Calendar`: 날짜 선택기.
    *   `Select`: 직원 선택 드롭다운.
    *   `RadioGroup`: 연차 타입(종일/반차) 선택.
    *   `Popover`: 캘린더 팝업 컨테이너.
    *   `Button`: 각종 액션 버튼.
    *   `Input` / `Textarea`: 텍스트 입력.
    *   `Form`: 폼 레이아웃 및 에러 처리.
    *   `Toast`: 작업 결과 알림 (`Sonner` 권장).
*   **Supporting Libraries**:
    *   `react-hook-form`: 폼 상태 관리 및 검증.
    *   `zod`: 스키마 기반 유효성 검사.
    *   `lucide-react`: 아이콘 (달력, 체크 등).
    *   `date-fns`: 날짜 포맷팅 및 계산.

*   **선정 이유**:
    *   **Accessibility (a11y)**: Radix UI 기반의 뛰어난 접근성 지원.
    *   **Customizability**: 코드 복사 방식으로 완전한 제어 가능.
    *   **Developer Experience**: `zod` + `react-hook-form`과의 완벽한 통합.
    *   **Zero Runtime Overhead**: 스타일이 빌드 타임에 CSS로 생성되므로 런타임 성능 저하가 없습니다.
    *   **Lightweight**: 필요한 컴포넌트만 개별적으로 설치하여 번들 사이즈를 최적화할 수 있습니다.

### 5.2 구현 전략 (Implementation Strategy)
1.  **초기 설정**: `npx shadcn-ui@latest init`으로 프로젝트 설정 및 `utils` (cn 함수 등) 구성.
2.  **컴포넌트 설치**: 필요한 컴포넌트 개별 추가.
    *   `npx shadcn-ui@latest add dialog button input select calendar popover radio-group form label`
3.  **기존 로직 대체**:
    *   `window.prompt` -> `Dialog` + `Form` (Input)
    *   `window.confirm` -> `AlertDialog`
4.  **상태 관리**:
    *   `react-hook-form`을 사용하여 폼 상태(날짜, 직원, 타입, 메모) 관리.
    *   `zod` 스키마를 정의하여 데이터 유효성 검증 로직 분리.

### 5.3 API 통합 (API Integration)
*   기존 `sheets.ts`, `off.ts` API는 유지하되, 호출부는 `OffModal` 내부의 `onSubmit` 핸들러로 이동.
*   성공적인 응답(200 OK)을 받은 후 `toast` (Shadcn UI `Sonner` or `Toaster`)로 성공 메시지 출력 및 모달 닫기.

## 6. 성공 지표 (Success Metrics)
*   연차/오프 등록 소요 시간 30% 단축.
*   날짜/타입 입력 오류(Invalid Date Format) 발생률 0% 달성.
*   사용자(관리자) 만족도 향상 및 모바일 오조작 건수 감소.

## 7. 향후 계획 (Future Plan)
*   다건 일괄 등록 기능 (여러 날짜 또는 여러 직원 동시 선택).
*   `Drawer` 컴포넌트 도입을 통한 모바일 경험 추가 개선.
*   연차 사용 내역 통계 그래프 시각화 강화.
