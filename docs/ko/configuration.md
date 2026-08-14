# 프로젝트 설정 가이드

[한국어](configuration.md) | [English](../en/configuration.md)

Beez Agent Harness는 저장소별 명령, 검증 profile, 작업 경계를
`.harness/project.json`에 보관합니다. 이 파일은 프로젝트가 소유하며 `init`과
`update`가 덮어쓰지 않습니다.

## 전체 구조

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
      "migration": ["test", "lint", "build"],
      "security": ["test", "lint", "audit"],
      "release": ["test", "lint", "build"],
      "performance": ["test", "build"]
    },
    "timeoutMs": 600000
  },
  "boundaries": [
    "Do not commit secrets.",
    "Preserve unrelated user changes."
  ]
}
```

## 필드

### `schemaVersion`

프로젝트 설정 형식입니다. 현재 지원 값은 `1`입니다.

### `commands`

안정적인 이름과 실제 프로젝트 명령 문자열의 map입니다. CLI는 사용자가
`verify`로 선택한 경우에만 명령을 실행합니다. 저장소 설정이나 문서에서
확인한 명령만 선언하며 Harness는 명령을 탐색하거나 추측하지 않습니다.

명령 이름은 `required`와 모든 profile에서 참조할 수 있습니다. 명령에는
일반적인 로컬 side effect가 있을 수 있으므로 install, migration, audit,
benchmark 명령은 등록 전에 검토합니다.

### `verification`

하위 호환성을 위한 선택 object입니다. 없으면 암시적인 필수 명령도 없습니다.

- `required`: `--profile` 없이 run을 시작할 때 쓰는 순서 있는 명령 이름
- `profiles`: 선택적인 이름별 명령 목록. 최대 32개이며 이름은 소문자·숫자와
  단일 hyphen 구분 형식을 사용하고 최대 64자입니다.
- `timeoutMs`: 명령별 제한 시간. 1,000~3,600,000ms이고 기본값은
  300,000ms입니다.

참조된 모든 이름은 `commands`에 있어야 합니다. 중복 명령, 중복 profile,
없는 명령, 잘못된 이름, 추가 필드는 거부합니다.

`run start` 시 선택한 목록을 run에 복사합니다. 그 뒤 `project.json`을 수정하면
digest가 달라져 해당 run의 성공 완료가 차단됩니다. 기존 run을 failed 또는
cancelled로 끝내고 새로 시작합니다.

```bash
npx beez-agent-harness run start --profile security
npx beez-agent-harness verify --profile security
```

`verify --required`는 현재 run에 snapshot된 필수 목록을 실행합니다. 출력 원문은
터미널에만 표시되고 증거에 복사되지 않습니다.

### `boundaries`

에이전트가 지켜야 할 짧고 실행 가능한 저장소 규칙의 배열입니다. 권한과 안전
경계를 명확히 작성합니다.

좋은 예:

- `Do not expose server secrets through NEXT_PUBLIC_ variables.`
- `Do not modify generated database migrations.`
- `Do not publish packages or deploy without explicit authority.`
- `Preserve unrelated user changes.`

서로 충돌하거나 의미가 모호한 규칙, 저장소에서 확인할 수 없는 경로나 명령은
피합니다.

## 프리셋

### `base`

언어 독립적인 경계와 비어 있는 `default`, `migration`, `security`, `release`,
`performance` profile을 제공합니다. Profile을 사용하기 전에 프로젝트의 실제
명령을 추가합니다.

```bash
npx beez-agent-harness init --preset base
```

### `nextjs`

`install`, `test`, `lint`, `build` 명령과 test/lint/build가 채워진 동일한 이름의
profile을 제공합니다. 패키지 관리자 감지 순서는 다음과 같습니다.

1. `pnpm-lock.yaml`
2. `yarn.lock`
3. `bun.lock` 또는 `bun.lockb`
4. `npm` fallback

```bash
npx beez-agent-harness init --preset nextjs
```

프로젝트에 생성된 package script가 없다면 명령을 조정합니다. 제거한 명령을
profile이 계속 참조하면 `doctor`가 오류로 보고합니다.

## 파일 소유권

| 파일 | 소유자 | 직접 수정 |
| --- | --- | --- |
| `.harness/project.json` | 프로젝트 | 가능 |
| `.harness/manifest.json` | Harness | 금지 |
| `.harness/generated/AGENTS.md` | Harness | 금지 |
| `.harness/runs/**` | 운영 상태 | CLI 사용 |
| 루트 `AGENTS.md` | 프로젝트/shared | 가능 |

저장소 고유 문장은 `boundaries` 또는 루트 `AGENTS.md`에 작성합니다. 생성 안내를
직접 수정하면 drift로 보고됩니다.

## 설정 검증

```bash
npx beez-agent-harness doctor
npx beez-agent-harness doctor --json
```

`doctor`는 field type과 추가 필드, profile/required 참조, timeout, 관리 경로와
hash, 생성 안내, root 연결, 적용 Harness 버전을 점검합니다. JSON mode도 같은
상태 판정을 반환합니다.
