# 프로젝트 설정 가이드

[한국어](configuration.md) | [English](../en/configuration.md)

Beez Agent Harness는 저장소마다 다른 실행 명령과 작업 경계를
`.harness/project.json`에 보관합니다. 이 파일은 프로젝트가 소유하며
`init`이나 `update`가 덮어쓰지 않습니다.

## 기본 구조

```json
{
  "schemaVersion": 1,
  "commands": {
    "test": "npm test",
    "lint": "npm run lint",
    "build": "npm run build"
  },
  "verification": {
    "required": ["test", "lint", "build"],
    "timeoutMs": 600000
  },
  "boundaries": [
    "Do not commit secrets.",
    "Preserve unrelated user changes."
  ]
}
```

### `schemaVersion`

설정 형식의 버전입니다. 현재 지원하는 값은 `1`입니다.

### `commands`

에이전트와 Harness가 검증에 사용할 실제 프로젝트 명령을 문자열로
선언합니다. Harness CLI는 사용자가 `verify`를 실행하고 명령을 선택한
경우에만 실행합니다. 프로젝트에서 지원하지 않는 명령을 추측해 넣지 말고,
`package.json`이나 기존 개발 문서에서 확인한 명령만 기록합니다.

```json
{
  "commands": {
    "install": "pnpm install",
    "test": "pnpm test",
    "lint": "pnpm lint",
    "build": "pnpm build"
  }
}
```

### `verification`

선택 필드입니다. 생략한 기존 v0.2 설정도 유효하며 이때 필수 명령은
없습니다.

- `required`: run을 `completed`로 끝내기 전에 통과해야 하는 `commands`의
  이름입니다. 중복되거나 존재하지 않는 명령은 허용하지 않습니다.
- `timeoutMs`: 각 명령의 제한 시간입니다. 1,000~3,600,000 사이의
  정수이며 생략하면 300,000ms입니다.

```json
{
  "verification": {
    "required": ["test", "lint"],
    "timeoutMs": 300000
  }
}
```

`verify --required`는 배열 순서대로 명령을 실행합니다. 명령 원문과 환경
변수, stdout/stderr 원문은 run 기록에 저장하지 않습니다.

### `boundaries`

에이전트가 변경 중 지켜야 하는 프로젝트 규칙입니다. 각 항목은 짧고 실행
가능한 문장으로 작성합니다.

좋은 예:

- `Do not expose server secrets through NEXT_PUBLIC_ variables.`
- `Do not modify generated database migrations.`
- `Preserve unrelated user changes.`

피해야 할 예:

- 의미가 불분명한 규칙
- 서로 충돌하는 규칙
- 저장소에서 확인할 수 없는 명령이나 경로

## 프리셋

### `base`

언어나 프레임워크에 종속되지 않는 최소 경계를 제공합니다. 초기화 후 실제
프로젝트 명령을 직접 추가합니다.

```bash
npx beez-agent-harness init --preset base
```

### `nextjs`

Next.js 작업 경계와 `install`, `test`, `lint`, `build` 명령을 제공합니다.
패키지 관리자는 다음 lock 파일 우선순위로 감지하며, 일치하는 파일이 없으면
`npm`을 사용합니다.

1. `pnpm-lock.yaml`
2. `yarn.lock`
3. `bun.lock` 또는 `bun.lockb`
4. `npm`

```bash
npx beez-agent-harness init --preset nextjs
```

## 파일 소유권

| 파일 | 소유자 | 직접 수정 |
| --- | --- | --- |
| `.harness/project.json` | 프로젝트 | 가능 |
| `.harness/manifest.json` | Harness | 금지 |
| `.harness/generated/AGENTS.md` | Harness | 금지 |
| `.harness/runs/**` | 운영 기록 | CLI로 관리 |
| 루트 `AGENTS.md` | 프로젝트 | 가능 |

프로젝트 고유 정책은 `.harness/project.json` 또는 루트 `AGENTS.md`에
작성합니다. 생성 안내문을 직접 수정하면 `doctor`가 drift로 보고합니다.

## 설정 확인

```bash
npx beez-agent-harness doctor
```

`doctor`는 필수 필드, 명령·검증·경계의 타입, 검증 명령 참조, 관리 경로와
해시, 생성 안내문, Harness 버전을 점검합니다.
