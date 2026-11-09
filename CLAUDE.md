# Tasty 홈페이지

[Tasty](https://github.com/zilhak/tasty)의 랜딩 페이지와 사용자 가이드 소스 레포다. 공개 레포다.

## 역할

- Tasty를 내려받아 쓰는 사람을 위한 정보를 제공한다. 소스 경로, ADR, IPC 메서드 이름처럼 개발자용 내용은 넣지 않는다.
- 공개 사이트는 사용자가 받을 수 있는 버전을 설명한다.

사이트 구조와 빌드·집필 규칙은 [사이트 개발 문서](docs/dev/site.md)에 있다.

## 게시용 페이지와 최신 페이지

이 레포는 페이지를 두 벌 관리한다.

- 게시용 페이지: 릴리스된 Tasty 버전을 설명하는 페이지 소스다. 공개 사이트에 배포하는 것은 이 페이지뿐이다.
- 최신 페이지: 개발 중에 바뀐 사실을 바로 반영해 두는 페이지 소스다. 로컬에서만 확인하고 배포하지 않는다.
- 사용자에게 보이는 동작이 바뀌면 최신 페이지를 고친다. 그 설명은 Tasty를 릴리스할 때 게시용 페이지로 옮긴다.
- 기능 설명이나 버전이 바뀌는 변경은 Tasty를 릴리스할 때 최신 페이지를 게시용 페이지로 옮겨 배포한다. 공개 사이트의 설명이 실제로 릴리스된 내용과 어긋나지 않게 하기 위해서다.
- 공개된 Tasty 버전의 기능 설명이나 버전이 바뀌지 않는 변경은 릴리스를 기다리지 않고 아래의 게시용 수정으로 바로 배포한다.
- 게시용 페이지에는 그 릴리스와 같은 버전 태그를 붙인다. 태그 이름은 Tasty 레포의 릴리스 태그와 같게 쓴다.

### 브랜치

- `main`: 최신 페이지다. 게시용 수정을 뺀 기획서, 문구, 갤러리 디자인 작업은 모두 `main`에서 한다. push하면 빌드와 검사만 하고 배포하지 않는다.
- `release`: 게시용 페이지다. 배포는 `release`에 push될 때만 한다.
- 승격: Tasty 릴리스 때 `release`를 `main`으로 fast-forward하고, 그 커밋에 Tasty 릴리스와 같은 태그를 붙인다. 태그와 함께 `git push --atomic origin release <tag>`로 push한다.
- 게시용 수정: 공개된 Tasty 버전의 기능 설명이나 버전이 바뀌지 않는 변경(문구, 메타데이터 등)은 묻지 않고 `release`에 커밋해 태그 없이 배포한다. 그 직후 `release`를 `main`에 합쳐 `release`가 항상 `main`에 포함되게 한다. 그래야 다음 승격이 fast-forward로 된다.

## 갤러리

이 레포의 갤러리는 Tasty UI 디자인의 정본이다. 다른 곳에 디자인 사본을 두지 않는다. 디자인 변경은 레포를 넘어 아래 순서로 진행한다.

1. 이 레포의 갤러리에 디자인을 먼저 반영한다. 디자인은 구현하는 세션이 정하지 않고, 디자인을 맡은 별도의 Claude 세션이 이 레포의 갤러리 소스를 고쳐 정한다.
2. Tasty 레포의 갤러리(`crates/tasty-gallery`)에 같은 형상을 구현한다.
3. Tasty 본체 소스에 적용한다. 갤러리와 본체는 같은 컴포넌트 소스를 쓰므로, 모양만 바꾸는 변경은 2단계에서 본체에도 반영된다.

갤러리도 두 벌 규칙을 따른다. 디자인은 최신 페이지의 갤러리에 반영하고, 게시용 갤러리는 릴리스할 때 함께 옮긴다.

### 디자인 작업 규칙

디자인 정본은 `vendor/`다. 구성과 기본 원칙은 [vendor/README.md](vendor/README.md), 대비와 바탕·잉크 규칙은 [vendor/RULES.md](vendor/RULES.md)에 있다. 디자인 변경 기록은 커밋 이력이 맡으므로 커밋 본문에 바꾼 것, 근거, 구현 쪽이 알아야 할 것을 적는다.

- 토큰은 3계층이다(primitive → semantic → component, 모두 `--tasty-*`). UI에 literal이나 primitive를 직접 쓰지 않는다. 토큰은 추가만 하고 이름을 바꾸거나 지우지 않는다.
- 토큰 CSS를 바꾸면 같은 커밋에서 `vendor/tokens/tasty.tokens.json`을 `scripts/design-tokens/gen_tokens_json.py`로 다시 만들고 `scripts/design-tokens/verify_tokens_json.py`로 대조한다. 값을 손으로 옮겨 적지 않는다.
- Catppuccin Mocha(기본)와 Latte, 4px 그리드, 1px 보더, 4px radius, 14px UI 폰트 상한, 터미널 콘텐츠 0ms를 지킨다. 페이지 안의 표면에는 shadow를 쓰지 않는다. 떠 있는 표면만 `--tasty-shadow-popover`, `--tasty-shadow-modal` 중 하나를 쓴다.
- 이모지는 쓰지 않는다. 아이콘은 `vendor/icons/<name>.svg`와 `Icon` 컴포넌트로만 쓴다.
- 문구는 번역 키마다 en, ko, ja, zh-Hans를 모두 정한다. 영어는 sentence case로 쓴다. 앱 문구의 zh-Hans 값은 디자이너가 Codex로 쓰고, 용어는 `vendor/i18n/zh-Hans/glossary.json`을 따른다. Tasty에 zh-Hans를 등록하기 전에는 요청이 언어를 정했으면 요청을 따른다.
- 대비는 텍스트 4.5:1, 테두리·포커스·아이콘 3:1을 Mocha와 Latte 양쪽에서 지킨다.
- 창·모달·팝업·공용 위젯을 만들거나 바꾸면 같은 커밋에서 `vendor/gallery/`의 표본도 고친다. 표본에서 토큰이나 컴포넌트 시각을 다시 정의하지 않는다.
- 갤러리 파일은 ES 모듈이다. `gallery/<페이지>/index.jsx`와 그 페이지 폴더, 공용 `gallery/parts/`에 두고 `import`로 연결한다. 형식은 [vendor/gallery/README.md](vendor/gallery/README.md)를 따른다.
- 계약 행을 더하면 페이지의 `states.jsx`에 계약 이름을, 부품 위치가 필요하면 `parts/part-map.js`에 넣는다.
- 숨은 상태는 클릭하지 않아도 보이도록 프레임으로 둔다. `data-audit-exempt`와 `data-ink-grade`는 `vendor/RULES.md` 14절대로 표시한다.
- 디자인을 바꾼 뒤 `npm run build`, `npm run check-contrast`, `npm run check-icons`, `npm run check-tokens-copy`를 통과시킨다.

## 기획서

홈페이지 기획서는 `docs/plan/`에 두고 커밋한다.

- 기획서는 어떤 페이지를 두고 페이지마다 무엇을 보여 줄지 정리한 문서다. 페이지 소스가 아니다.
- 기획서에는 문구를 적지 않는다. 문구는 최신 페이지에 바로 쓴다.
- 페이지를 고칠 때는 기획서를 기준으로 삼는다.

## Git 규칙

- [Conventional Commits](https://www.conventionalcommits.org/)를 따른다: `type(scope): description`. type은 `feat`, `fix`, `docs`, `refactor`, `test`, `perf`, `style`, `i18n`, `chore` 중에서 고른다.
- 제목과 본문은 영어 평문으로 쓰고 Markdown 서식을 쓰지 않는다.
- 한 커밋에는 한 변경만 담는다. 기능 수정이나 추가가 끝나면 다시 묻지 않고 커밋한다. 리팩토링과 기능 추가는 나눈다.
- `--no-verify`를 쓰지 않는다. 훅이 막으면 우회하지 말고 고치거나 보고한다.
- `.claude`와 `.claude-workspace`는 git에 넣지 않는다. 로컬 경로와 로컬 작업 문서를 이 레포에 적지 않는다.
- 자세한 기준은 [커밋 컨벤션](https://github.com/zilhak/tasty/blob/main/docs/dev-guide/commit-convention.md)을 따른다.
