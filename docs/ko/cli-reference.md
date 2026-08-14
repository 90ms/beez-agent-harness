# CLI 명령어

[한국어](cli-reference.md) | [English](../en/cli-reference.md)

의존성 없는 CLI는 Node.js 20 이상이 필요합니다. 설치 후
`beez-harness ...` 또는 `npx beez-agent-harness ...`로 실행합니다. 지원하지
않는 option과 positional argument는 오류입니다.

## 명령 요약

```text
beez-harness init [--preset base|nextjs] [--dry-run]
beez-harness doctor [--json]
beez-harness update [--check] [--diff]
beez-harness run start [workflow options] [--profile <name>]
beez-harness run status [--run <id>]
beez-harness run list
beez-harness run resume [--run <id>]
beez-harness run checkpoint [--run <id>] --phase <name> --state started|completed|blocked [--artifact <path>]
beez-harness run finish [--run <id>] [--state completed|failed|cancelled]
beez-harness run gc [--keep <count>]
beez-harness verify --command <name> [--run <id>]
beez-harness verify --required [--run <id>]
beez-harness verify --profile <name> [--run <id>]
beez-harness version
beez-harness help [command]
```

## `init`

현재 디렉터리에 프로젝트 어댑터를 설치합니다.

```bash
npx beez-agent-harness init
npx beez-agent-harness init --preset nextjs
npx beez-agent-harness init --preset=nextjs --dry-run
```

- `--preset <name>`: `base` 또는 `nextjs`, 기본값 `base`
- `--dry-run`: 쓰지 않고 생성·보존 예정 파일 보고
- `-h`, `--help`: 명령 도움말

`.harness/manifest.json`이 이미 있으면 상태를 바꾸지 않고 종료 코드 `1`을
반환합니다. 기존 루트 `AGENTS.md`는 보존합니다.

## `doctor`

설정과 관리 파일을 읽기 전용으로 검증합니다.

```bash
npx beez-agent-harness doctor
npx beez-agent-harness doctor --json
```

Schema와 참조, 관리 경로 제한과 SHA-256, 누락·drift된 안내, root 연결, 버전
정합성을 검사합니다. 정상은 `0`, 오류는 `1`이며 warning만 있으면 실패하지
않습니다. `--json`은 schema version, 버전, errors, warnings를 포함한 같은 판정을
반환합니다.

## `update`

Manifest의 preset으로 Harness 관리 파일만 갱신합니다.

```bash
npx beez-agent-harness update
npx beez-agent-harness update --check
npx beez-agent-harness update --diff
npx beez-agent-harness update --check --diff
```

- `--check`: 쓰지 않고 update 또는 drift가 있으면 `1`
- `--diff`: 쓰지 않고 현재/제안 관리 파일 내용 표시

`update`는 `.harness/project.json`, 기존 루트 `AGENTS.md`, source,
`.harness/runs/`를 덮어쓰지 않습니다.

## `run start`

하나의 active run을 시작하고 저장소/설정 identity와 선택한 검증 목록을
snapshot합니다.

```bash
npx beez-agent-harness run start
npx beez-agent-harness run start --profile migration
npx beez-agent-harness run start \
  --domain migration \
  --domain security \
  --mode change \
  --risk high \
  --side-effects local \
  --profile migration
```

Workflow field는 하나의 선택 그룹입니다. 하나라도 주면 네 종류를 모두
지정해야 합니다.

- `--domain <name>`: 중복 없이 반복 가능. `general`, `debug`, `migration`,
  `security`, `release`, `performance`, `github`
- `--mode <name>`: `explain`, `inspect`, `diagnose`, `plan`, `change`, `verify`,
  `review`, `execute`
- `--risk <name>`: `low`, `medium`, `high`, `critical`
- `--side-effects <name>`: `none`, `local`, `repository`,
  `external-production`
- `--profile <name>`: 존재하는 `verification.profiles` 항목 선택

`--profile`이 없으면 `verification.required`를 snapshot합니다. 동시에 하나의
run만 active일 수 있습니다.

## `run status`, `list`, `resume`

```bash
npx beez-agent-harness run status
npx beez-agent-harness run status --run <uuid>
npx beez-agent-harness run list
npx beez-agent-harness run resume
npx beez-agent-harness run resume --run <uuid>
```

`status`는 상태, 시간, route, 선택 profile, 필수 명령, 결과, checkpoint 수를
표시합니다. `list`는 최신 run부터 정렬합니다. `resume`은 active run에
`run.resumed` event를 추가하며 terminal run을 다시 열지 않습니다.

## `run checkpoint`

Artifact 원문을 저장하지 않고 제한된 수명주기 phase를 기록합니다.

```bash
npx beez-agent-harness run checkpoint \
  --phase compatibility \
  --state completed

npx beez-agent-harness run checkpoint \
  --phase benchmark.after \
  --state completed \
  --artifact reports/benchmark.json
```

- `--phase <name>`: 1~64자. 소문자·숫자 segment를 `.`, `_`, `-`로 구분
- `--state <name>`: `started`, `completed`, `blocked`
- `--artifact <path>`: 선택적인 프로젝트 내부 일반 파일, 최대 10MiB
- `--run <id>`: 기본 active run 대신 지정한 active run 선택

절대 경로, 상위 이동, symlink, directory, 누락 파일, 초과 크기는 거부합니다.
증거에는 최대 256자의 경로와 SHA-256만 저장합니다. Run 하나는 checkpoint
100개, 전체 event 500개로 제한됩니다.

## `run finish`, `gc`

```bash
npx beez-agent-harness run finish
npx beez-agent-harness run finish --state failed
npx beez-agent-harness run finish --state cancelled --run <uuid>
npx beez-agent-harness run gc --keep 20
```

`finish` 기본 상태는 `completed`입니다. 선택 검증이 누락·실패했거나 시작 후
`project.json`이 바뀌면 완료를 거부합니다. `failed`와 `cancelled`는 성공 검증을
주장하지 않습니다. Terminal run은 변경할 수 없습니다.

`gc`는 최신 N개 terminal run을 보존하고(기본 20) 그보다 오래된 증거를
영구 삭제합니다. Active run은 삭제하지 않습니다. Retention을 낮추기 전에
`run list`를 확인합니다.

## `verify`

하나의 active run에 대해 등록된 명령을 실행합니다.

```bash
npx beez-agent-harness verify --command test
npx beez-agent-harness verify --required
npx beez-agent-harness verify --profile security
npx beez-agent-harness verify --required --run <uuid>
```

다음 중 정확히 하나를 선택합니다.

- `--command <name>`: `commands`의 한 명령
- `--required`: run에 snapshot된 필수 목록
- `--profile <name>`: `run start`에서 같은 profile을 선택한 경우 그 snapshot 목록

명령은 설정 순서와 명령별 timeout으로 실행됩니다. 출력은 현재 터미널에
표시합니다. Run 증거에는 이름, 명령 digest, 결과, 시간, exit code, signal만
저장합니다. 선택된 모든 명령을 시도하며 하나라도 실패·timeout·중단되면 CLI가
`1`로 종료합니다.

## `version`, `help`

```bash
npx beez-agent-harness version
npx beez-agent-harness --version
npx beez-agent-harness help
npx beez-agent-harness help run
npx beez-agent-harness run --help
```
