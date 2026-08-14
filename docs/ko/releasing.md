# 릴리스 가이드

[한국어](releasing.md) | [English](../en/releasing.md)

릴리스 준비, repository 게시, npm 게시, GitHub Release, 배포는 서로 다른
권한입니다. 버전 수정과 dry-run은 tag 또는 게시 권한을 주지 않습니다.

Tag 기반 workflow는 `origin/main`에서 도달 가능한 정확한 commit을 검증하고,
OIDC Trusted Publishing으로 npm에 게시한 뒤 GitHub Release를 생성합니다.

## 저장소 최초 설정

### npm Trusted Publisher

npm package 설정에 다음 publisher를 등록합니다.

| 항목 | 값 |
| --- | --- |
| Provider | GitHub Actions |
| Organization or user | `90ms` |
| Repository | `beez-agent-harness` |
| Workflow filename | `release.yml` |
| Environment | `npm` |
| Allowed action | `npm publish` |

이름은 대소문자를 구분합니다. [npm Trusted Publishing
문서](https://docs.npmjs.com/trusted-publishers/)를 참고하세요.

### GitHub control

보호된 `npm` Environment를 만들고 maintainer 구성에 맞는 required reviewer를
설정합니다. [GitHub 거버넌스](github-governance.md)의 `main`과 `v*` ruleset을
적용합니다. PR dependency review를 위해 Dependency graph를 켜고 private
vulnerability reporting을 유지합니다.

## 버전 릴리스 준비

1. 의도한 semantic version과 release 범위를 확인합니다.
2. `package.json`과 `.codex-plugin/plugin.json`을 수정합니다.
3. 새 CLI의 adapter update를 실행해 `.harness/manifest.json`과 생성 안내도 같은
   버전으로 맞춥니다.
4. Unreleased 항목을 날짜가 있는 `CHANGELOG.md` section으로 옮깁니다.
5. Package 내용을 review하고 모든 gate를 실행합니다.

```bash
npm run check
npm run validate
npm run evaluate
npm test
npm pack --dry-run
node scripts/check-release.mjs vX.Y.Z
git fetch origin main
node scripts/check-release-ancestry.mjs HEAD origin/main
```

`check-release.mjs`는 요청 tag, package, plugin, 적용 adapter, 생성 안내, 날짜가
있는 changelog를 맞춥니다. Ancestry 검사는 안전하지 않은 ref 문법과
`origin/main`에서 도달할 수 없는 정확한 release commit을 거부합니다.

설정되어 있다면 `release` profile로 Harness run을 사용합니다. Review에 실제로
도움이 될 때만 release contract 또는 package report의 제한된 checkpoint를
기록하고 registry token이나 raw log는 저장하지 않습니다.

## Review와 merge 준비

호환성, 보안/성능 영향, rollback, check, 요청된 외부 작업을 적은 PR을 엽니다.
Required CI는 Node.js 20/22/24, Windows, 결정론적 평가, test, package dry-run,
dependency review를 포함합니다. Action은 변경 불가능한 full commit SHA로 pin하고
job에는 timeout을 둡니다.

Tag를 만들기 전에 버전 commit을 `main`에 merge합니다. Side branch tag는
release ancestry gate를 통과하지 못합니다.

## 명시적 권한이 있을 때만 게시

Review된 release commit에서 실행합니다.

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```

Workflow 순서는 다음과 같습니다.

1. 정확한 release ancestry와 버전 정합성
2. 문법, 저장소 검증, 행동/routing 평가, test, package dry-run
3. 보호된 `npm` Environment 승인
4. OIDC와 provenance를 사용하는 npm 공개 게시
5. 검증 tag에 대한 idempotent GitHub Release 생성

요청이 준비 또는 PR만 허용했다면 tag 명령을 실행하지 않습니다.

## 실패와 복구

- **Tag 공유 전:** release commit을 수정하고 모든 gate를 다시 실행한 뒤 수정된
  merged commit에 tag를 만듭니다.
- **npm 게시 전 tag workflow 실패:** tag policy 안에서 문제를 수정합니다.
  보호되거나 공유된 tag를 안전하게 교체할 수 없으면 새 버전을 사용합니다.
- **npm 성공 후 GitHub Release 실패:** 같은 버전을 다시 게시하지 않습니다.
  기존 release를 먼저 확인하는 GitHub Release job만 재실행합니다.
- **잘못된 package 게시:** 버전은 변경할 수 없습니다. npm 정책에 따라
  deprecate하고 수정 patch release를 준비합니다.
- **배포 실패:** package/GitHub 게시와 배포는 별개입니다. 게시 tag를 움직이지
  않고 대상 시스템의 rollback을 따릅니다.

이미 공유되었거나 게시에 사용된 tag는 이동하지 않습니다.
