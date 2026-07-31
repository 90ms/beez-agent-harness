# CLI 명령어

[한국어](cli-reference.md) | [English](../en/cli-reference.md)

## 기본 사용법

```text
beez-harness init [--preset base|nextjs]
beez-harness doctor
beez-harness update [--check]
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
```

옵션:

- `--preset <name>`: `base` 또는 `nextjs`. 기본값은 `base`입니다.
- `-h`, `--help`: 명령 도움말을 출력합니다.

이미 `.harness/manifest.json`이 존재하면 종료 코드 `1`을 반환하며 기존 상태를
변경하지 않습니다.

## `doctor`

프로젝트 어댑터의 설정과 관리 파일 상태를 읽기 전용으로 점검합니다.

```bash
npx beez-agent-harness doctor
```

검사 항목:

- Manifest와 프로젝트 설정 형식
- 관리 파일 경로와 SHA-256
- 관리 파일 누락 또는 drift
- 현재 템플릿과 생성 안내문의 차이
- 루트 `AGENTS.md` 연결
- 적용 버전과 현재 CLI 버전 차이

오류가 없으면 종료 코드 `0`, 하나 이상의 오류가 있으면 `1`입니다. 누락된
루트 `AGENTS.md`나 버전 차이는 경고이므로 다른 오류가 없다면 종료 코드
`0`을 유지합니다.

## `update`

Manifest에 기록된 프리셋으로 Harness 관리 파일을 갱신합니다.

```bash
npx beez-agent-harness update
```

`.harness/project.json`과 기존 루트 `AGENTS.md`는 덮어쓰지 않습니다.

### `update --check`

파일을 변경하지 않고 새 Harness 버전이나 drift 여부를 확인합니다.

```bash
npx beez-agent-harness update --check
```

- 변경이 없으면 종료 코드 `0`
- 업데이트 또는 drift가 있으면 종료 코드 `1`

CI에서는 종료 코드 `1`을 업데이트 필요 신호로 사용할 수 있습니다.

## `version`

현재 CLI 패키지 버전을 출력합니다.

```bash
npx beez-agent-harness version
npx beez-agent-harness --version
```

## `help`

전체 또는 명령별 도움말을 출력합니다.

```bash
npx beez-agent-harness help
npx beez-agent-harness help init
npx beez-agent-harness update --help
```

