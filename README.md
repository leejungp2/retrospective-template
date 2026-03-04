# Retrospective Template

일일/주간/연간 회고를 **템플릿 위저드**와 **대화형 코치**로 작성하고,
Action Item을 자동 추적하며, 링크 기반 친구 공유까지 제공하는 회고 웹앱입니다.

## 주요 기능

- **4가지 회고 템플릿**: KPT, 4F, 5Questions, 4L
- **2가지 입력 모드**: 단계별 위저드 / 대화형 코치
- **Action Item 추적**: 회고에서 도출된 액션을 상태별로 관리하고, 다음 회고에서 자동 리마인드
- **링크 기반 공유**: 토큰 URL로 회고를 외부에 공유 (범위: 전체/요약/액션)
- **모바일 우선 UI**: 세로 화면 기준 설계

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) + React 19 |
| 언어 | TypeScript |
| 스타일링 | Tailwind CSS 4 |
| 데이터베이스 | PostgreSQL + Prisma 7 |
| 인증 | NextAuth v5 (JWT, GitHub/Google OAuth) |
| 검증 | Zod |
| 패키지 매니저 | pnpm |

## 시작하기

### 사전 요구사항

- Node.js 18+
- pnpm
- PostgreSQL (또는 Docker)

### 설치

```bash
# 의존성 설치
pnpm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 값을 채워주세요
```

### 환경 변수

`.env` 파일에 다음 값을 설정합니다:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/retrospective_db
AUTH_SECRET=your-secret-here
AUTH_URL=http://localhost:3000

# OAuth (선택)
AUTH_GITHUB_ID=your-github-client-id
AUTH_GITHUB_SECRET=your-github-client-secret
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret
```

### 데이터베이스 설정

```bash
# Docker로 PostgreSQL 실행 (선택)
docker compose up -d

# Prisma 마이그레이션
pnpm prisma migrate dev

# 템플릿 시드 데이터 생성
pnpm prisma db seed
```

### 개발 서버 실행

```bash
pnpm dev
```

http://localhost:3000 에서 접속할 수 있습니다.

**테스트 계정**: `test@test.com` / `test1234`

## 프로젝트 구조

```
src/
├── app/
│   ├── (auth)/login/        # 로그인 페이지
│   ├── dashboard/           # 대시보드 (미완료 액션, 최근 회고)
│   ├── retrospectives/
│   │   ├── new/             # 회고 생성 (기간 → 템플릿 → 모드 선택)
│   │   └── [id]/            # 회고 작성/상세
│   ├── actions/             # Action Item 관리
│   ├── share/[token]/       # 공유 링크 뷰 (인증 불필요)
│   └── api/                 # REST API 엔드포인트
├── components/
│   ├── retrospective/       # 위저드, 코치 모드, 블록 카드
│   ├── action-items/        # 액션 아이템 카드
│   ├── share/               # 공유 다이얼로그
│   ├── layout/              # 헤더, 모바일 네비게이션
│   └── ui/                  # 공통 UI (Button, Card, Badge, Input)
├── lib/
│   ├── auth.ts              # NextAuth 설정
│   ├── prisma.ts            # Prisma 클라이언트
│   ├── validators.ts        # Zod 스키마
│   └── coach-scenarios.ts   # 코치 모드 질문 시나리오
└── middleware.ts             # 인증 라우트 보호

prisma/
├── schema.prisma            # 데이터 모델
└── seed.ts                  # 템플릿 시드
```

## 데이터 모델

- **Template / TemplateSection**: 회고 방법론 정의 (KPT, 4F, 5Questions, 4L)
- **Retrospective**: 회고 메타 정보 (기간, 모드, 상태, 컨텍스트, 요약)
- **Block**: 섹션별 구조화된 내용 (sectionKey + contentJson)
- **ActionItem / ActionItemLog**: 액션과 상태 변경 이력
- **Tag / RetrospectiveTag**: 회고 태그
- **ShareLink**: 공유 토큰 (범위: full/summary/actions)

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/templates` | 템플릿 목록 |
| POST | `/api/retrospectives` | 회고 생성 |
| GET | `/api/retrospectives` | 회고 목록 (기간별 필터) |
| PATCH | `/api/retrospectives/:id` | 회고 수정 |
| POST | `/api/retrospectives/:id/blocks` | 블록 저장 |
| POST | `/api/retrospectives/:id/action-items` | 액션 아이템 생성 |
| PATCH | `/api/action-items/:id` | 액션 상태 변경 |
| POST | `/api/share-links` | 공유 링크 생성 |
| GET | `/api/share/:token` | 공유 데이터 조회 |

## 회고 템플릿

| 템플릿 | 섹션 | 적합한 주기 |
|--------|------|-------------|
| **KPT** | Keep / Problem / Try | 주간 |
| **4F** | Facts / Feelings / Findings / Future Action | 일간, 주간 |
| **5Questions** | Did Well / Did Bad / Learned / Questions Left / Improvements | 주간, 연간 |
| **4L** | Liked / Learned / Lacked / Longed For | 주간 |

## 스크립트

```bash
pnpm dev              # 개발 서버
pnpm build            # 프로덕션 빌드
pnpm start            # 프로덕션 서버
pnpm lint             # ESLint 검사
pnpm prisma studio    # Prisma DB 브라우저
pnpm prisma migrate dev   # 마이그레이션 실행
pnpm prisma db seed       # 시드 데이터 생성
```

## 라이선스

Private
