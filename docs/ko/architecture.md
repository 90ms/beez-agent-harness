# 아키텍처

[한국어](architecture.md) | [English](../en/architecture.md)

Beez Agent Harness는 agent runtime이나 애플리케이션 라이브러리가 아닙니다.
설치된 Agent Skill, 저장소 소유 정책, 로컬 실행 증거를 연결하는 얇은 제어
계층입니다.

## 적용 구조

```text
에이전트 환경
└── plugin 또는 선택한 skills/       재사용 가능한 자연어 workflow

대상 저장소
├── AGENTS.md                         에이전트 진입 안내
└── .harness/
    ├── manifest.json                 적용 버전과 관리 파일 해시
    ├── project.json                  명령, profile, 경계
    ├── generated/AGENTS.md           생성된 routing/evidence 안내
    └── runs/<run-id>/                로컬 운영 증거
```

프로젝트 소스에서 Harness를 `import`하지 않습니다. Skill 설치는 workflow를
에이전트가 발견할 수 있게 하고, `init`은 그 workflow를 저장소의 실제 명령과
경계에 연결합니다.

## Workflow 계층

`using-beez-harness`가 routing 계층입니다. 요청마다 다음을 분류합니다.

- 하나 이상의 domain: general, debug, migration, security, release,
  performance, GitHub
- mode: explain, inspect, diagnose, plan, change, verify, review, execute
- risk: low, medium, high, critical
- 가장 먼 side effect: none, local, repository, external production

Router는 core 수명주기 Skill(`beez-spec`, `beez-plan`, `beez-implement`,
`beez-verify`, `beez-review`)을 선택하고, 전문 영역이 실제로 포함되면
`beez-debug`, `beez-migrate`, `beez-security`, `beez-release`,
`beez-performance`, `beez-github`를 조합합니다.

전문 Skill은 같은 수명주기를 구체화할 뿐 명시적인 금지를 무시하거나 조회
요청을 수정 권한으로 바꾸지 않습니다. 복합 요청은 권한이 분리된 순서 있는
subroute가 됩니다.

## v0.4 run 증거

모든 run은 `active`로 시작해 `completed`, `failed`, `cancelled` 중 하나로
끝납니다.

```text
active -> completed
       -> failed
       -> cancelled
```

시작 시 CLI가 다음을 snapshot으로 보관합니다.

- 현재 프로젝트 설정 digest와 Git baseline
- 선택적인 domain, mode, risk, side-effect metadata
- `verification.required` 또는 선택한 profile의 순서 있는 명령 목록

run manifest는 검증 요약과 최대 100개의 제한된 phase checkpoint를
저장합니다. checkpoint에는 프로젝트 내부의 10MiB 이하 일반 파일을 연결할 수
있으며 경로와 SHA-256만 남습니다. event는 최대 500개입니다.

명령 원문, stdout/stderr, 환경 변수, secret, 모델 대화는 저장하지 않습니다.
시작 이후 설정 digest가 바뀌지 않았고 snapshot된 모든 검증이 통과해야만
`completed`가 허용됩니다.

`run resume`은 상태를 바꾸지 않고 resume event를 추가합니다. `run gc`는 오래된
terminal run만 제거하며 active run은 삭제하지 않습니다. Package update는
`.harness/runs/`를 관리하지 않습니다.

## 소유권과 업데이트

| 영역 | 소유자 | 업데이트 동작 |
| --- | --- | --- |
| 설치된 plugin 또는 Skill | 에이전트 환경 | plugin/Skill manager로 갱신 |
| `.harness/manifest.json` | Harness | `init`/`update`가 작성 |
| `.harness/generated/**` | Harness | 재생성 및 hash 검사 |
| `.harness/project.json` | 프로젝트 | `init`/`update`가 보존 |
| 루트 `AGENTS.md` | 프로젝트/shared | 없을 때만 생성, 이후 덮어쓰지 않음 |
| `.harness/runs/**` | 운영 상태 | run/verify 명령만 변경 |
| `.github/**` | 저장소 | GitHub 거버넌스로 review |

## 저장소 품질 계층

Harness 저장소 자체는 모든 Skill resource와 schema, provider-neutral 행동 및
routing case, 하위 호환성, package 내용, GitHub template, CODEOWNERS, 변경
불가능한 Action pin, dependency review, 지원 Node.js 버전, Windows 동작,
release ancestry를 검사합니다.

이 gate는 배포되는 Harness를 검증합니다. 대상 프로젝트의 명령, reviewer,
ruleset, deployment control, 게시 권한을 대신하지 않습니다.

## 안전 경계

- preview와 check 명령은 파일을 쓰지 않습니다.
- 검증은 프로젝트에 등록되고 명시적으로 선택된 명령만 실행합니다.
- 관리 파일 갱신은 `.harness/generated/` 안으로 제한됩니다.
- 구조화 상태는 임시 파일 작성 후 atomic rename으로 교체합니다.
- 경로, 일반 파일 여부, artifact 크기, hash, route 값, profile 참조를 기록 전에
  검증합니다.
- CLI는 model API 호출, telemetry 전송, Git/GitHub 변경, 게시, 배포를 하지
  않습니다.

규범 계약은 [`SPEC.md`](../../SPEC.md)를 참고하세요.
