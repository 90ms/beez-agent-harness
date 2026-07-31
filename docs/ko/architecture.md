# 아키텍처

Beez Agent Harness는 코딩 에이전트를 직접 실행하는 런타임이 아니라,
Agent Skill과 프로젝트별 규칙, 로컬 실행 증거를 연결하는 얇은 제어
계층입니다.

## 구성 요소

```text
전역 플러그인
└── skills/                     재사용 가능한 작업 절차

프로젝트 어댑터
├── AGENTS.md                   에이전트 진입점
└── .harness/
    ├── manifest.json           적용 버전과 관리 파일
    ├── project.json            프로젝트 명령어와 경계
    ├── generated/AGENTS.md     harness가 생성한 안내
    └── runs/<run-id>/          작업 실행 증거
```

`project.json`은 프로젝트가 소유하고, `generated/`는 harness가 소유합니다.
`runs/`는 CLI가 생성하는 운영 기록이며 패키지 업데이트 대상이 아닙니다.

## v0.3 실행 상태

각 실행은 `active`로 시작하고 `completed`, `failed`, `cancelled` 중 하나로
종료됩니다. 완료 상태는 필수 검증이 모두 통과했을 때만 허용됩니다.

```text
active -> completed
       -> failed
       -> cancelled
```

실행 manifest에는 설정 해시, Git 기준점, 시간, 검증 결과를 저장합니다.
명령어 원문, 환경 변수, stdout/stderr 원문과 모델 대화는 기본적으로
저장하지 않습니다.

`run resume`은 active 상태를 유지하면서 재개 이벤트를 남깁니다. `run gc`는
보존 개수보다 오래된 terminal run만 제거하며 active run은 삭제하지 않습니다.

## 안전 경계

- preview와 check 명령은 파일을 쓰지 않습니다.
- 검증 명령은 `project.json`에 등록되고 사용자가 선택한 경우에만 실행합니다.
- 관리 파일 업데이트는 `.harness/generated/` 내부로 제한됩니다.
- 구조화된 상태 교체는 임시 파일 작성 후 rename하는 방식으로 처리합니다.
- CLI는 모델 API, 원격 텔레메트리, Git 변경, 배포 작업을 수행하지 않습니다.

전체 계약과 완료 조건은 [`SPEC.md`](../../SPEC.md)를 참고하세요.
