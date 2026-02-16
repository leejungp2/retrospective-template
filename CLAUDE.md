# CLAUDE.md — Claude Code 작업 가이드

## 프로젝트 목표
일일/주간/연간 회고를 **템플릿 위저드**와 **대화형 코치**로 작성하고,
회고에서 나온 **Action Item을 자동 추적**하며, **친구 공유(링크 기반)**까지 제공하는 MVP를 만든다.

## 핵심 원칙(매우 중요)
- 과한 아키텍처/추상화 금지: MVP는 “실행 가능한 상태”가 최우선
- 회고 데이터는 **공통 스키마**로 저장: 템플릿은 UI 구성만 다르게
- 대화형 결과도 반드시 **구조화 블록(카드)로 변환해 저장**
- 액션은 다음 회고에서 반드시 다시 등장해야 함(실행률 핵심)
- 모바일 우선 UI + 향후 앱 전환 고려(PWA/오프라인 초안 최소)

---

## 권장 스택(기본값)
- Next.js (App Router) + TypeScript
- Tailwind CSS
- Prisma + PostgreSQL
- Auth: NextAuth(Auth.js) 또는 Clerk (MVP는 NextAuth 추천)
- Validation: Zod
- API: Next.js Route Handlers 기반 REST (가볍게 시작)

> 다른 스택을 쓰고 싶다면, “변경 사유 + 최소 변경 범위”를 먼저 제시하고 진행.

---

## 로컬 실행(가이드)
### 환경 변수(.env)
- DATABASE_URL=postgresql://...
- NEXTAUTH_URL=http://localhost:3000
- NEXTAUTH_SECRET=...
- (옵션) GOOGLE/GITHUB OAuth 키

### 명령어
- pnpm install
- pnpm dev
- pnpm prisma migrate dev
- pnpm prisma studio (옵션)
- pnpm test (추가 시)

---

## 작업 순서(Claude Code 기본 플로우)
1) `PRD.md`를 읽고 Must 범위를 우선 구현
2) DB 스키마(Prisma) → 마이그레이션
3) 인증(로그인) → 보호된 라우트
4) 회고 작성 플로우(위저드) 최소 구현
5) 회고 상세/리스트 + Action Item 추적
6) 공유 링크(토큰) 생성/조회 최소 구현
7) 태그/검색 최소 구현
8) (여유) 대화형 코치(질문 흐름 + 구조화 저장)

각 단계는 작은 PR 단위로 커밋 가능한 변경량을 유지.

---

## 데이터 모델 설계 규칙(중요)
- `retrospective`는 공통 메타를 가진다: period_type, date_range, context, summary
- 템플릿별 내용은 `blocks`로 저장한다:
  - blocks: { id, retrospective_id, section_key, type, content_json, order }
  - section_key 예: keep / problem / try / feelings / learned 등
- Action Item은 별도 테이블로 분리하고, 체크 로그를 남긴다.
- 공유는 “링크 토큰 기반”으로 시작:
  - share_links: { token, retrospective_id, scope, permission, expires_at }
  - scope: full | sections | summary | actions
  - permission: view | comment(후순위)

---

## API 설계 규칙
- REST route handlers, JSON 응답
- 모든 입력은 Zod로 검증
- 인증 필요 엔드포인트는 세션 검증 필수
- 최소 엔드포인트 예시
  - GET /api/templates
  - POST /api/retrospectives
  - GET /api/retrospectives?period=weekly
  - GET /api/retrospectives/:id
  - POST /api/retrospectives/:id/blocks
  - POST /api/retrospectives/:id/action-items
  - POST /api/share-links
  - GET /share/:token (공유 뷰)

---

## 프론트 구조 가이드
- app/
  - (auth)/login
  - dashboard
  - retrospectives/new
  - retrospectives/[id]
  - actions
  - share/[token]
- components/
  - RetrospectiveWizard/
  - Blocks/
  - ActionItems/
  - TemplatePicker/
- lib/
  - auth, db(prisma), validators(zod), templates(seed)

UI는 모바일(세로) 우선으로 설계.

---

## 템플릿(방법론) 구현 방식
- templates는 DB seed로 제공
- 각 템플릿 정의는 아래를 포함:
  - key, name, description
  - supported_periods: daily/weekly/yearly
  - sections: [{ key, title, prompt, block_type }]
- UI는 이 정의를 읽어서 자동 렌더링(확장 용이)

---

## 대화형 코치(구현 규칙)
- MVP에서는 “고정 질문 시나리오”로 시작해도 됨(LLM 연동은 추후)
- 대화 결과를 최종적으로 `blocks`에 매핑하는 변환 함수를 반드시 둔다.
- “짧게/깊게” 토글은 질문 수/깊이만 달라지고 저장 구조는 동일

---

## 품질 체크리스트(완료 기준)
- 로그인 없이 보호 페이지 접근 불가
- 회고 생성 → 섹션 카드 저장 → 상세에서 렌더링 OK
- Try/Future action에서 Action Item 생성 → 다음 회고 진입 시 자동 노출
- 공유 링크 생성 → 토큰 페이지에서 권한 범위에 맞게 표시
- 모바일 화면에서 핵심 플로우가 깨지지 않음

---

## 서브에이전트 운영(권장)
필요할 때만 사용(컨텍스트 오염 방지). `/agents`로 생성 가능.

- Product/UX Agent:
  - 질문 카피, 위저드 단계, 공유 UX(범위/권한)
- Data/API Agent:
  - Prisma 스키마/인덱스, 공유 권한 모델, 리포트 집계
- Frontend Agent:
  - 컴포넌트 구조, 모바일 UI, 상태/폼 전략
- QA Agent:
  - E2E 플로우 점검 시나리오, 엣지케이스(만료 링크, 권한)

---

## “하지 말 것”
- 대규모 리팩토링/추상화
- PRD 범위 밖 기능을 구현(제안만 가능)
- 대화형을 “채팅 로그만 저장”으로 끝내는 것(반드시 구조화 저장)
