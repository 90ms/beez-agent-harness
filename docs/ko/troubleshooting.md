# 문제 해결

[한국어](troubleshooting.md) | [English](../en/troubleshooting.md)

먼저 프로젝트 루트에서 상태를 확인합니다.

```bash
npx beez-agent-harness doctor
```

## 이미 초기화되었다는 오류

```text
Harness is already initialized; use `beez-harness update`
```

`.harness/manifest.json`이 이미 존재합니다. 다시 `init`하지 말고 다음 명령을
사용합니다.

```bash
npx beez-agent-harness update --check
npx beez-agent-harness update
```

프리셋을 바꾸려는 경우 Manifest를 직접 수정하지 마십시오. 현재 v0.1 CLI는
초기화 후 프리셋 변경 명령을 제공하지 않습니다.

## Manifest 또는 프로젝트 설정을 읽을 수 없음

```text
Cannot read harness manifest
Invalid JSON in project configuration
```

확인할 파일:

- `.harness/manifest.json`: Harness가 관리합니다.
- `.harness/project.json`: 프로젝트가 관리합니다.

`project.json`의 JSON 문법과 필드 타입을 수정한 뒤 `doctor`를 다시
실행합니다. Manifest가 손상됐다면 버전 관리에서 복구하는 것이 가장
안전합니다.

## 관리 파일 누락 또는 drift

```text
Managed file is missing: .harness/generated/AGENTS.md
Managed file has drifted: .harness/generated/AGENTS.md
Managed file differs from generated guidance: .harness/generated/AGENTS.md
```

프로젝트 고유 규칙을 생성 파일에 직접 작성했다면 먼저
`.harness/project.json` 또는 루트 `AGENTS.md`로 옮깁니다. 그다음 관리
파일을 복구합니다.

```bash
npx beez-agent-harness update
npx beez-agent-harness doctor
```

## 루트 `AGENTS.md` 경고

```text
warning: AGENTS.md is missing
warning: AGENTS.md does not reference .harness/generated/AGENTS.md
```

기존 `AGENTS.md`에 다음 안내를 추가합니다.

```markdown
Before starting software work, read `.harness/generated/AGENTS.md` and
`.harness/project.json`.
```

이 경고만 있을 때 `doctor`의 종료 코드는 `0`입니다.

## Harness 버전 차이

```text
warning: Project uses harness X; CLI provides Y
```

먼저 변경 여부를 확인하고 어댑터를 갱신합니다.

```bash
npx beez-agent-harness@latest update --check
npx beez-agent-harness@latest update
npx beez-agent-harness@latest doctor
```

`project.json`과 기존 루트 `AGENTS.md`는 보존됩니다.

## `update --check`가 CI에서 실패함

`update --check`는 업데이트나 drift를 발견하면 의도적으로 종료 코드 `1`을
반환합니다. 로그를 확인한 뒤 로컬에서 `update`를 실행하고 생성된 변경을
검토해 반영합니다.

## 지원하지 않는 옵션

```text
Unknown option or argument for doctor: --unknown
```

명령별 도움말에서 지원 옵션을 확인합니다.

```bash
npx beez-agent-harness help doctor
npx beez-agent-harness init --help
```

