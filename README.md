# Beez Agent Harness

[한국어](README.md) | [English](README.en.md)

Beez Agent Harness는 일관된 소프트웨어 개발을 위한 **Codex 중심의 재사용
가능한 Agent Skill 모음과 경량 프로젝트 어댑터**입니다.

작업을 명세, 계획, 점진적 구현, 검증, 리뷰 단계로 연결하면서도 프로젝트별
명령어와 작업 경계는 각 저장소 안에서 직접 관리할 수 있습니다.

## 문서 안내

- [빠른 시작](#빠른-시작): 플러그인 설치부터 프로젝트 초기화까지
- [핵심 개념](#핵심-개념): Skill과 프로젝트 어댑터의 역할
- [설치 방법](#설치-방법): 전체 플러그인 또는 필요한 Skill만 설치
- [프로젝트에 적용하기](#프로젝트에-적용하기): 프리셋과 프로젝트 설정
- [업데이트와 상태 점검](#업데이트와-상태-점검): 안전한 업데이트 및 진단
- [개발 및 기여](#개발-및-기여): 저장소 개발 명령어와 관련 문서

## 빠른 시작

### 1. Codex 플러그인 설치

```bash
codex plugin marketplace add 90ms/beez-agent-harness
```

처음 설치한 뒤 Codex를 다시 시작하면 6개의 Skill을 사용할 수 있습니다.

### 2. 프로젝트 초기화

적용할 프로젝트의 루트에서 다음 명령어를 실행합니다.

```bash
npx beez-agent-harness init --preset base
npx beez-agent-harness doctor
```

Next.js 프로젝트라면 `nextjs` 프리셋을 사용할 수 있습니다.

```bash
npx beez-agent-harness init --preset nextjs
```

### 3. 프로젝트 명령어와 경계 설정

초기화 후 `.harness/project.json`을 프로젝트 환경에 맞게 수정합니다.

```json
{
  "schemaVersion": 1,
  "commands": {
    "test": "npm test",
    "lint": "npm run lint",
    "build": "npm run build"
  },
  "boundaries": [
    "Do not commit secrets.",
    "Preserve unrelated user changes."
  ]
}
```

에이전트는 여기에 선언된 명령어와 작업 경계를 기준으로 프로젝트를 다룹니다.

## 핵심 개념

Beez Agent Harness는 에이전트 실행 엔진이나 프레임워크별 프로젝트 생성기가
아닙니다. 기존 저장소에 다음 두 계층을 더해 개발 작업의 품질과 일관성을
높이는 도구입니다.

### Agent Skill

| Skill | 역할 |
| --- | --- |
| `using-beez-harness` | 작업 성격과 위험도에 맞는 최소 개발 절차 선택 |
| `beez-spec` | 요청을 범위가 명확하고 테스트 가능한 명세로 변환 |
| `beez-plan` | 명세를 순서가 있고 검증 가능한 구현 작업으로 분해 |
| `beez-implement` | 동작 중심의 작은 단위로 구현하고 단계별 증거 수집 |
| `beez-verify` | 테스트와 검사 결과를 통해 완료 여부 검증 |
| `beez-review` | 정확성, 회귀, 보안, 데이터 안전성과 테스트 누락 리뷰 |

작업 유형에 따라 필요한 단계만 사용합니다.

| 작업 유형 | 기본 흐름 |
| --- | --- |
| 설명 또는 상태 확인 | 조사 → 답변 |
| 작은 변경 | 구현 → 검증 |
| 기능 또는 동작 변경 | 명세 → 계획 → 구현 → 검증 → 리뷰 |
| 버그 수정 | 재현 → 수정 → 회귀 검증 → 리뷰 |
| 고위험 변경 | 전체 흐름 + 명시적인 증거와 롤백 안내 |

### 프로젝트 어댑터

의존성 없는 Node.js CLI가 신규 또는 기존 저장소에 다음 구조를 설치합니다.

```text
.harness/
├── manifest.json
├── project.json
└── generated/
    └── AGENTS.md
```

| 파일 | 소유권과 용도 |
| --- | --- |
| `.harness/manifest.json` | Harness 버전과 관리 파일의 해시 기록 |
| `.harness/project.json` | 프로젝트가 소유하는 명령어와 작업 경계 |
| `.harness/generated/AGENTS.md` | Harness가 생성하고 안전하게 갱신하는 안내 |
| `AGENTS.md` | 에이전트가 생성된 안내를 읽도록 연결하는 프로젝트 진입점 |

기존 루트 `AGENTS.md`는 덮어쓰지 않습니다. 이미 파일이 있다면
`.harness/generated/AGENTS.md`를 읽도록 안내 문구를 직접 추가하면 됩니다.

## 설치 방법

### 전체 Codex 플러그인

```bash
codex plugin marketplace add 90ms/beez-agent-harness
```

이 방법은 6개 Skill을 모두 설치합니다.

### 필요한 Skill만 설치

설치 가능한 Skill을 확인합니다.

```bash
npx skills add 90ms/beez-agent-harness --list
```

현재 프로젝트에 필요한 Skill만 선택해 설치할 수 있습니다.

```bash
npx skills add 90ms/beez-agent-harness \
  --skill using-beez-harness \
  --skill beez-implement \
  --skill beez-verify \
  --agent codex
```

모든 프로젝트에서 사용하려면 `--global` 옵션을 추가합니다.

## 프로젝트에 적용하기

### 프리셋 선택

현재 다음 두 프리셋을 제공합니다.

| 프리셋 | 용도 |
| --- | --- |
| `base` | 언어나 프레임워크에 종속되지 않는 기본 설정 |
| `nextjs` | 패키지 관리자 감지, Next.js 명령어 및 프런트엔드 검증 지침 |

```bash
npx beez-agent-harness init --preset base
```

로컬에서 이 저장소를 개발할 때는 CLI 파일을 직접 실행할 수도 있습니다.

```bash
node /path/to/beez-agent-harness/bin/beez-harness.js init --preset nextjs
```

### 초기화 동작

`init`은 다음 원칙을 지킵니다.

- 기존 `.harness/project.json`을 보존합니다.
- 기존 루트 `AGENTS.md`를 덮어쓰지 않습니다.
- 생성 파일과 적용된 Harness 버전을 `manifest.json`에 기록합니다.
- Next.js 프리셋에서는 lock 파일을 기준으로 패키지 관리자를 감지합니다.

## 업데이트와 상태 점검

업데이트는 플러그인 또는 Skill과 프로젝트 어댑터의 두 단계로 나뉩니다.

### 1. 설치된 플러그인 또는 Skill 업데이트

```bash
codex plugin marketplace upgrade
# 또는
npx skills update
```

### 2. 프로젝트 어댑터 업데이트

```bash
npx beez-agent-harness@latest update --check
npx beez-agent-harness@latest update
npx beez-agent-harness@latest doctor
```

- `update --check`는 새 버전이나 관리 파일 변경을 발견하면 0이 아닌 종료
  코드를 반환합니다.
- `update`는 Harness 관리 파일만 갱신합니다.
- `.harness/project.json`과 기존 루트 `AGENTS.md`는 갱신 과정에서도
  덮어쓰지 않습니다.
- `doctor`는 설정 오류, 누락 파일, 관리 파일 변경 상태를 점검합니다.

## 개발 및 기여

Node.js 20 이상이 필요합니다.

```bash
npm run check
npm run validate
npm test
npm pack --dry-run
```

이 저장소에도 자체 프로젝트 어댑터가 적용되어 있습니다.

관련 문서:

- [v0.1 명세](SPEC.md)
- [기여 가이드](CONTRIBUTING.md)
- [보안 정책](SECURITY.md)
- [변경 이력](CHANGELOG.md)

## 라이선스

[MIT](LICENSE)
