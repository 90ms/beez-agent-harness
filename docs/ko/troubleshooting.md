# 문제 해결

[한국어](troubleshooting.md) | [English](../en/troubleshooting.md)

대상 저장소 root에서 상태부터 확인합니다.

```bash
npx beez-agent-harness doctor
npx beez-agent-harness doctor --json
```

## 자연어 요청이 Beez Skill을 선택하지 않음

프로젝트 어댑터와 Skill은 별도 설치 계층입니다. `.harness/`는 프로젝트
context를 제공하지만 에이전트 환경에 Skill을 설치하지 않습니다.

1. Plugin 또는 선택한 Skill이 설치되어 있는지 확인하고 최초 설치 후 agent
   host를 다시 시작합니다.
2. 루트 `AGENTS.md`가 `.harness/generated/AGENTS.md`와
   `.harness/project.json`을 읽도록 안내하는지 확인합니다.
3. `$using-beez-harness` 또는 `$beez-debug`로 명시적으로 호출해 Skill 발견
   문제와 routing 문제를 구분합니다.

Host마다 `SKILL.md` 발견 방식은 다를 수 있습니다. Workflow는 standalone으로도
쓸 수 있지만 자동 routing은 host가 Skill description을 에이전트에 노출해야
동작합니다.

## 이미 초기화됨

```text
Harness is already initialized; use `beez-harness update`
```

Manifest를 지우거나 직접 고치지 말고 update 흐름을 사용합니다.

```bash
npx beez-agent-harness update --check
npx beez-agent-harness update --diff
npx beez-agent-harness update
```

CLI는 초기화된 project를 다른 preset으로 자동 migration하지 않습니다. 요구가
바뀌면 프로젝트 소유 명령과 경계를 명시적으로 수정합니다.

## Manifest 또는 프로젝트 설정을 읽을 수 없음

```text
Cannot read harness manifest
Invalid JSON in project configuration
```

손상된 `.harness/manifest.json`은 version control 또는 확인된 package update에서
복원합니다. 프로젝트 소유 `.harness/project.json`의 JSON syntax와 field type을
수정하고 `doctor`를 다시 실행합니다. 설치 CLI가 의도한 contract를 지원하는지
확인하기 전에 모르는 field를 임의로 지우지 않습니다.

## 관리 안내 누락 또는 drift

```text
Managed file is missing: .harness/generated/AGENTS.md
Managed file has drifted: .harness/generated/AGENTS.md
Managed file differs from generated guidance: .harness/generated/AGENTS.md
```

생성 파일의 프로젝트 고유 문장을 `.harness/project.json` 또는 루트
`AGENTS.md`로 옮긴 뒤 재생성합니다.

```bash
npx beez-agent-harness update
npx beez-agent-harness doctor
```

## 루트 `AGENTS.md` warning

```text
warning: AGENTS.md is missing
warning: AGENTS.md does not reference .harness/generated/AGENTS.md
```

프로젝트 소유 안내를 추가합니다.

```markdown
Before starting software work, read `.harness/generated/AGENTS.md` and
`.harness/project.json`.
```

Warning만 있으면 `doctor`는 non-zero로 종료하지 않습니다.

## 적용 Harness 버전 차이

```text
warning: Project uses harness X; CLI provides Y
```

원하는 CLI 버전으로 adapter update를 preview하고 적용합니다.

```bash
npx beez-agent-harness@latest update --check
npx beez-agent-harness@latest update --diff
npx beez-agent-harness@latest update
npx beez-agent-harness@latest doctor
```

프로젝트 설정과 기존 root 안내는 보존됩니다.

## 알 수 없거나 일치하지 않는 검증 profile

```text
Unknown verification profile: security
Run ... selected verification profile release, not security.
```

Run 시작 전에 `.harness/project.json`에 profile과 참조하는 모든 명령을
선언합니다. Run은 하나의 profile을 snapshot하므로 `verify --profile`에도 같은
이름을 사용합니다. 다른 profile이 필요하면 기존 run을 끝내고 원하는 profile로
새로 시작합니다. `verify --command <name>`은 추가 등록 검사용이며 선택 profile의
누락 결과를 대신하지 않습니다.

## Run 완료 불가 또는 설정 변경

```text
Run cannot complete; required verification has not passed
Project configuration changed after the run started
```

Run을 확인하고 선택된 gate를 실행합니다.

```bash
npx beez-agent-harness run status
npx beez-agent-harness verify --required
# 또는: npx beez-agent-harness verify --profile <selected-profile>
npx beez-agent-harness run finish
```

시작 후 `project.json`이 바뀌면 기존 증거는 의도적으로 stale 처리됩니다.
Run을 `failed` 또는 `cancelled`로 끝내고 새로 시작합니다.

## 중단 후 active run이 남음

중단은 성공이나 실패를 자동 주장하지 않습니다.

```bash
npx beez-agent-harness run resume
npx beez-agent-harness run status
npx beez-agent-harness run finish --state cancelled
```

동시에 하나의 run만 active일 수 있고 `run gc`는 이를 제거하지 않습니다.
정리된 terminal 증거는 CLI로 복구할 수 없으므로 `gc` 전에 `run list`를
확인합니다.

## Checkpoint artifact 거부

Artifact는 프로젝트 내부로 resolve되는 10MiB 이하 일반 non-symlink 파일이어야
하며 경로는 256자 이하여야 합니다. Raw log, secret, directory, 절대 경로,
저장소 밖 파일 대신 작은 요약 파일을 기록합니다. 증거에는 경로와 digest만
들어가고 내용은 프로젝트에 남습니다.

## `dependency-review`가 저장소를 지원하지 않음

Repository security 설정에서 Dependency graph를 활성화합니다. GitHub가
지원하는 저장소에서는 Dependabot alerts 활성화로 graph가 함께 준비됩니다.
그 뒤 실패 job을 재실행합니다. Workflow가 이 관리자 설정을 켤 수 없으므로
fork와 새 저장소는 각각 설정해야 합니다.

## Release ancestry 검사 실패

```text
Release commit ... must be reachable from origin/main
```

`origin/main`을 fetch하고 정확한 tag/commit이 default branch에 merge되었는지
확인합니다. Side branch tag로 검사를 우회하지 않습니다. Review된 release
commit을 먼저 merge한 뒤 권한을 받아 새 tag를 만듭니다.

## `update --check`가 CI에서 실패

새 버전 또는 관리 drift가 있으면 의도적으로 `1`을 반환합니다.
`update --diff`로 확인하고 로컬에서 `update`를 적용한 뒤 생성 변경을 review하고
commit합니다.

## 지원하지 않는 option

```text
Unknown option or argument for doctor: --unknown
```

명령별 help를 확인합니다.

```bash
npx beez-agent-harness help doctor
npx beez-agent-harness help run
npx beez-agent-harness verify --help
```
