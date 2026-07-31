# 행동 평가

이 디렉터리는 특정 모델이나 provider를 호출하지 않고 Beez Agent
Harness를 사용한 작업 결과를 같은 기준으로 비교하기 위한 계약을
제공합니다.

## 평가 항목

| 항목 | 배점 |
|---|---:|
| 요구사항 충족 | 35 |
| 테스트 통과 | 25 |
| 요청 범위 보존 | 15 |
| 검증 명령 실행 | 15 |
| 완료 주장에 근거 포함 | 10 |

총점 85점 이상이면서 `requirementsMet`와 `testsPassed`가 모두 참이어야
통과합니다.

## 사용법

작업 실행기는 `schemas/evaluation-result.schema.json` 형식의 결과 파일을
만듭니다. Beez 자체는 모델을 실행하지 않으며, 결과만 결정론적으로
채점합니다.

```bash
node scripts/evaluate.mjs evals/fixtures/passing-result.json
```

여러 모델이나 Skill 버전을 비교할 때는 같은 case와 동일한 판정 절차를
사용해야 합니다. 시간, 토큰, 비용, 변경 파일 수처럼 환경에 따라 달라지는
수치는 `metrics`에 기록할 수 있지만 기본 점수에는 포함되지 않습니다.

`cases/`에는 평가할 작업 계약을 두고, `fixtures/`에는 scorer 자체를 검증할
예제 결과를 둡니다.
