# CLI 명령어

[한국어](cli-reference.md) | [English](../en/cli-reference.md)

## 기본 사용법

```text
beez-harness init [--preset base|nextjs] [--dry-run]
beez-harness doctor [--json]
beez-harness update [--check] [--diff]
beez-harness run start|status|list|resume|finish|gc
beez-harness verify --command <name>|--required
beez-harness version
beez-harness help [command]
```

`npx beez-agent-harness` 뒤에도 같은 명령과 옵션을 사용할 수 있습니다.
지원하지 않는 옵션이나 위치 인자는 오류로 처리됩니다.

## `init`

현재 디렉터리에 프로젝트 어댑터를 설치합니다.

```bash
npx beez-agent-harness init
npx beez-agent-harness init --preset nextjs
npx beez-agent-harness init --preset=nextjs
npx beez-agent-harness init --preset nextjs --dry-run
```

옵션:

- `--preset <name>`: `base` 또는 `nextjs`. 기본값은 `base`입니다.
- `--dry-run`: 생성·보존 예정 파일을 보고하고 아무것도 쓰지 않습니다.
- `-h`, `--help`: 명령 도움말을 출력합니다.

이미 `.harness/manifest.json`이 존재하면 종료 코드 `1`을 반환하며 기존 상태를
변경하지 않습니다.

## `doctor`

프로젝트 설정과 관리 파일 상태를 읽기 전용으로 점검합니다.

```bash
npx beez-agent-harness doctor
npx beez-agent-harness doctor --json
```

Manifest·프로젝트 설정, SHA-256, 누락 또는 drift, 생성 안내문, 루트
`AGENTS.md`, 버전 차이를 검사합니다. 오류가 없으면 종료 코드 `0`, 오류가
있으면 `1`입니다. `--json`은 같은 판정을 `schemaVersion`, `ok`, harness
버전, 오류, 경고 필드로 출력합니다.

## `update`

Manifest의 프리셋으로 Harness 관리 파일만 갱신합니다.

```bash
npx beez-agent-harness update
npx beez-agent-harness update --check
npx beez-agent-harness update --diff
npx beez-agent-harness update --check --diff
```

- `--check`: 쓰지 않고 업데이트 또는 drift를 찾으며, 변경이 있으면 종료
  코드 `1`을 반환합니다.
- `--diff`: 쓰지 않고 현재 파일과 생성 예정 파일의 diff를 출력합니다.

`.harness/project.json`과 기존 루트 `AGENTS.md`는 덮어쓰지 않습니다.

## `run`

로컬 작업 상태와 검증 요약을 `.harness/runs/<run-id>/`에 기록합니다.

```bash
npx beez-agent-harness run start
npx beez-agent-harness run status
npx beez-agent-harness run status --run <id>
npx beez-agent-harness run list
npx beez-agent-harness run resume
npx beez-agent-harness run finish
npx beez-agent-harness run finish --state failed
npx beez-agent-harness run gc --keep 20
```

- `start`: 활성 run이 없을 때 새 run을 시작합니다.
- `status`: 활성 run 또는 `--run`으로 선택한 run을 표시합니다.
- `list`: 모든 run을 최신순으로 표시합니다.
- `resume`: active run을 다시 선택하고 `run.resumed` 이벤트를 남깁니다.
- `finish`: 기본적으로 `completed`로 종료합니다. `failed`와 `cancelled`도
  선택할 수 있습니다.
- `gc`: 최신 terminal run N개를 남기고 오래된 기록만 삭제합니다. active
  run은 삭제하지 않습니다.

terminal run은 다시 변경할 수 없습니다. 필수 검증이 누락·실패했거나 시작
후 프로젝트 설정이 바뀌면 `completed` 전환이 거부됩니다.

## `verify`

`project.json`에 등록된 명령을 명시적으로 실행합니다.

```bash
npx beez-agent-harness verify --command test
npx beez-agent-harness verify --required
npx beez-agent-harness verify --required --run <id>
```

- `--command <name>`: 명령 하나를 실행합니다.
- `--required`: `verification.required`의 명령을 순서대로 모두 실행합니다.
- `--run <id>`: 활성 run 대신 특정 active run을 선택합니다.

명령 출력은 터미널에 표시되지만 run 파일에는 저장되지 않습니다. 결과에는
명령 이름·해시, 상태, 시간, 종료 코드와 signal만 기록됩니다. 하나라도
통과하지 않으면 종료 코드 `1`입니다.

## `version`과 `help`

```bash
npx beez-agent-harness version
npx beez-agent-harness --version
npx beez-agent-harness help
npx beez-agent-harness help verify
npx beez-agent-harness run --help
```
