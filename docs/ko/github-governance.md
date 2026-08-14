# GitHub 거버넌스

저장소 파일은 협업 형식을 표준화하고 GitHub ruleset은 원격 상태를 강제합니다.
이 문서나 CODEOWNERS, template을 커밋하는 것만으로 ruleset이 생성되거나
변경되지는 않습니다. 저장소 관리자 또는 repository rules 편집 권한이 있는
역할이 설정을 검토하고 적용해야 합니다.

## 권장 `main` branch ruleset

기본 branch를 대상으로 active enforcement를 사용합니다.

- merge 전에 pull request를 요구합니다.
- 승인 review 1개와 소유 경로의 CODEOWNER review를 요구합니다.
- review 가능한 변경이 추가되면 기존 승인을 무효화하고 모든 대화 해결을
  요구합니다.
- 현재 CI job인 `validate (20)`, `validate (22)`, `validate (24)`, `windows`,
  `dependency-review`를 required check로 지정합니다.
- check 이름이 안정적인지 확인한 뒤 최신 base branch 상태를 요구합니다.
- force push와 branch 삭제를 차단합니다.
- bypass는 이름이 지정된 비상 maintainer 또는 감사 가능한 release app으로
  제한합니다.
- 저장소가 지원하는 merge 방법을 허용하되 `CONTRIBUTING.md`의 기준을
  따릅니다.

Required check 이름은 workflow job 이름입니다. job 이름이 바뀌면 ruleset도
갱신해야 합니다. 가능하면 새 ruleset을 evaluate mode로 관찰한 뒤 활성화합니다.

## 권장 release tag ruleset

`v*` tag를 대상으로 다음을 적용합니다.

- update, force push, 삭제를 차단합니다.
- 생성 권한을 승인된 release maintainer 또는 release workflow로 제한합니다.
- tag가 저장소의 동기화된 버전 metadata를 가리키게 합니다.
- 공개된 tag를 bypass로 이동하지 않고 새 버전으로 복구합니다.

Tag 보호는 npm protected environment, trusted publishing, artifact 검사,
`beez-release` gate를 대체하지 않습니다.

## 소유권

`.github/CODEOWNERS`는 기본 소유자와 policy, workflow, skill, schema, 평가 계약,
CLI/run 코드, test, release check의 소유자를 지정합니다. 등록된 소유자가 write
권한을 가지고 branch 또는 ruleset이 CODEOWNER review를 요구할 때 GitHub가 이를
요청하고 강제합니다.

## Issue와 pull request 접수

Issue form은 bug, feature, 성능 회귀, migration에 필요한 증거를 수집합니다.
일반 사용자의 blank issue는 비활성화하고, 취약점은 private vulnerability
reporting으로 안내합니다.

PR template은 목적, 변경 유형, 위험도, side effect, 호환성, 검증,
보안/성능 영향, rollback, 외부 작업을 기록합니다. Template은 검토와 CI를
대체하지 않습니다.

GitHub 설정에서 dependency graph와 dependency review도 활성화해야
`dependency-review` job이 동작합니다. Private vulnerability reporting을 켜고,
maintainer 구성에서 가능하면 `npm` environment에 required reviewer를 지정하며,
Actions source를 승인된 범위로 제한합니다. 이 설정은 workflow YAML만으로 강제할
수 없습니다.

## 비상 변경

사건, bypass 주체, 사유, 변경 commit, 실행한 check, 사후 review를 기록합니다.
긴급 상황에서도 가능하면 PR을 사용합니다. 즉시 정상 enforcement를 복원하고
연기된 test, review, migration, rollback 증거는 후속 issue로 관리합니다.

GitHub 공식 문서의 [CODEOWNERS](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners),
[issue form](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-githubs-form-schema),
[ruleset 규칙](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)을 함께 참고하세요.
