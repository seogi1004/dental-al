# 더데이치과 연차 관리 시스템 (Dental Leave Management System)

더데이치과의 직원 연차 및 휴가 일정을 효율적으로 관리하기 위한 웹 애플리케이션입니다.  
구글 스프레드시트(Google Sheets)를 데이터베이스로 사용하여, 관리자가 엑셀처럼 데이터를 관리하면 웹에 자동으로 연동됩니다.

## 🚀 주요 기능 (Key Features)

### 1. 📊 대시보드 및 현황판
- **오늘의 현황**: 당일 휴가자 유무 및 명단을 실시간으로 확인 (오프 포함).
- **자동 동기화**: 구글 시트 데이터 변경 시 웹에 실시간 반영 (Polling 방식).
- **반응형 디자인**: 데스크탑 및 모바일(태블릿/스마트폰) 완벽 지원.
- **다크 모드**: 눈의 피로를 줄이는 다크 모드 지원.

### 2. 📅 캘린더 및 연차/오프 관리
- **월별 캘린더**: 직원들의 연차 및 정기 휴무(Off) 일정을 한눈에 파악.
- **다양한 연차 타입**: 종일 연차, 오전 반차(AM), 오후 반차(PM) 지원 및 시각적 구분.
- **오프(Off) 관리**: 정기 휴무일을 별도로 등록하여 연차 차감 없이 일정 관리.
- **연차 자동 계산**: 입사일 기준 연차 발생 일수 자동 계산 및 사용/잔여 연차 트래킹.

### 3. 🛠 관리자 기능 (Admin Only)
- **직원 관리**: 웹에서 직원 추가, 정보 수정(직급, 메모 등), 삭제 가능.
- **일정 편집 (PC/Mobile)**: 
  - 달력(PC) 또는 리스트(Mobile)에서 날짜를 클릭하거나 추가 버튼을 통해 연차/오프를 손쉽게 등록, 수정, 삭제 가능.
- **데이터 검증 및 표준화**:
  - 잘못된 날짜 형식(예: 오타) 감지 및 경고 알림.
  - **일요일 연차** 등록 시 경고 알림.
  - 중복 등록(같은 날짜에 동일 인물) 감지 및 경고.
  - **자동 포맷팅**: `1/1`로 입력해도 시트에는 `01/01` 표준 형식으로 자동 변환 저장.

### 4. 🎨 사용자 경험 (UX) 개선
- **직관적인 UI**: 
  - 모바일/데스크탑 환경에 최적화된 버튼 및 리스트 레이아웃.
  - **날짜 표시 간소화**: 불필요한 `0`을 제거한 `1/1` 포맷으로 가독성 향상.
  - **상세 경고 배너**: 문제가 있는 일정을 구체적으로(누가, 언제) 알려주는 배너 제공.
  - **로그아웃 상태 안내**: 관리자가 아니거나 경고가 없을 때 긍정적인 메시지("좋은 하루 보내세요") 표시.
- **다크 모드 완벽 지원**: 본문 배경색까지 세심하게 조정된 다크 모드.

### 5. 📄 연차 신청서 생성
- 웹에서 바로 인쇄 가능한 표준 연차 신청서 양식 제공.

---

## 🛠 기술 스택 (Tech Stack)

- **Framework**: [Next.js 14](https://nextjs.org/) (React)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/) (Google Login)
- **Database (Backend)**: Google Sheets API v4
- **Deployment**: Vercel (Recommended)

---

## 📂 프로젝트 구조 (Project Structure)

```
.
├── app/
│   ├── page.tsx          # 메인 대시보드 (CSR)
│   ├── layout.tsx        # Root Layout & Theme Provider
│   └── globals.css      # Tailwind Global Styles
├── pages/
│   └── api/             # API Routes (Serverless Functions)
│       ├── auth/        # NextAuth 설정
│       ├── sheets.ts    # 구글 시트 데이터 동기화 (GET/POST)
│       └── off.ts       # 오프(Off) 관리 API (GET/POST/DELETE)
├── components/          # UI Components
│   ├── HelpPanel.tsx    # 도움말 패널
│   ├── UserMenu.tsx     # 사용자 메뉴
│   └── ...
├── public/              # Static Assets
└── README.md            # Project Documentation
```

---

## ⚠️ 데이터 관리 정책 (Data Policy)

본 시스템은 **Google Sheets**를 주 데이터 저장소로 사용합니다.

1. **읽기 (Read)**:
   - `연차계산` 시트: 직원 기본 정보 (이름, 직급, 입사일 등)
   - `2026년` 시트: 날짜별 연차 상세 기록
   - `2026년_오프` 시트: 직원별 정기 휴무(Off) 및 비고

2. **쓰기 (Write)**:
   - 웹에서의 변경 사항은 즉시 구글 시트에 반영됩니다.
   - **주의**: 시트의 구조(열 순서 등)를 임의로 변경하면 연동이 끊어질 수 있습니다.

3. **권한 (Permissions)**:
   - **Viewer (일반 사용자)**: 조회만 가능.
   - **Editor (관리자)**: 데이터 수정, 직원 추가/삭제, **오프 관리** 가능.

---

## 🚀 설치 및 실행 (Installation)

1. **환경 변수 설정 (.env.local)**
   ```env
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_SHEET_ID=your_sheet_id
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_secret
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **개발 서버 실행**
   ```bash
   npm run dev
   ```
