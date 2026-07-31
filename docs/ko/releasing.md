# 릴리스 가이드

[한국어](releasing.md) | [English](../en/releasing.md)

태그 기반 GitHub Actions 워크플로가 검증, npm 게시, GitHub Release 생성을
순서대로 수행합니다. npm 게시는 장기 토큰 대신 OIDC Trusted Publishing을
사용합니다.

## 최초 설정

### npm Trusted Publisher

npm 패키지 설정에서 다음 Trusted Publisher를 등록합니다.

| 항목 | 값 |
| --- | --- |
| Provider | GitHub Actions |
| Organization or user | `90ms` |
| Repository | `beez-agent-harness` |
| Workflow filename | `release.yml` |
| Environment | `npm` |
| Allowed action | `npm publish` |

워크플로 파일명과 환경 이름은 대소문자까지 정확히 일치해야 합니다. 설정
방법은 [npm Trusted Publishing 공식 문서](https://docs.npmjs.com/trusted-publishers/)를
참고합니다.

### GitHub Environment

저장소에 `npm` environment를 만들고 필요한 승인자를 지정합니다. 태그
보호 규칙도 함께 설정하는 것을 권장합니다. `publish` 작업은 이 environment
승인 후에만 실행됩니다.

## 릴리스 준비

1. `package.json`과 `.codex-plugin/plugin.json`의 버전을 올립니다.
2. 새 CLI 버전으로 프로젝트 어댑터를 갱신해 `.harness/manifest.json`과
   생성 안내문의 버전을 맞춥니다.
3. `CHANGELOG.md`의 Unreleased 항목을 날짜가 있는 버전 섹션으로 옮깁니다.
4. 전체 검사를 실행합니다.

```bash
npm run check
npm run validate
npm test
npm pack --dry-run
node scripts/check-release.mjs vX.Y.Z
```

## 게시

릴리스 커밋에 버전과 같은 태그를 만들고 푸시합니다.

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```

워크플로는 다음 순서로 동작합니다.

1. 태그, 패키지, 플러그인, 프로젝트 어댑터, 변경 이력 버전 일치 확인
2. 문법 검사, 구조 검증, 테스트, 패키징 검사
3. `npm` environment 승인
4. OIDC로 npm 공개 패키지 게시
5. 같은 태그로 GitHub Release 생성

Trusted Publishing에서는 npm이 provenance를 자동 생성합니다.

## 실패와 복구

- 게시 전 실패: 문제를 수정한 새 커밋에서 태그를 다시 만들 수 있습니다.
- npm 게시 후 실패: 같은 버전은 다시 게시할 수 없습니다. GitHub Release
  작업만 재실행하거나 후속 패치 버전을 준비합니다.
- 잘못 게시된 패키지: npm 정책에 따라 해당 버전을 deprecate하고 수정
  버전을 게시합니다.

이미 원격에 공유한 태그를 임의로 이동하지 마십시오.
