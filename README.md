# Beez Agent Harness

[한국어](README.md) | [English](README.en.md)

Beez Agent Harness는 자연어 소프트웨어 요청을 일관된 절차로 연결하는
**Codex 중심 Agent Skill 12개와 경량 프로젝트 어댑터**입니다. 디버깅,
마이그레이션, 보안, 릴리스, 성능, GitHub 작업을 명세·계획·구현·검증·리뷰
수명주기와 조합하고, 프로젝트별 명령·경계·로컬 실행 증거를 저장소 안에서
관리합니다.

이 패키지는 애플리케이션 코드에서 `import`하는 런타임 라이브러리가
아닙니다. 새 프로젝트에 적용하려면 다음 두 계층을 설치합니다.

1. 플러그인 또는 개별 Skill을 에이전트 환경에 설치합니다.
2. 대상 저장소에서 CLI로 `.harness/` 프로젝트 어댑터를 초기화합니다.

그 뒤에는 “간헐적인 테스트 실패 원인을 찾고 수정해줘”, “DB 마이그레이션을
계획하되 실행하지 마”, “릴리스 준비 후 PR만 열어줘”처럼 자연어로 요청하면
설치된 Skill 설명과 프로젝트 안내가 적절한 워크플로를 선택합니다. Skill
이름을 반드시 말할 필요는 없으며, `$beez-debug`처럼 명시적으로 선택할 수도
있습니다.

## 빠른 시작

### 1. 에이전트 Skill 설치

전체 Codex 플러그인을 설치합니다.

```bash
codex plugin marketplace add 90ms/beez-agent-harness
```

처음 설치한 뒤 Codex를 다시 시작하면 12개 Skill을 사용할 수 있습니다.
필요한 Skill만 설치하려면 다음 방식을 사용할 수 있습니다.

```bash
npx skills add 90ms/beez-agent-harness --list
npx skills add 90ms/beez-agent-harness \
  --skill using-beez-harness \
  --skill beez-debug \
  --skill beez-verify \
  --agent codex
```

모든 프로젝트에서 사용하려면 `--global`을 추가합니다.

### 2. 대상 프로젝트에 어댑터 적용

적용할 저장소의 루트에서 실행합니다.

```bash
npx beez-agent-harness init --preset base
npx beez-agent-harness doctor
```

Next.js 프로젝트는 패키지 관리자를 감지하는 `nextjs` 프리셋을 사용할 수
있습니다.

```bash
npx beez-agent-harness init --preset nextjs
```

기존 루트 `AGENTS.md`는 덮어쓰지 않습니다. 파일이 이미 있다면 에이전트가
`.harness/generated/AGENTS.md`와 `.harness/project.json`을 읽도록 안내를
추가합니다.

### 3. 프로젝트 명령과 검증 프로필 설정

`.harness/project.json`은 대상 프로젝트가 소유합니다.

```json
{
  "schemaVersion": 1,
  "commands": {
    "test": "npm test",
    "lint": "npm run lint",
    "build": "npm run build",
    "audit": "npm audit"
  },
  "verification": {
    "required": ["test", "lint"],
    "profiles": {
      "default": ["test", "lint"],
      "security": ["test", "lint", "audit"],
      "release": ["test", "lint", "build"]
    },
    "timeoutMs": 600000
  },
  "boundaries": [
    "Do not commit secrets.",
    "Preserve unrelated user changes."
  ]
}
```

`required`는 기본 완료 gate이고, `profiles`는 작업 위험에 맞는 명령 묶음입니다.
Harness는 등록되지 않은 명령을 추측하거나 자동 실행하지 않습니다.

### 4. 자연어로 작업 요청

다음처럼 평소 표현으로 요청할 수 있습니다.

```text
로그인 API의 500 오류를 재현하고 원인을 찾아 수정해줘.
Prisma 7 업그레이드 계획과 롤백 절차를 작성해. 아직 코드는 바꾸지 마.
인증 변경을 보안 관점에서 리뷰하고 high 이상만 고쳐줘.
성능 기준을 먼저 측정한 다음 p95 지연을 개선하고 비교 결과를 남겨줘.
0.4.0 릴리스를 준비하고 PR을 열되 publish와 merge는 하지 마.
```

“수정하지 마”, “커밋하지 마”, “배포하지 마” 같은 부정 제약은 여러
워크플로가 합쳐져도 유지됩니다. 조회·진단·계획·리뷰 요청은 그 자체로 수정
권한을 주지 않으며, commit·merge·publish·deploy도 서로 별도의 권한입니다.

### 5. 실행 증거 기록

소프트웨어를 변경하는 작업은 분류 정보와 검증 프로필을 run에 기록할 수
있습니다.

```bash
npx beez-agent-harness run start \
  --domain security \
  --domain github \
  --mode change \
  --risk high \
  --side-effects repository \
  --profile security

npx beez-agent-harness run checkpoint \
  --phase threat-model \
  --state completed \
  --artifact docs/threat-model.md

npx beez-agent-harness verify --profile security
npx beez-agent-harness run finish
```

run에는 명령 이름과 해시, 결과 상태·시간, 선택한 workflow/profile, checkpoint,
선택적 artifact 경로와 SHA-256만 남습니다. 명령 원문, stdout/stderr, 환경 변수,
모델 대화는 저장하지 않습니다.

## 제공 기능

### Core Skill

| Skill | 역할 |
| --- | --- |
| `using-beez-harness` | 자연어 요청을 domain·mode·risk·side effect로 분류하고 최소 흐름 선택 |
| `beez-spec` | 요청을 범위가 명확하고 테스트 가능한 명세로 변환 |
| `beez-plan` | 명세를 순서와 검증 기준이 있는 구현 작업으로 분해 |
| `beez-implement` | 동작 중심의 작은 단위로 구현하고 관련 없는 변경 보존 |
| `beez-verify` | 완료 주장에 맞는 최신 테스트·검사 증거 수집 |
| `beez-review` | 정확성, 회귀, 보안, 데이터 안전성, 테스트 누락 리뷰 |

### 전문 Skill

| Skill | 범위 |
| --- | --- |
| `beez-debug` | 재현, 경쟁 가설, root cause, 회귀 방지 |
| `beez-migrate` | 호환성 기간, cutover, 데이터 무결성, 롤백 |
| `beez-security` | 위협 모델, 심각도·악용 가능성, 안전한 개선과 회귀 검증 |
| `beez-release` | 버전·artifact 정합성, 릴리스 gate, 게시 권한, 부분 실패 복구 |
| `beez-performance` | 대표 baseline, profiling, 비교 가능한 benchmark, 회귀 budget |
| `beez-github` | issue, branch, commit, PR, review, Actions, merge, tag, ruleset |

전문 Skill은 core 수명주기를 대체하지 않고 필요한 단계를 더 구체화합니다.
예를 들어 “성능 문제를 수정해 릴리스 PR을 열어줘”는 성능 측정·구현·검증 후
릴리스 준비와 GitHub 작업을 순서대로 조합합니다.

## 라우팅 계약

Harness는 키워드 하나가 아니라 요청의 의미를 네 축으로 분류합니다.

| 축 | 값 |
| --- | --- |
| domain | `general`, `debug`, `migration`, `security`, `release`, `performance`, `github` |
| mode | `explain`, `inspect`, `diagnose`, `plan`, `change`, `verify`, `review`, `execute` |
| risk | `low`, `medium`, `high`, `critical` |
| side effect | `none`, `local`, `repository`, `external-production` |

한국어·영어·혼합 언어 56개 corpus와 provider-neutral scorer가 전문 영역,
부정 제약, 복합 요청의 기대 route를 검증합니다. Harness 자체는 모델을
호출하지 않습니다.

## 프로젝트 어댑터와 소유권

```text
AGENTS.md                         프로젝트 진입 안내
.harness/
├── manifest.json                적용 버전과 관리 파일 해시
├── project.json                 프로젝트 명령, profile, 경계
├── generated/AGENTS.md          Harness 생성 안내
└── runs/<run-id>/
    ├── manifest.json            상태, route, 검증, checkpoint
    └── events.jsonl             append-only event
```

| 파일 | 소유권 |
| --- | --- |
| `.harness/manifest.json`, `.harness/generated/**` | Harness 관리 |
| `.harness/project.json`, 기존 `AGENTS.md`, 소스 | 프로젝트 관리 |
| `.harness/runs/**` | CLI 운영 기록; package update 대상 아님 |
| `.github/**`, `CONTRIBUTING.md` | 저장소 거버넌스 |

이 구조는 프로젝트에 규칙과 증거 계층을 추가할 뿐, 애플리케이션의 빌드나
런타임 의존성이 되지 않습니다.

## 주요 CLI

```text
beez-harness init [--preset base|nextjs] [--dry-run]
beez-harness doctor [--json]
beez-harness update [--check] [--diff]
beez-harness run start|status|list|resume|checkpoint|finish|gc
beez-harness verify --command <name>|--required|--profile <name>
beez-harness version
beez-harness help [command]
```

run은 `active`에서 `completed`, `failed`, `cancelled` 중 하나로 끝납니다.
선택한 검증 명령이 누락·실패했거나 시작 후 `project.json`이 바뀌면
`completed` 전환이 차단됩니다. 자세한 옵션은 [CLI 문서](docs/ko/cli-reference.md)를
참고하세요.

## 업데이트와 진단

플러그인/Skill과 각 프로젝트 어댑터는 별도로 업데이트합니다.

```bash
codex plugin marketplace upgrade
# 또는 npx skills update

npx beez-agent-harness@latest update --check
npx beez-agent-harness@latest update --diff
npx beez-agent-harness@latest update
npx beez-agent-harness@latest doctor --json
```

`update`는 Harness 관리 파일만 갱신하고 `.harness/project.json`과 기존
`AGENTS.md`는 보존합니다.

## 개발과 문서

Node.js 20 이상이 필요하며 런타임 의존성은 없습니다.

```bash
npm run check
npm run validate
npm run evaluate
npm test
npm pack --dry-run
```

- [프로젝트 설정](docs/ko/configuration.md)
- [CLI 명령어](docs/ko/cli-reference.md)
- [아키텍처](docs/ko/architecture.md)
- [GitHub 거버넌스](docs/ko/github-governance.md)
- [행동·라우팅 평가](evals/README.md)
- [문제 해결](docs/ko/troubleshooting.md)
- [릴리스](docs/ko/releasing.md)
- [v0.4 명세](SPEC.md)
- [기여 가이드](CONTRIBUTING.md)
- [보안 정책](SECURITY.md)
