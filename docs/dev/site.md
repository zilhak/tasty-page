# 공개 사이트 (GitHub Pages)

랜딩 페이지와 **사용자 가이드**를 정적 HTML 로 발행하는 경로. 산출물은 GitHub Pages 로 배포된다.

- 앱: 레포 루트 (Astro + React, Node 22)
- 콘텐츠: `content/` (한국어 정본) · `content/en/` (영어 번역). 번역 폴더는 언어 목록의 `contentDir`이 정한다
- 문구: `src/lib/i18n/` (언어당 사전 하나. "언어 목록과 사전" 참고)
- 산출물: 레포 루트 아래 `dist/` — 빌드가 만들며 Git에서 제외한다(경로 인용으로 안 적는다. 갓 클론한
  트리에는 없어서 좌표를 실재로 판정하는 CI의 경로 검사가 실패할 수 있다)
- 배포: `.github/workflows/pages.yml`. `main`과 `release`의 push마다 `npm run build`로 빌드하고
  `npm run check-links`로 산출물의 내부 링크와 `content/` 앵커의 실제 HTML 결과, 디자인 페이지 사이 링크의 언어 유지를 전수 판정하고, `npm run check-sitemap`으로
  공개 페이지와 sitemap을 대조하고, `npm run check-translations`로 일본어·중국어 가이드를 한국어 원본과 대조한다.
  **배포는 `release` push와 `release`에서 수동 실행할 때만** 한다. 공개 사이트는 사용자가 받을 수 있는
  버전을 설명해야 하기 때문이다. `main`은 최신 페이지라 빌드와 검사만 한다. 표시 버전은 공개된 최신
  Tasty 릴리스(`release.json`)이고, 이 파일이 없는 로컬 빌드는 버전을 표시하지 않는다.
- 승격: Tasty를 릴리스할 때 `release`를 `main`으로 fast-forward하고 Tasty 릴리스와 같은 태그를 붙여
  `git push --atomic origin release <tag>`로 함께 push한다. 기능 설명이나 버전이 바뀌는 변경은 이때 함께 공개한다.
- 게시용 수정: 공개된 Tasty 버전의 기능 설명이나 버전이 바뀌지 않는 변경(문구, 메타데이터 등)은 묻지 않고
  `release`에 커밋해 태그 없이 배포한 뒤 곧바로 `release`를 `main`에 합친다([CLAUDE.md](../../CLAUDE.md) "게시용 페이지와 최신 페이지").
- 다른 CI: `checks.yml`은 `checks/`의 Rust 시험으로 가이드를 Tasty 소스와 대조한다. Tasty 소스는
  `.tasty-src`에 받으며, `main`에서는 Tasty `main`, `release`에서는 가장 가까운 태그와 같은 이름의 Tasty
  태그다. 매일 한 번도 실행한다. `design.yml`은 `vendor/` 디자인 정본을 검사한다(아래 "vendor 검사").
  `checks/Cargo.lock`은 추적하지 않는다. `checks/`의 의존성은 받은 Tasty 소스를 따라 움직이므로, CI는 실행할 때
  `.tasty-src/Cargo.lock`을 복사해 쓴다. 로컬에서 돌릴 때도 `cargo test` 전에 같은 복사를 한다.

**`docs/` 는 발행하지 않는다.** 이 레포의 `docs/`는 사이트를 고치는 사람과 에이전트를 위한 개발 문서(`docs/dev/`)와
기획서(`docs/plan/`)이고, 사이트는 Tasty 를 받아서 쓰는 사람을 위한 것이라 독자가 다르다. Tasty의 명세·설계·ADR은
[Tasty 레포](https://github.com/zilhak/tasty)의 `docs/`에 있다. 사이트가 실을 내용은 전부 `content/` 에 사용자 시점으로
따로 쓴다. 사용자에게 보이는 동작이 바뀌면 기획서를 기준으로 최신 페이지(`main`)의 가이드를 고친다.

## 사이트 문구와 어조

사이트는 터미널 자체를 먼저 소개하고, 구체적인 사용 상황과 실제 동작으로 기능을 설명한다.
랜딩 제목과 설명은 사용자의 행동·감정을 연출하는 광고 문구보다 기능과 사용 조건을 담는다.
“에이전트에게 맡기고, 내 작업도 이어가세요”처럼 막연한 효익을 권하는 대구는 피한다.
설치·조작에 필요한 안내는 “하세요”로 쓰되, 기능 소개마다 행동 권유를 반복하지 않는다.
한국어는 설명에 "합니다", 안내에 "하세요"를 사용한다. "이 페이지를 읽으면" 같은 반복적인
도입부, 과장된 보장, 내부 구현을 빗댄 표현은 피한다. 사용자 상태 보호는 포커스·선택·스크롤처럼
보장하는 범위를 명시하고, 연동 설정이 필요한 알림은 그 조건을 함께 설명한다.
크로스 플랫폼 소개는 워크스페이스·탭·화면 분할처럼 같은 방식으로 사용하는 기능을 설명하고,
설치 방법과 지원 아키텍처는 설치 가이드로 연결한다.
일본어는 설명에 です・ます체, 안내에 〜してください를 쓴다. 한국어의 "합니다", "하세요"에 대응한다.
일본어 표기는 앱 `lang/ja.toml`의 다수를 따른다. 일본어와 라틴 문자·숫자·인라인 코드 사이에 반각 공백을 넣는다. 괄호는 전각 `（）`를 쓰되 코드와 명령 안은 그대로 둔다. 콜론은 반각 `: `, `。`와 `、`는 전각이다.
중국어 간체는 `vendor/i18n/zh-Hans/glossary.json`의 `style.common`을 따른다.

- 사이트 문구는 가이드를 포함해 Codex가 쓴다. Claude는 문구를 직접 쓰지 않고, Codex가 쓴 문구를 사실과 이 규칙에 대조한다. 어긋나면 Codex에게 다시 쓰게 한다(사용자 결정).
- 사이트 화면의 문구는 `src/lib/i18n/<언어>.mjs`의 사전에서 관리한다. 랜딩과 앱 예시는 `landing`, 검색·공유 소개는 `meta`, 공통 안내와 푸터는 `chrome`, 사이드바 묶음은 `sections`, 개인정보 안내는 `privacy`, 그림 라벨은 `diagrams`다. 모든 언어의 값을 함께 고친다.
- 사용자 가이드는 `content/`와 모든 번역 폴더를 같은 의미로 수정한다.
  명령어, 설정 키, 실제 메뉴 이름과 주의사항은 의미를 유지한다. 번역을 수정한 뒤 스탬프를 갱신한다.
- 제목을 바꿀 때 기존 앵커를 별칭으로 남겨 저장된 링크도 계속 열리게 한다.
- 디자인 소개와 메타 설명은 사전의 `designHome`에서 `intro`와 `description`으로 나누어 관리한다.
  두 값은 뜻을 같게 쓰고, `description`은 평문으로 쓴다. 갤러리 도입부는 `src/lib/design.ts`의
  `GALLERY_INTROS`에서 관리한다. 갤러리 본문 소개와 메타 설명은 같은 값을 사용한다.
  토큰 페이지의 제목과 소개는 `vendor/gallery/tokens/index.jsx`의 `page.head`, 메타 설명은 `TokenSystem.astro`의 `DESCRIPTION`이다.
  디자인 킷의 예시와 명세는 vendor 원본을 사용한다.

## 용어와 문체

- 주 독자는 여러 터미널과 로그·문서를 함께 쓰는 개발자다. 에이전트 설치를 모든 독자의 전제로 삼지 않는다. 처음 방문한 사람은 제품 파악 → 설치 파일 선택 → 첫 화면 이해 → 작업 배치 구성으로 안내하고, 사용 중인 사람은 목적별 안내와 정확한 조작 참조로 연결한다. CLI 자동화·원격 사용자는 필요한 가이드로 바로 들어갈 수 있게 하고, 디자인 기여자는 별도 디자인 구역으로 안내한다. AI 에이전트를 함께 쓰는 개발자도 중요한 독자다. 처음 방문한 뒤의 독자는 터미널 조작, 맞춤 설정, 자동화, 원격 연결, 문제 해결로 갈라진다. 방문 수·전환율 목표는 측정 근거 없이 수치로 제시하지 않는다.
- 한국어 설명은 합니다체, 필요한 조작 안내는 하세요체로 쓴다. 매 문단을 권유로 시작하지 않으며, 영어도 기능과 조건을 먼저 설명한다.
- 화면 계층은 윈도우(Window) → 워크스페이스(Workspace) → 페인(Pane) → 탭(Tab) → 서피스(Surface)로 구분한다. 윈도우는 OS 윈도우, 워크스페이스는 프로젝트 단위, 페인은 독립 탭 바를 가진 영역, 탭은 함께 전환되는 서피스의 묶음, 서피스는 터미널·문서가 표시되는 단위다.
- ‘작업 공간’은 설명용 보통말로만 쓰고, 실제 객체·메뉴는 ‘워크스페이스’로 쓴다. 페인과 서피스를 모두 터미널 분할로 뭉뚱그리지 않는다.
- ‘전체화면 무대’와 UI 배율 Zoom을 구분한다. 전체화면을 터미널 페인 확대 기능으로 소개하지 않는다.
- 배치 복원, 닫은 항목 복원, 프리셋 적용, 에이전트 세션 재개를 구분한다. 재시작 뒤 실행 중이던 모든 프로세스가 그대로 살아난다고 쓰지 않는다.
- 알림 패널, 서피스 강조, 부모 대화로 결과 전달을 구분한다. 응답 종료·idle·작업 성공을 같은 뜻으로 쓰지 않는다.
- 제품명은 Tasty, 명령은 `tasty`, 연동 대상은 Claude Code·Codex CLI로 쓴다. 웹사이트 언어는 한국어·영어, 앱 내장 언어는 영어·한국어·일본어로 구분한다.
- 메뉴 이름은 앱의 실제 메뉴 이름을 기준으로 쓴다. 한국어 가이드의 첫 등장에는 영어 라벨을 HTML 주석으로 붙인다. 언어별 문구는 각 언어의 페이지에 나누어 싣는다.
- 원칙의 지향점이나 향후 구상을 현재 구현의 보장으로 옮기지 않는다. 플러그인 인증처럼 아직 제공하지 않는 제도를 현재 기능으로 홍보하지 않는다.

## FE 골격

앱 UI 를 그림이나 아스키 아트가 아니라 **디자인 시스템의 실제 컴포넌트**로 보여주는 것이
목적이다 — 랜딩의 제품 창도, 가이드의 UI 설명도, 디자인 섹션도 전부
[`vendor/`](../../vendor/README.md) 의 킷에서 온다.

```
./
  package.json          astro · @astrojs/react · react 18
  astro.config.mjs      정적 출력, React 아일랜드
  vendor/               Tasty UI 디자인 정본. 사이트가 그대로 import한다
  public/fonts/         D2Coding 원본 글꼴과 OFL 전문. 빌드가 그대로 복사한다 (아래 "D2Coding 글꼴 파일")
  scripts/              check-links · check-sitemap · check-translations · check-contrast · check-icons · check-tokens-copy · stamp · design-tokens/
  src/pages/            라우트
  src/components/ src/layouts/ src/lib/ src/styles/
```

정본의 컴포넌트와 표본은 ES 모듈이다. 사이트는 변환 단계 없이 `vendor/`를 Astro 프로젝트 안에서 직접 import한다. 정본은 `vendor/` 하나이고 생성 트리는 없다.

토큰과 정적 파일은 빌드할 때 `vendor/`에서 파생한다.

| 산출물 | 만드는 곳 |
|------|------|
| 페이지 토큰 | `src/styles/tokens.css`. tier 순서로 `vendor/` 토큰을 `@import`한다 |
| `/design/kit.css` | `src/lib/vendor-assets.ts`와 이를 읽는 엔드포인트 |
| `/tasty-melon.svg` · `/tasty-icon.png` | `assets/icons/`의 `tasty-melon.svg` · `icon_256.png`(Tasty 레포의 로고·앱 아이콘과 같은 파일)를 읽는 엔드포인트 `src/pages/tasty-melon.svg.ts` · `tasty-icon.png.ts` |
| `/tasty-share-en.png` · `/tasty-share-ko.png` | `vendor/share/`의 `tasty-share-en.png` · `tasty-share-ko.png`를 읽는 엔드포인트 `src/pages/tasty-share-en.png.ts` · `tasty-share-ko.png.ts` |
| `/robots.txt` · `/sitemap.xml` | 엔드포인트 `src/pages/robots.txt.ts` · `sitemap.xml.ts`. 주소는 `src/lib/site.ts`의 `absolute()`로 만든다 |

### 갤러리 페이지

갤러리는 앱이 따르는 정본이다. 페이지 규칙은 `vendor/gallery/README.md`에 있고 사이트 구현은 다음과 같다.

- `src/layouts/Design.astro`: 안내·토큰·갤러리가 함께 쓰는 레이아웃이다. 공용 머리글·테마·푸터(`Base.astro`), 메뉴, 머리 부분(제목과 소개), 이전·다음을 그린다. 페이지 순서와 묶음은 `src/lib/design.ts`의 `DESIGN_GROUPS`가 정한다.
- `src/components/design/SpecimenPage.astro`: 토큰과 갤러리 페이지의 래퍼다. `[data-gallery-page]`를 두르고 `specimen.css`와 `design/kit.css`를 싣는다. 레이아웃에 두지 않는 이유는 표본을 보여 주는 페이지만 이 스타일시트를 쓰기 때문이다.
- `src/pages/[...locale]/design/gallery/*/index.astro`: 라우트마다 `vendor/gallery/<페이지>/index.jsx`의 `page`와 기본 내보내기를 싣는다. `client:load`는 컴파일할 때 import를 찾아야 하므로 15개를 파일 하나로 합치지 않는다.
- 언어 경로: `getStaticPaths`는 `src/lib/design.ts`의 `localePaths`이고 `src/lib/langs.mjs`의 목록에서 만든다. 언어별 파일을 복제하지 않으며 표본은 같은 소스를 쓴다.
- `lang`: 헤더와 푸터는 페이지 언어다. 메뉴와 이전·다음은 `lang="en"`이다. `main`은 안내 페이지에서는 표시하지 않고 토큰과 갤러리에서는 `lang="en"`이다. 레이아웃은 언어 코드를 비교하지 않고 페이지 자료의 `translated`를 읽는다. `<title>`과 메타 설명은 머리에 있어 `lang`을 표시할 수 없다.
- 표본 안의 페이지 사이 링크는 상대 경로(`../plugins/#html`)로 쓴다. 어느 언어 경로에서든 같은 언어의 페이지로 가고 표본에 언어 개념이 들어가지 않는다. `npm run check-links`가 디자인 페이지에서 다른 언어의 디자인 페이지로 나가는 링크를 실패로 처리한다. 예외는 언어 전환(`a[data-lang]`)이다.
- 표본의 범위는 `[data-gallery-page]`다. 사이트 전역 규칙 중 표본과 부딪히는 것(`img`, `:focus-visible`)은 이 범위를 뺀다.
- `parts/specimen.jsx`의 `Spec`이 제목, 데모, 상태 격자, 숨은 상태의 프레임, 명세 표 순서로 그린다. `?audit=1`을 붙이면 지연 마운트 없이 모든 데모를 그린다.

### 사이트 페이지의 바탕과 잉크

사이트 스타일은 1단계 색을 직접 읽지 않고 앱과 같은 역할 토큰을 읽는다. 위치마다 쓸 토큰은 `vendor/tokens/ground-ink-rules.json`의 `site.places`가 정한다. 1단계 색을 읽으면 Mocha에서 통과한 값이 Latte에서 미달할 수 있기 때문이다.

- 브랜드: 표식은 `brand-melon-*` 색을 유지한다. 브랜드 색 글자와 글리프는 `brand-ink`를 읽는다. 워드마크 점은 글자가 아니라 표식이므로 `data-audit-exempt="brand"`를 붙인다.
- 주요 버튼: 바탕은 두 테마 모두 표식의 과육(`site-cta-bg`), 글자는 씨앗(`site-cta-fg`)이다. 포인터 올림과 누름도 과육의 색조다. 가이드 그림 라벨(`.anat::after`)도 같은 짝이다.
- 링크: `accent-primary-raised`다. 본문 안 링크는 평소에도 밑줄을 긋는다. Latte에서 이 잉크는 밝기만으로 본문과 구분하기 어렵다. 메모 안 링크는 본문 잉크에 밑줄이다. 틴트 위에 두 번째 색상을 쓰지 않기 위해서다.
- 머리글: 불투명한 `bg-sidebar`다. 뒤로 지나가는 내용이 잉크에 영향을 주지 않는다.
- 포커스 링: 앱과 같은 `border-focus`다.
- 건너뛰기 링크: 키보드 포커스를 받을 때만 머리글 위 왼쪽 위에 나타난다. 자기 `bg-panel` 칠과 1px 테두리에 링크 잉크를 쓰고 포커스 링이 그 둘레를 두른다.
- 인라인 코드: 칩 바탕은 `site-inline-code-bg`, 테두리는 1px `border-default`다. Latte에서 `raised`는 본문에서 지나치게 튀어 `mantle`로 내린다.
- 번역 안내: `.note`는 경고 틴트(번역이 뒤처졌을 때), `.note--untranslated`는 주 색 틴트(디자인 첫 페이지의 영어 전용 안내)다. 앞머리 낱말과 색 테두리는 없다.
- 표: 가이드의 Markdown 표는 렌더링 단계(`src/lib/satteri-table-wrap.mjs`)에서 `.table-wrap`으로 감싼다. 1px 테두리와 `mantle` 머리 행을 그리고 좁은 화면에서는 안쪽에서 가로 스크롤한다.
- 구분자: 이동 경로의 `/`는 장식이다. `aria-hidden`과 `data-ink-grade="none" data-ink-why="ornament"`를 붙이고 `glyph-dim`을 쓴다.
- 코드 블록: 두 테마에서 같은 어두운 팔레트(`site-code-*`)다. 하이라이터가 색을 인라인으로 쓰므로 `global.css`의 `pre.astro-code` 규칙이 `!important`로 바탕, 기본 잉크, 주석 색을 덮는다. 주석은 `style` 속성의 `#6A737D`로 찾으므로 하이라이터 테마를 바꾸면 이 선택자도 함께 고친다. 다른 하이라이터 잉크는 예외 없이 일반 기준으로 잰다.
- 앱 그림: 페이지가 직접 그리는 터미널과 창 그림은 프로그램 출력이 아니므로 `ansi-content` 예외를 쓰지 않는다. 선은 `term`과 `base` 바탕의 글자 셀을 읽는다. `AppShell.jsx`와 `WindowAnatomy.jsx`는 킷 `work.jsx`의 `C`와 같은 잉크를 쓴다.

가이드의 그림은 Markdown 렌더링 단계에서 킷을 정적 HTML로 그려 콘텐츠 캐시(`node_modules/.astro/data-store.json`)에 들어간다. Astro는 이 캐시를 본문과 설정의 해시로만 판단해 킷이 바뀌어도 다시 그리지 않으므로, `npm run build`는 `astro build --force`로 캐시를 비운다. 개발 서버에서 킷을 고친 뒤 가이드 그림이 그대로면 `astro dev --force`로 시작한다.

### 렌더링 대비 검사

`npm run check-contrast`는 빌드 결과를 띄워 갤러리 페이지와 사이트 페이지를 Mocha와 Latte로 렌더링한다. `--site-only`와 `--gallery-only`로 한쪽만 실행하고, `--page <키>`는 갤러리 한 페이지만 잰다. 코드는 `scripts/check-contrast.mjs`(갤러리), `contrast-site.mjs`(사이트), `contrast-page.mjs`(페이지 안에서 실행하는 측정)에 있다.

갤러리 페이지와 토큰 페이지(`design/tokens/`)에서는 다음을 잰다. 토큰 페이지는 갤러리 수에 넣지 않고 `SPECIMEN_ROUTES`로 더한다. 기본 언어 경로에서 한 번만 잰다. 다른 언어 경로의 표본은 같은 소스라 다시 재지 않는다.

- 고정 셀: `vendor/tokens/ground-ink-rules.json`의 행마다 부품의 잉크가 지정 토큰인지(채널당 1/255 허용), 합성 바탕에서 등급을 넘는지 본다. 행에 셀이 없거나 부품을 찾지 못해도 실패한다. 부품 위치는 `vendor/gallery/parts/part-map.js`에 있다.
- 나머지 글자·글리프·입력: 글자는 4.5, 글리프는 3을 기준으로 잰다. `data-audit-exempt`와 `data-ink-grade`의 규칙은 `vendor/RULES.md` 14절을 따르고, 쓰인 예외 id와 횟수를 출력한다. 완전히 투명한 요소만 화면에 없는 것으로 보며 그 밖의 opacity는 합성해 잰다.
- SVG: 보이는 도형의 stroke와 fill을 각각 재고 도형 수를 출력한다. 도형 자신의 `stroke-opacity`·`fill-opacity`와 SVG 안 `<g>`를 포함한 모든 조상의 opacity를 곱한다. SVG 안 `<text>`는 fill을 글자 기준으로 잰다. 아무것도 칠하지 않는 SVG의 수도 출력한다. 바탕은 DOM 조상에서 읽으므로 같은 SVG 안에서 도형 아래 깔린 다른 도형은 바탕으로 보지 않는다. `<use>`의 대상 내부와 그라데이션·패턴 칠은 재지 않으며 그라데이션·패턴 칠의 수를 출력한다.
- 비활성 조상(`:disabled`, `aria-disabled="true"`, `data-ink-why="disabled"`) 안: 등급 없는 비활성 토큰만 등급을 면제한다. 그 밖의 잉크는 일반 기준으로 잰다.
- 측정 0건, 알 수 없는 예외 id, 페이지 오류도 실패다.
- 표본 밖의 머리글·사이드바·푸터도 같은 기준으로 잰다.

사이트 페이지는 기본 언어의 갤러리 밖에 있는 빌드된 페이지 전부(랜딩, 가이드, 디자인, privacy, 모든 언어)다. 다른 언어의 `design/gallery/*`도 여기에 들어가며, 사이트 패스는 `[data-gallery-page]` 안을 재지 않으므로 그 페이지에서는 표본을 뺀 공통 부분만 잰다. 기본 언어가 아닌 언어마다 갤러리 페이지 수가 맞지 않거나, 표본 페이지에 `[data-gallery-page]`가 정확히 1개가 아니면 실패한다. 언어 하나당 15페이지 × 2폭 × 2테마가 는다. 기준은 `vendor/tokens/ground-ink-rules.json`의 `site.places`이고 `vendor/RULES.md` 15절이 같은 내용을 설명한다.

- 패스: 각 페이지를 넓은 화면(1440px)과 좁은 화면(390px)에서 잰다. 넓은 화면에서는 랜딩 창의 나머지 탭, 포인터 올림과 누름, 키보드 포커스, 검색 결과도 잰다.
- 행: 선택자가 어느 페이지에서도 요소를 찾지 못하면 실패한다. 요소를 하나도 재지 못해도, 등급에 못 미쳐도, 어떤 행도 지정하지 않은 잉크를 보여도 실패한다.
- 여러 잉크를 묶는 행: 한 선택자를 여러 행이 나눠 쓰거나 `a`처럼 범위가 넓거나 `.shell`처럼 창 그림 전체를 가리키는 행이다. 해당 잉크가 한 번 이상 나타나면 되고, 요소마다 등급은 그대로 잰다.
- 행이 없는 것: 보이는 글자, 생성 내용(`::before`, `::after`), 입력값, placeholder는 4.5로 잰다. 24px 이상 또는 18.66px 이상 굵은 글자는 3이다. SVG 도형은 3이다.
- 바탕: 불투명한 칠까지 조상을 합성한다. 그라데이션은 색 지점마다 재서 가장 낮은 값을 쓰고, 그림 바탕 위 글자는 값을 잴 수 없어 실패한다. 재는 값은 바탕의 실제 값이며 행의 `grounds`와 대조하지는 않는다.
- 예외: 규칙 파일의 `exceptions` id를 쓴 `data-audit-exempt`와 `data-ink-grade="none"`만 인정한다. 쓰인 횟수를 출력한다.
- 고정 마크업: 릴리스 버전, 번역 상태, 가이드 본문에 따라 달라 빌드 결과에 없는 행(메모, 작은 제목, 링크 속 코드, 인용 속 링크, 버전 칩)은 `contrast-site.mjs`의 `FIXTURES`로 넣어 재고, 출력에 행 이름을 적는다. 규칙이 깨지면 다른 잉크가 나와 실패한다. 실제 페이지에 그 요소가 있다는 뜻은 아니다.
- 재지 않는 것: 데모의 오버레이(설정 창, 명령 팔레트 등)는 갤러리에서 잰다. 포인터 패스는 행마다 첫 요소 하나만 잰다.

측정은 시간이 아니라 조건을 기다린다. 스타일 변경은 transition의 프레임을 거쳐야 계산값에 나타난다. `global.css`의 reduced motion 규칙은 `transition-duration`만 0.01ms로 바꾸므로 기본값 `transition-property: all`과 합쳐져 모든 속성의 변경이 transition을 거친다. 그래서 탭 클릭, 포인터, 포커스, 검색 뒤의 모든 측정 전에 `contrast-page.mjs`의 `stylesSettled`가 끝이 있는 애니메이션이 모두 끝나기를 기다린다. 30초 안에 끝나지 않으면 실패한다. 고정 시간을 기다리면 부하가 걸렸을 때 옛 잉크를 읽고, `color-mix` 토큰의 진행 중 값은 `oklab()`이라 `parse`가 읽지 못해 그 요소나 바탕을 건너뛴다.

`--json` 보고서의 `passes`(사이트), `chromePasses`(갤러리 머리글 등), 테마별 `passes`(갤러리 페이지)에 패스별 측정 수가 있다. 같은 `dist`의 두 실행은 이 값이 같아야 한다.

브라우저는 `CHROMIUM_PATH`, Playwright 캐시의 Chromium, `/snap/bin/chromium` 순으로 찾는다. 의존성은 `playwright-core`뿐이라 `npm ci`는 브라우저를 받지 않는다. 로컬에서는 `npx playwright-core install chromium`으로 한 번 받는다. CI에서는 `design.yml`이 빌드 뒤 `npx playwright-core install --with-deps chromium`으로 `playwright-core`와 맞는 Chromium을 받아 이 검사를 실행한다.

### vendor 검사

`vendor/`는 Tasty UI 디자인의 정본이다. 디자인 변경은 디자이너 Claude 세션이
이 폴더를 고쳐 커밋한다. 절차와 규칙은 [`CLAUDE.md`](../../CLAUDE.md)의 "갤러리" 절과
[`vendor/README.md`](../../vendor/README.md)에 있고, 변경 기록은 커밋 이력이다. Tasty 본체가 이 레포의 어느 커밋을
따르는지는 [Tasty 레포](https://github.com/zilhak/tasty)가 기록한다.

`design.yml`이 `main` push와 pull request마다 다음을 검사한다.

- `npm run build`와 `npm run check-contrast`(위 "렌더링 대비 검사").
- 토큰 JSON: `scripts/design-tokens/gen_tokens_json.py`로 `vendor/tokens/tasty.tokens.json`을 다시 만들어 차이가 없는지,
  `scripts/design-tokens/verify_tokens_json.py`로 토큰 CSS와 대조한다. JSON은 손으로 고치지 않는다.
- `npm run check-tokens-copy`: `vendor/tokens.css`가 되풀이하는 1단계 값이 `vendor/tokens/primitives.css`와 같은지 본다.
- `npm run check-icons`: `vendor/icons/*.svg`와 `vendor/components/core/Icon.jsx`가 같은 글리프를 그리는지 원문으로 비교한다.

## 빌드

```bash
npm install          # 최초 1 회

npm run build        # astro build --force -> dist/
npm run dev          # 개발 서버
npm run preview      # 빌드 결과 확인
npm run check-links     # 빌드 결과의 내부 링크·앵커 검사
npm run check-sitemap   # 빌드 결과의 공개 페이지와 sitemap.xml 대조
npm run check-contrast  # 빌드 결과의 갤러리·사이트 페이지 렌더링 대비 검사
npm run check-icons     # vendor 아이콘 파일과 Icon 컴포넌트의 글리프 대조
npm run check-tokens-copy  # vendor/tokens.css의 1단계 값과 primitives.css 대조
npm run check-translations -- ja zh  # 번역 가이드와 한국어 원본의 구조 대조 (아래 "번역 구조 검사")

# 번역 파일에 원본 해시 스탬프 (아래 "번역 모델")
npm run stamp content/en/index.md
```

## URL 구조

| 경로 | 내용 |
|------|------|
| `/` | 영어 랜딩 |
| `/ko/` | 한국어 랜딩 |
| `/guide/**` | 영어 가이드. `content/en/**.md` 를 발행한다. 파일이 없으면 빌드가 실패한다 |
| `/ko/guide/**` | 한국어 가이드 (`content/**.md`, canonical) |
| `/privacy/` · `/ko/privacy/` | 개인정보 안내. 본문은 `src/components/Privacy.astro` 에 두 언어로 있고 푸터에서 연결한다 |
| `/design/` · `/ko/design/` | 디자인 구역 안내. 제목·소개·안내는 경로의 언어로 나오고, 디자인 가이드가 영어 전용이라는 안내(`.note--untranslated`)를 제목 아래에 둔다. 왼쪽 메뉴는 영어다 |
| `/design/tokens/` · `/ko/design/tokens/` | 3티어 토큰 표본(`vendor/gallery/tokens/`). `client:load` 없이 정적으로 그려 토큰 JSON을 브라우저로 보내지 않는다. 내용은 영어 고정이다. 기본 언어 경로만 색인하고 sitemap에 넣는다. 다른 언어 경로는 `noindex, follow`다 |
| `/design/gallery/**` · `/ko/design/gallery/**` | 레퍼런스 갤러리 15 페이지. 머리글, 푸터, 검색, 언어 전환은 경로의 언어이고 내용은 영어 고정이며 표본은 같은 소스다. 모든 언어 경로를 `noindex, follow`로 색인에서 빼고 sitemap에도 넣지 않는다 |
| `/fonts/D2Coding-ligature-Regular.ttf` · `/fonts/D2Coding-ligature-Bold.ttf` · `/fonts/D2Coding-OFL.txt` | D2Coding 원본 글꼴과 OFL 전문(`public/fonts/`). 페이지가 아니므로 sitemap에 넣지 않는다. 아래 "D2Coding 글꼴 파일" 참고 |
| `/robots.txt` | 전체 허용과 `Sitemap:` 줄. `Disallow`를 넣지 않는다. 막으면 크롤러가 갤러리의 `noindex`를 읽지 못한다 |
| `/sitemap.xml` | 랜딩, 가이드, privacy의 양 언어와 색인 대상인 디자인 페이지. 가이드와 디자인은 `buildPages`와 `DESIGN_PAGES`에서 만들어 페이지를 추가하면 자동으로 들어간다. 디자인 페이지는 `indexed` 값과 언어 목록으로 정해진다. 랜딩과 privacy는 `src/pages/sitemap.xml.ts`에 적는다. 갤러리는 넣지 않는다. `lastmod`, `changefreq`, `priority`는 정확한 값을 얻을 근거가 없어 넣지 않는다. `npm run check-sitemap`이 빌드된 HTML 중 `<head>`에 `noindex`가 없는 페이지(`404.html` 제외)를 공개 페이지로 보고 `<loc>`와 대조한다. 빠진 공개 페이지, 없는 페이지나 `noindex` 페이지를 가리키는 `<loc>`, 중복, 비어 있거나 없는 sitemap은 실패다 |
| `/search-index.json` (en) · `/search-index.ko.json` | 검색 인덱스. 페이지마다 제목·섹션과 본문 앞 600자를 싣는다(`src/lib/search.ts`). 코드 블록과 HTML 태그는 빼고, 인라인 코드는 글자로 남기며, 단어 안의 하이픈은 지워지지 않아 `task-await` 같은 명령 이름이 입력한 그대로 맞는다. 명령 이름으로 찾게 하려면 그 이름을 제목이나 첫 문단에 쓴다 |

### 배포 경로 (base)

사이트는 GitHub Pages의 커스텀 도메인 `https://tasty.zilhak.org/`의 **루트**에서 서빙한다. 도메인은
저장소의 Pages 설정에 지정하며, Actions로 배포하므로 `CNAME` 파일을 두지 않는다. 경로 접두사는
[`src/lib/base.mjs`](../../src/lib/base.mjs) **한 곳에만** 적고(현재 빈 문자열), 나머지는
전부 거기서 파생한다.

| 소비자 | 어떻게 받는가 |
|--------|---------------|
| 페이지·컴포넌트의 모든 내부 링크 | `astro.config.mjs` 의 `base` → `import.meta.env.BASE_URL` → `src/lib/site.ts` 의 `url()` |
| 개발 서버 | 같은 `base` — `astro dev` 도 그 경로 아래에 마운트한다. **로컬과 배포가 같은 값으로 돈다** |
| 마크다운 파이프라인의 다이어그램 | 직접 주입받는다. Astro 설정에서 로드돼 `BASE_URL` 이 닿지 않는 컨텍스트라 그 경계에서 한 번 적용한다 |
| `npm run check-links` | 직접 import 한다. 여기서 base 를 모르면 배포가 못 여는 링크를 통과시킨다 |
| 킷·갤러리 모듈 | `import.meta.env.BASE_URL` 을 읽는 `BASE` 상수를 파일 머리에 둔다 |

**어떤 경로도 두 번 적지 않는다.** 도메인 루트가 아닌 경로로 옮기면 `base.mjs` 의 값만 바꾼다.

기본 URL과 랜딩 `/`는 영어로 제공한다.
정본이 한국어인 것과는 별개다 — 작성은 한국어로, 노출 기본은 영어로.

랜딩 `/`는 첫 화면을 그리기 전에 언어를 판단한다(`src/pages/index.astro`).
헤더의 EN/KO로 고른 값(`localStorage`의 `tasty-lang`)이 있으면 그 값을, 없으면 `navigator.language`를 따르며
`ko`로 시작하면 `/ko/`로 이동한다. 다른 페이지는 이동하지 않아 공유한 링크가 그 언어로 열린다. JS가 꺼져 있으면
영어 랜딩이 그대로 보인다. 페이지마다 `Base.astro`가 자기 주소를 `canonical`과 `og:url`로 알리고, 언어가 나뉜 페이지는
언어별 주소를 `hreflang`과 `og:locale:alternate`로 함께 알린다. 호출하는 쪽은 언어 코드별 경로 맵 `hrefs`를 넘기고, 언어 전환은 언어 목록 순서대로 맵에 있는 언어를 보여 준다. 번역되지 않은 디자인 페이지(토큰, 갤러리)는 내용이 같은 영어라 다른 언어판이 없으므로
`announceLanguages={false}`로 `hreflang`과 `og:locale:alternate`를 내지 않고, 언어 전환은 그대로 보여 준다. `x-default`는 기본 언어의 경로다. 절대 주소는 `src/lib/site.ts`의 `absolute()`가 `src/lib/base.mjs`의 `SITE`로 만든다.
언어 목록은 `src/lib/langs.mjs`에 있다. 언어마다 코드, 경로 접두어, 언어 전환 표시 글자, `og:locale` 값, 랜딩·가이드·개인정보 경로, 검색 색인 파일, 공유 이미지 경로를 한 행에 적고, 기본 언어를 `DEFAULT_LANG`으로 내보낸다. 행에는 번역 폴더 `contentDir`도 있다. 한국어 정본은 `null`이다. 코드에서 언어 코드를 비교하지 않고 행의 값을 읽으며, 주소와 언어 코드가 다를 수 있으므로 `code`로 경로를 만들지 않는다(`code`는 `hreflang`과 `<html lang>`에 나간다). `CANONICAL_LANG`은 정본 언어이고, 모든 언어에 있는 페이지의 `hrefs`는 `hrefsFor`로 목록에서 만든다. `hrefs`에 페이지 언어가 없으면 `Base.astro`가 언어 코드를 담아 실패한다.

### 언어 목록과 사전

문구는 `src/lib/i18n/<언어>.mjs`에 언어당 파일 하나로 둔다. `src/lib/i18n/index.mjs`에 사전을 등록하고, `dictionaryFor`로 읽는다. `stringsFor`와 `copyFor`도 이 사전을 읽는다. 외부 번역 라이브러리는 쓰지 않는다. 사전은 Markdown 처리기(Vite 밖)와 스크립트에서도 읽도록 `.mjs`로 둔다.

`index.mjs`를 import하면 `src/lib/i18n/check.mjs`가 사전을 영어와 대조한다. `npm run build`는 타입을 검사하지 않으므로 타입이 아니라 실행 시 검사로 실패시킨다. 메시지에는 언어 코드와 키 경로가 들어간다.

- 빌드 실패: 빠진 키, 남는 키, 값의 종류 차이, 배열 길이 차이, 자리 표시(`{os}`, `{issues}`) 차이, 빈 값, `chrome.lang`과 언어 코드의 차이, 사전이 없는 언어 행.
- 빈 값 예외: 어순 때문에 빌 수 있는 `landing.titleLead`, `landing.titleAccent`, `landing.titleTail`.
- 언어 행이 아직 없는 사전도 등록하면 대조한다. 번역을 끝낸 뒤 행을 더할 수 있다.
- 없는 언어를 다른 언어로 대체하지 않는다. `langRow`, `dictionaryFor`는 예외를 던진다.
- 사전에 넣지 않는 곳: 영어로 고정한 `src/lib/design.ts`의 `GALLERY_INTROS`, `DESIGN_GROUPS`, `TokenSystem.astro`, `vendor/gallery/`.
- `AppShell`은 `client:visible` 섬이다. 섬에서 사전을 import하면 모든 언어 문구가 브라우저로 가므로 현재 언어의 값(`landing.shellDoc`)만 props로 넘긴다.
- `privacy`의 본문 값은 HTML로 출력한다.

Astro 내장 i18n은 쓰지 않는다. 7.3.1에서 확인한 결과 `i18n` 설정은 페이지를 만들어 주지 않고(경로는 어차피 `getStaticPaths`가 만든다), `Astro.preferredLocale`은 정적 빌드에서 `undefined`이며, `astro:i18n`은 `scripts/`와 Markdown 처리기에서 읽지 못해 언어 목록이 둘이 된다. `fallback`은 번역이 빠져도 빌드를 통과시켜 위 규칙과 반대다.
`Base.astro`는 언어 행의 `shareImage`로 1200×630 공유 이미지의 절대 주소를 `og:image`로 내고 크기를 `og:image:width`와 `og:image:height`로 함께 알린다. `twitter:card`는 `summary_large_image`다. 새 언어의 이미지가 생기기 전에는 행에 있는 이미지를 가리키게 한다.
네이버 Search Advisor의 사이트 소유 확인 태그(`naver-site-verification`)는 `src/pages/index.astro`의 `head` 슬롯에 있어 `/`에만 나간다.

## 방문자 분석

방문 통계는 Cloudflare Web Analytics로 수집한다. `tasty.zilhak.org`는 프록시를 거치지 않는 DNS 전용
레코드라 자동 삽입이 동작하지 않으므로, 비콘 스크립트를 페이지에 직접 넣는다.

- 스크립트와 사이트 토큰은 `src/components/Analytics.astro` 한 곳에 둔다. 토큰은 발행된 모든
  페이지에 노출되는 공개 값이다.
- `<head>`를 가진 `Base.astro`가 이 컴포넌트를 싣는다. `Design.astro`, `Guide.astro`는 `Base.astro`를 통해 함께 포함된다.
- production 빌드에만 포함되어 `astro dev` 방문은 집계되지 않는다.
- 수집 항목이나 처리 주체가 바뀌면 개인정보 안내(`src/components/Privacy.astro`)의 두 언어 본문과 최종 수정일을 함께 고친다. 앱에 외부 전송 기능을 추가할 때도 안내의 앱 항목을 확인한다.
- 통계는 Cloudflare 대시보드의 Web Analytics에서 본다. 저장소 Insights의 Traffic은 Pages 방문을 집계하지 않는다.

## 콘텐츠 구조

`content/` 의 디렉토리가 사이드바 섹션이고, 페이지 순서는 `src/lib/guide.ts` 의 `ORDER` 가
정한다. 파일 이름 순이 아니다 — 읽을 순서를 배열로 명시한다.

```
content/
  index.md                      가이드 홈
  getting-started/  install · first-look
  using/            workspaces · workflow-layouts · panes-tabs-splits · terminal · files
  customize/        keybindings · settings · themes · scripts
  agents/           cli · background-tasks · claude-codex · tasks · hooks-notifications
  remote/           attach
  plugins/          index
  help/             troubleshooting
  en/               위 트리의 1:1 미러 (번역). 번역 폴더마다 같다
```

- 새 페이지를 추가하면 `ORDER` 에도 넣는다. 빠뜨리면 발행되지 않는다.
- CLI 입문(`agents/cli.md`)·명령 참조(`agents/cli-reference.md`)·진단(`help/cli-diagnostics.md`) 페이지의 `sh` 코드 블록에 있는 `tasty …` 예시는 이 레포의 `checks/tests/guide_examples_parse.rs`가 Tasty 소스(`.tasty-src`)의 실제 명령 트리로 파싱한다(한국어 원본과 `TRANSLATION_DIRS`의 번역 폴더, `checks.yml`). 명령 경로·필수 인자·옵션 이름만 확인하며 plugin 명령, 자리 표시(`<ID>`·`…`), 셸 치환·파이프가 있는 줄은 판정하지 않는다. 문장의 정확성과 실행 결과는 이 검사가 보장하지 않는다.
- 새 디렉토리(섹션)를 만들면 `SECTIONS` 에 디렉토리를, 모든 사전의 `sections` 에 라벨을 추가한다.
  등록되지 않은 디렉토리에 페이지를 두면 빌드가 실패한다.
- 페이지 첫 줄 `# 제목` 이 사이드바 라벨이다 (괄호 · 대시 이후는 잘린다. 전각 괄호 `（`와 전각 대시 `——`, `―`, `－`도 같다).
- `# 제목` 바로 아래 문단의 첫 문장이 그 페이지의 검색 · 공유 설명(`description`, `og:description`)이다(`src/lib/guide.ts`의 `descriptionOf`). 문장 끝은 `.`, `!`, `?` 뒤의 공백이나 전각 `。`, `！`, `？`다. 첫 문장은 페이지를 혼자서 설명하게 쓴다.

### 집필 규칙

독자는 **설치해서 쓰는 사람**이다. 다음은 가이드에 넣지 않는다: 소스 경로 · ADR · IPC 메서드
이름(CLI 명령으로 대신) · 내부 타입명 · Status/주체 같은 명세 머리 항목 · 수용 기준 · 구현 히스토리 ·
개발 문서(이 레포와 Tasty 레포의 `docs/`)로의 링크. 메뉴 · 버튼 · 설정 항목은 Tasty 레포 `lang/ko.toml` 의 실제 라벨을 쓰고, 처음 등장할 때 영어
라벨을 HTML 주석으로 붙인다(`**설정** <!-- en: Settings -->`) — 번역이 그대로 쓴다.
확인 못 한 사실은 쓰지 말고 `<!-- TODO verify: … -->` 로 남긴다.

**문체는 합니다체다** — 마이크로소프트 한국어 스타일 가이드를 따른다. 사이트에 나가는 한국어는
가이드 본문도 랜딩 문구도 UI 문자열도 전부 `합니다` / `합니다체` 로 끝맺고, 사용자에게 시키는
문장은 `하십시오` 가 아니라 `하세요` 로 쓴다. 명사에 `수행` · `실행` · `제공` 을 붙이는 번역투는
동사로 푼다(`개요를 제공합니다` → `설명합니다`). 표 셀이나 목록의 명사구 조각은 그대로 둔다 —
종결어미가 있는 완전한 문장에만 해당한다. 이 레포의 `docs/`(개발 문서와 기획서)는 이 규칙 밖이며 한다체로
쓴다(독자가 다르다).

## 번역 모델

한국어(`content/`)가 canonical 이고 나머지 언어는 번역이다. 번역 폴더는 언어 행의 `contentDir`이 정한다(`content/en/`).

- **경로 1:1** — `content/<번역 폴더>/<rel>` 이 `content/<rel>` 을 그대로 미러한다.
- **빠진 번역** — 언어 행의 `contentDir` 폴더에 번역 파일이 없으면 빌드가 언어와 파일 경로를 담아 실패한다.
  한국어 본문으로 대체하지 않는다. 오래된 번역(아래 스탬프)은 실패가 아니라 안내만 낸다. 실패로 만들면 한국어 가이드를 고칠 때마다 빌드가 막히기 때문이다.
- **스탬프** — 번역 파일 첫 줄에 원본의 내용 해시를 박는다:

  ```
  <!-- source-hash: 90acc4edaa45 -->
  # Tasty guide
  ```

  원본이 바뀌어 해시가 달라지면 그 페이지에 "원문보다 오래됐습니다" 배너가 뜬다.
  스탬프가 없는 번역은 stale 로 본다.
- **링크 경로는 원본과 동일하게, 앵커는 그 언어 제목의 slug 로 쓴다.** 번역 페이지의 상대 링크는
  같은 트리 안에서 원본과 같은 모양으로 해석되므로 파일 경로는 그대로 둔다. 반면 `#앵커` 는 제목 텍스트에서
  만들어지므로 번역된 페이지의 앵커는 그 언어의 slug 다(`install.md#설치-위치` → `install.md#install-locations`).
  `npm run check-links` 가 언어별 산출 트리에서 모든 `#앵커` 의 존재를 검사해 없으면 깨진
  링크로 집계한다.
- **고아 번역** — 대응하는 한국어 원본이 없는 번역 파일은 발행되지 않는다(빌드는 경고 없이 뺀다 — 빌드는 `ORDER` 만 돈다). `npm run check-translations` 는 이를 실패로 낸다.
- **행이 없는 번역 폴더** — 번역 파일은 언어 행보다 먼저 들어온다. 행이 없는 폴더는 발행되지 않는다(`buildPages`와 경로는 행만 읽는다). 글로브 로더는 이 파일도 렌더링하지만 결과를 쓰는 페이지가 없다. 폴더 안 상대 링크는 행이 없어도 같은 값이고, 그림 라벨은 행이 생기기 전까지 정본 언어로 그려진다. 언어 목록은 `langs.mjs` 하나뿐이고, 행이 없는 폴더는 도구의 명령줄에서 이름을 댄다.

### 번역 절차

```bash
# 1. 원본을 같은 상대경로에 번역해 쓴다 (링크 경로는 그대로, 앵커는 영어 slug)
$EDITOR content/en/using/terminal.md

# 2. 스탬프를 찍는다 (첫 줄에 삽입하거나, 이미 있으면 갱신)
npm run stamp content/en/using/terminal.md

# 언어 행이 아직 없는 폴더는 이름을 댄다. 이름을 대지 않은 폴더는 실패한다
npm run stamp -- --tree ja content/ja/using/terminal.md

# 3. 구조를 대조한다
npm run check-translations -- ja
```

`npm run stamp` 는 **번역을 실제로 손본 직후에만** 실행한다. 갱신 없이 스탬프만 찍으면 stale 표시만
사라지고 내용은 어긋난 채 남는다.

### 번역 구조 검사

`npm run check-translations`(`scripts/check-translations.mjs`)는 번역 폴더를 한국어 원본과 페이지별로 대조한다. 폴더를 인자로 받고 인자가 없으면 언어 행에서 읽는다. 문장의 뜻은 재지 못한다.

| 규칙 | 실패 조건 |
|---|---|
| `files` | 파일 집합이 `ORDER`와 다르다 |
| `headings` | 제목 수나 깊이의 순서가 다르다 |
| `fences` | 코드 펜스 수나 언어의 순서가 다르다 |
| `commands` | 코드 펜스 안의 `tasty ...` 줄이 다르다. `#` 뒤 주석은 뺀다. 원본에서 한글이 든 따옴표 값, `<자리 표시>`, 낱말은 예시 글이라 번역할 수 있다 |
| `links` | 링크 대상 경로(앵커 제외)의 묶음이 다르다. 순서는 보지 않는다 |
| `diagrams` | `tasty-diagram` 표식의 이름이나 순서가 다르다 |
| `labels` | `<!-- en: ... -->` 값의 집합이 다르다 |
| `stamp` | 스탬프가 없거나 원본 해시와 다르다 |
| `hangul` | 한글이 남아 있다. 앱 언어 이름 `한국어`와 앱의 한국어 표시 예시는 스크립트의 `ALLOWED_HANGUL`에 적어 뺀다 |
| `kana` | `zh` 폴더에 가나가 있다 |

`zh` 폴더에서 GB2312 밖의 한자는 번체 후보로 출력하며 실패가 아니다. 근사이므로 사람이 본다.

`--counts`는 규칙별 수만 내고 항상 0으로 끝난다. 영어 번역은 이 검사보다 먼저 쓰였고 범위 밖이라 `labels`가 어긋난다(라벨 주석을 싣지 않는다). 그래서 CI는 영어를 판정하지 않고 `ja`, `zh`만 판정한다. `--skip-missing`은 없는 폴더를 건너뛴다.

### 언어를 더할 때 고칠 곳

- `src/lib/i18n/`: 사전을 쓰고 `index.mjs`에 등록한다.
- `content/<폴더>/`: 번역 파일을 넣고 스탬프를 찍는다.
- `checks/src/lib.rs`의 `TRANSLATION_DIRS`: Rust는 `langs.mjs`를 실행하지 못해 폴더 이름을 여기 적는다. 새 폴더를 빠뜨리면 번역이 한국어 원본으로 읽혀 "이름이 가이드에 있는가" 검사가 약해진다. 언어 행의 `contentDir`이 여기 없으면 시험이 실패한다. 행 없이 들어온 폴더는 이 시험이 잡지 못하므로 파일을 넣기 전에 먼저 고친다.
- `checks/tests/guide_examples_parse.rs`의 `MAY_BE_ABSENT`: 번역이 들어오는 동안만 쓴다. 행을 더할 때 비운다.
- `.github/workflows/pages.yml`의 `check-translations` 줄: 폴더 이름과 `--skip-missing`.
- `src/lib/langs.mjs`: 번역 파일과 경로가 준비된 뒤 마지막에 행을 더한다.

**콘텐츠의 내부 링크는 상대경로로 쓴다.** hast 플러그인이 그것을 라우트로 바꾸고, 그 라우트는
`src/lib/site.ts` 의 `url()` 을 통해 설정된 base 를 반영한다.

## 문서 변환 규칙

원본 마크다운은 고치지 않는다. 변환은 전부 렌더 단계 — Astro 7 의 기본 마크다운 처리기인
Sätteri 의 hast 플러그인(`src/lib/satteri-*.mjs`)에서 일어난다.

| 원본 | 산출 |
|------|------|
| `content/` 안의 `*.md` 링크 | 대응하는 라우트 (파일 깊이가 아니라 **라우트 깊이** 기준의 상대경로) |
| 콘텐츠 트리를 벗어나는 링크 (`../../../CHANGELOG.md`) | GitHub blob URL |
| 존재하지 않는 대상 · 없는 `#앵커` | `npm run check-links` 가 집계한다 |
| `##` · `###` | 우측 목차 + 앵커. slug 는 GitHub 규칙(한글 보존) |
| 표 | 가로 스크롤 컨테이너로 감싼다 |
| 코드 펜스 | Shiki 가 하이라이팅한다 — 색은 토큰이 정한다 |
| `<!-- tasty-diagram: <이름> -->` + 다음 코드 블록 | 그 블록을 킷 컴포넌트로 그린 다이어그램으로 교체 |

## 테마

**사이트는 색을 정의하지 않는다.** 팔레트는 `vendor/tokens/` 에서 오고, 그것이
앱 UI 킷이 렌더하는 것과 같은 원본이다 ([`vendor/README.md`](../../vendor/README.md)).
`src/styles/tokens.css`가 tier 순서(`primitives` → `semantic` → `components` → `base`)로 `vendor/` 토큰을 import하고, 레이아웃이 사이트 스타일보다 **먼저** import 한다.

- 테마 이름은 앱의 것을 그대로 쓴다 — **mocha**(다크, 기본) · **latte**(라이트).
  latte 만 `data-theme="latte"` 를 달고, mocha 는 속성 없는 `:root` 다.
- 코드 하이라이팅도 같은 토큰(`--tasty-color-mauve` · `-green` · `-peach` …)을
  참조하므로 테마 토글에 함께 반응한다.
- 색은 모두 vendor 토큰을 쓴다. **치수(간격·크기·반경)는 출처에 따라 두 척도로 나뉜다.**
  vendor 스케일은 앱 chrome 용이라(14px UI 상한, 조밀한 4/8/12 간격) 웹 본문에 그대로 쓰면
  읽히지 않기 때문이다.

선택은 `localStorage` 에 남고(`tasty-theme`), 저장값이 없으면 `prefers-color-scheme` 을
따른다. 첫 페인트 전에 인라인 스크립트가 적용해 깜빡임이 없다. 옛 빌드가 저장한
`"light"` · `"dark"` 도 그대로 해석된다.

### 치수 척도의 두 출처

판정 단위는 파일이 아니라 **규칙(선택자 블록)** 이다. 한 파일에 두 출처가 섞이면 규칙마다
판정하고, 한 규칙 안에서 출처가 갈리는 선언이 있으면 그 선언만 따로 판정한다. 물음은 하나다 — *Design System 이 킷에서 이 값을 바꾸면 이 규칙도 따라 바뀌어야
하는가.* 그렇다면 Design System 출처, 아니면 사이트 독자다.

| 출처 | 대상 | 쓰는 척도 |
|------|------|-----------|
| Design System | `vendor/` 정본과 거기서 파생한 파일(`kit.css` · `tokens.css` · 갤러리). 사이트 스타일시트 안에서는 킷 컴포넌트가 그리는 앱 화면을 재현하거나 그 값을 그대로 옮기는 규칙 — 랜딩·가이드의 제품 창 chrome(`app-shell.css` 의 `.shell` · `.shell__*` · `.shell-overlays*`), 킷 창 크기를 옮긴 Settings 무대(`.anat-settings__stage`), 디자인 구역의 머리 부분(`design.css`의 `.design-head`, `.ds-group`의 글꼴과 제목) | Design System 토큰 `--tasty-*` 의 semantic 층(`--tasty-space-*`, `--tasty-radius*`, `--tasty-font-size-<역할>` …). 토큰 파일 머리말대로 primitive(`--tasty-size-N` 등)는 직접 읽지 않는다 |
| 사이트 독자 | 사이트가 스스로 디자인한 것 — 페이지 레이아웃, 헤더 · 사이드바 · 목차, 본문 타이포그래피(`global.css`), 랜딩 섹션과 제품 창을 감싸는 카드(`landing.css` 의 `.window` 포함), 디자인 구역의 페이지 배치(`design.css`), 가이드 그림의 영역 라벨(`.anat*`)과 배치(`.workflow-diagram*`) | 사이트 척도 — 간격 `--sp-1`(4px) ~ `--sp-24`(96px), 반경 `--radius-sm` · `--radius` · `--radius-lg`, 요소 크기 `--size-control-sm` · `-md` · `-lg`(32 · 36 · 44px)와 `--size-icon-sm` · `-md` · `-lg` · `-xl`(16 · 18 · 20 · 24px), 레이아웃 변수(`--header-h`, 여러 규칙이 함께 쓰는 폭 `--page-max` 1440px · `--landing-max` 1180px 등). `global.css` 의 `:root` 가 정의한다 |

- 선언 단위로 갈리는 경우 — 제품 창을 **페이지에 얼마나 크게 보일지**(`.shell` 의 높이
  `clamp(…, vw, …)`, 가이드 그림의 높이 · 너비)는 킷이 정하지 않는 페이지 배치라 Design System
  출처 규칙 안의 선언이어도 사이트 독자 값으로 본다(hero 높이 clamp, 그림 높이 420 · 400 · 620px, 그림 폭
  820px, 작업 흐름 패인 최소 높이 190px). 반대로 킷이 정한 창 크기를 옮긴 값은 Design System 출처다 —
  Settings 무대는 `--tasty-settings-window-width` · `-height`, 제품 창 토스트의 하단 거리는
  `--tasty-toast-stack-offset-bottom` 을 읽는다.
- 갤러리 표본의 스타일시트(`vendor/gallery/parts/specimen.css`)는 `--tasty-*`만 쓴다. 디자인 구역의 페이지 배치(`src/styles/design.css`)는 사이트 독자 규칙이다.
- primitive 직접 참조 금지는 Design System 출처 규칙의 **치수**에만 적용한다. 색 토큰을 어느 층에서
  읽는지는 이 절이 다루지 않는다.
- 요소 크기 척도는 용도로 나눈다. `--size-control-*` 는 컨트롤의 높이 · 너비다 — `sm` 은 헤더의
  아이콘 버튼 · 언어 전환 · 검색 입력과 검색 아이콘 칸(좁은 화면에서 접힌 검색 폭 포함), `md` 는
  랜딩 기능 카드 칩과 터미널 그림 제목 막대, `lg` 는 랜딩 CTA 버튼이다. `--size-icon-*` 는 글리프
  크기다 — `sm` 헤더 아이콘 버튼과 검색 돋보기, `md` CTA와 기능 카드 칩, `lg` 플랫폼 줄, `xl`
  브랜드 마크다.
- 척도에 넣지 않는 값은 숫자로 남기고 파일 머리 주석에 그 범주를 적는다 — 글꼴 크기, 선 굵기,
  pill 반경, 그림의 세부인 장식(eyebrow 점 7px · 창 점 10px · 사이드바 스크롤바 8px), 한 곳에서만
  쓰는 레이아웃 폭(검색 기본 폭 220px, 펼친 검색 190px, 검색 결과 `min(460px, 82vw)`, 좁은 화면
  사이드바 `min(320px, 86vw)`, 푸터 열 최소 140px). `--sp-*` 는 간격
  척도라 크기 값에 빌려 쓰지 않고, `--size-*` 를 간격에 빌려 쓰지도 않는다.
- 상대 단위(`em` · `rem` · `ch`)인지는 한 물음으로 가른다 — *사용자가 브라우저 글꼴 크기를 키웠을 때
  이 값이 그대로면 글자와 어긋나는가.* 글줄 안에서 글자에 붙은 값(인라인 코드의 안쪽 여백
  `0.15em 0.4em`)과 글줄 길이를 정하는 값(본문 폭 `62ch` · `42em` · `34ch`)은 어긋나므로 상대 단위로
  두고 파일 머리 주석에 그 범주를 적는다. 블록과 블록 사이 간격은 어긋나지 않는다 — 문단 · 목록의
  위아래 여백(`.prose p` 의 `--sp-4`)과 같은 축이라 사이트 척도를 쓴다. 그림의 위아래 여백
  (`.prose img` · `.anat-window` · `.anat-settings` · `.workflow-diagram`)과 그림과 캡션 사이 여백이
  여기에 든다.
- 고른 척도에 대응 값이 없으면 값이 우연히 같은 다른 토큰·변수를 부르지 않고 숫자로 둔 채
  "대응 값 없음" 주석을 단다 — 없는 관계가 생기기 때문이다. Design System 출처인데 토큰이 없으면
  값을 로컬에서 정하지 않고 디자인 요청으로 올린다. 사이트 독자 척도에 필요한 값이 없어도 변수를
  즉석에서 만들지 않는다.
- 미디어 쿼리와 컨테이너 쿼리의 **조건**은 숫자로 남긴다. media feature 는 custom property 를
  읽지 못한다(`@media (max-width: var(--x))` 는 파싱되지 않는다). 블록 안의 선언은 위 규칙을 따른다.

## D2Coding 글꼴 파일

`public/fonts/`에 Tasty 앱이 쓰는 D2Coding ligature 원본 TTF 두 개와 SIL Open Font License 1.1 전문을 둔다. 빌드는 이 폴더를 같은 이름으로 복사하므로 글꼴과 라이선스가 사이트의 `/fonts/`에 나란히 나간다. 아직 어떤 CSS도 이 파일을 가리키지 않아 렌더링에는 영향이 없다.

| 파일 | sha256 | 크기(byte) |
|---|---|---|
| `D2Coding-ligature-Regular.ttf` | `0890bd19cc222951f99fc4f29b46141c828c613719a8b16189eae3e21788c142` | 4224160 |
| `D2Coding-ligature-Bold.ttf` | `2d7d153b6bc29a7216e62070348e1240305c95263a78da2b5ef836cf5ce59343` | 4398252 |
| `D2Coding-OFL.txt` | `1807e8dec4d65f474cbf9be39f5e2254ecb81702babc320749e272ea66ffcc69` | 4511 |

- 글꼴의 출처와 판: [Tasty 레포](https://github.com/zilhak/tasty)의 `crates/tasty-font/assets/`에 있는 파일과 같다. upstream 릴리스 [VER1.3.2](https://github.com/naver/d2-coding-font/releases/tag/VER1.3.2)의 ZIP에 있는 `D2CodingLigature/` 파일과도 해시가 같다. 판은 글꼴의 name 5(`Version 1.3.2; Build 20180524`)와 해시로 대조한다. `head.fontRevision`은 1.002라 판 번호와 다르다.
- 라이선스의 출처: Tasty 레포의 `LICENSES/D2Coding-OFL.txt`와 같고, upstream 태그 `VER1.3.3`의 `OFL.txt`와도 같다. 태그 `VER1.3.2`와 그 릴리스 ZIP에는 라이선스 파일이 없다.
- 폴더: Vite가 처리하는 import는 이름에 해시가 붙어 라이선스 파일과 떨어진다. 엔드포인트는 파일마다 코드가 필요한데 바이트를 그대로 내보내는 일만 한다. `public/`은 처리 없이 복사하므로 이름과 바이트가 그대로 유지된다.
- 대조: 이 레포에서 `sha256sum public/fonts/*`를 실행하고, 빌드한 뒤 산출물의 `fonts` 폴더에도 실행해 위 표와 비교한다. 글꼴을 올릴 때는 Tasty 레포의 파일과도 비교한다.

**세 파일을 고치지 않는다.** OFL은 형식 변환과 구성 요소의 추가, 삭제, 교체를 Modified Version으로 정의하고, Modified Version은 Reserved Font Name인 `D2Coding`, `D2Coding-Bold`를 쓸 수 없다. 글꼴을 고치면 이름과 CSS 패밀리까지 바꿔야 한다.

- 서브셋을 만들지 않는다. [OFL FAQ](https://openfontlicense.org/ofl-faq/) 2.6은 글리프와 스마트 글꼴 코드를 빼는 것을 수정으로 본다.
- WOFF, WOFF2로 변환하지 않는다. FAQ 2.2.1의 조건을 맞추면 수정이 아니지만 바이트 해시로 대조할 수 없다. 필요해지면 사용자에게 올린다.
- 글꼴 메타데이터의 저작권 표기와 OFL 파일 머리의 저작권 줄이 달라도 어느 쪽도 맞춰 고치지 않고 함께 배포한다. 글꼴을 고치면 수정본이 되고, OFL 파일은 upstream 원문이다.
- 글꼴의 메타데이터에는 라이선스가 한 문장뿐이고 Reserved Font Name 문구가 없다. 그래서 OFL 파일을 빼면 안 된다.

## 언어별 글꼴과 줄바꿈

페이지 언어(`<html lang>`)가 일본어나 중국어일 때만 값이 달라진다. 영어와 한국어 경로의 계산값은 언어를 더하기 전과 같다. 규칙은 `src/styles/global.css`에 있다.

### 줄바꿈

`body`의 `word-break: keep-all`은 한국어를 위한 값이다. 일본어와 중국어에서는 문장 부호까지 줄을 바꾸지 않아 줄 길이가 들쭉날쭉해지고 줄 수가 늘어난다. 그래서 `:root:lang(ja)`, `:root:lang(zh)`의 `body`는 `normal`이다.

`:root`를 함께 쓰는 이유는 기준이 요소가 아니라 페이지 언어이기 때문이다. `:lang(ko)`로 옮기거나 `:lang(ja)`만 쓰면 영어 경로 표본 안의 `lang="ko"`, `lang="ja"` 요소의 줄바꿈이 달라진다.

### 영어 구역의 경계

`word-break`와 `font-family`는 상속된다. 일본어·중국어 경로의 메뉴, 이전·다음, 토큰과 갤러리의 `main`은 `lang="en"`이지만 그대로 두면 `body`의 값을 물려받아, 같은 소스여야 할 표본이 언어 경로마다 달라진다. 그래서 가장 바깥의 `[lang="en"]`에서 다른 경로와 같은 값으로 되돌린다. 이 선택자는 명시도가 0이라 값을 직접 정한 규칙이 항상 이긴다. 되돌리는 값은 `--font-sans`, `--font-mono`, `font-family`, `word-break`다. `--font-*-default`가 그 값을 담는다.

### 글꼴 대체

같은 한자도 언어마다 모양이 다르다. 글꼴 이름이 없으면 시스템 기본으로 떨어져 다른 언어의 글꼴로 그려질 수 있다. Windows에서는 `Malgun Gothic`이 먼저 잡힐 수 있다. 그래서 `:root:lang(ja)`, `:root:lang(zh)`가 `--font-cjk`에 그 언어의 시스템 글꼴 이름과 Linux 배포판의 Noto 이름을 적고, `--font-sans`와 `--font-mono`가 이를 읽는다.

- 순서는 토큰, `--font-cjk`, 한국어 이름, 일반 글꼴이다. 토큰이 앞이라 라틴 글자의 모양이 언어마다 달라지지 않고, 한국어 이름이 뒤라 한국어 글꼴이 일본어·중국어를 그리지 않는다.
- 이 대체를 위해 글꼴 파일을 배포하거나 외부 글꼴을 요청하지 않는다. 이름만 더한다.
- `--tasty-font-ui`는 루트에서 덮지 않는다. 커스텀 속성은 상속되어 표본까지 내려간다.
- 일본어와 중국어의 `--font-mono`는 `--tasty-font-family-mono-system`, `--font-cjk`, `monospace` 순서다. `--tasty-font-family-mono`를 그대로 쓰면 일반 글꼴 `monospace`가 `--font-cjk`보다 앞에 온다. `monospace`가 CJK 글자를 가진 글꼴로 풀리는 환경(Linux의 `Noto Sans Mono CJK JP`)에서는 코드 안의 한자가 중국어 경로에서도 일본어 모양으로 나온다.
- 이 값에는 D2Coding이 없다. 글꼴이 설치된 컴퓨터에서도 번역 문장 옆 코드의 가나와 한자가 D2Coding과 다른 글꼴로 섞이지 않게 하기 위해서다. 표본과 메뉴처럼 `lang="en"`인 구역은 경계에서 `--font-mono-default`로 돌아간다.

### 번역 문구를 그리는 고정폭 규칙

번역 문구를 그리는 고정폭 규칙은 일본어와 중국어에서 `--font-sans`를 읽는다. 앱의 `--tasty-font-label`([RULES](../../vendor/RULES.md) 8절)과 같은 규칙이다. 고정폭 글꼴에 없는 글자가 많아 한 낱말 안에서 글꼴이 섞이기 때문이다. 대상은 `.breadcrumb`, `.page-nav .dir`, `.search__results .r-crumb`다. 디자인 머리 부분인 `.design-head`, `.ds-group`도 `--tasty-font-ui`에 CJK 이름이 없어 같은 페이지의 본문과 글꼴 체인을 맞추려고 `--font-sans`를 읽는다.

선택자가 요소의 `:lang`이라 `lang="en"`인 곳에는 걸리지 않는다. 디자인 구역의 이전·다음과 토큰·갤러리의 머리 부분은 영어 고정이라 그대로다.

값을 담는 고정폭 규칙은 모든 언어에서 유지한다. `.brand__version`은 버전, `.code-block__lang`은 코드 언어 이름이다. `.lang-switch a`는 지금 언어 코드를 담고 있어 유지한다. 언어 행의 `label`을 `日本語`처럼 쓰면 이 규칙의 대상이 되므로 코드 형식(`JA`)을 쓴다. `.copy-btn`은 영어 고정이면 유지하고 번역하면 대상이 된다.

## 랜딩의 구조화 데이터

`/`와 `/ko/`의 `<head>`에 `src/lib/structured-data.ts`가 만든 JSON-LD를 넣는다. 다른 페이지에는 넣지 않는다.

- `SoftwareApplication`은 두 랜딩에 넣고 `WebSite`는 첫 페이지인 `/`에만 넣는다.
- 값은 실제 제품 사실만 적고 이미 있는 곳에서 읽는다. `description`은 `src/lib/i18n/` 사전의 `meta.description`, `downloadUrl`은 `RELEASES_URL`, `softwareVersion`은 `releaseVersion`, `sameAs`는 `REPO`, 주소는 `absolute()`다.
- `softwareVersion`은 공개된 최신 릴리스다. 개발 중인 버전을 쓰지 않는다. `release.json`이 없는 로컬 빌드에는 이 키가 없다.
- `inLanguage`는 앱 내장 언어(영어, 한국어, 일본어)다. 웹사이트 언어가 아니다.
- `offers`의 `price`는 내려받는 값이 0이라는 사실이고, `USD`는 금액을 나타내려고 형식상 필요한 통화 표시다. 요금제가 아니다.
- 평점과 리뷰(자료가 없다), `image`와 `screenshot`(요구사항이 `og:image`와 `twitter:card`까지다), `featureList`(새 문구를 만들지 않는다), `SearchAction`(사이트 검색에 결과 주소가 없다)은 넣지 않는다.

## 랜딩의 다운로드 버튼

랜딩 hero 의 기본 다운로드 버튼(`#dl-primary`)은 처음에는 릴리스 페이지(`RELEASES_URL`)로 연결된다.
빌드 때 `src/lib/release.ts` 가 `release.json`(이 레포의 `pages.yml` 이 빌드 전에 `gh release view --repo zilhak/tasty`로 레포 루트에 만드는 생성물, Git 제외)의 자산 이름을 파일명 접미사로 OS·아키텍처에
대응시키고, 자산이 있는 조합만 `data-<os>-<arch>` 속성으로 버튼에 싣는다.

| 속성 | 자산 접미사 |
|---|---|
| `data-macos-arm64` | `-macos-arm64.dmg` |
| `data-windows-x64` | `-windows-x64.msi` |
| `data-windows-arm64` | `-windows-arm64.msi` |
| `data-linux-x64` | `-x86_64.AppImage` |
| `data-linux-arm64` | `-aarch64.AppImage` |

브라우저에서는 `site.js` 가 OS 와 아키텍처를 판별해 두 값이 모두 맞는 속성이 있을 때만 버튼의 링크와
문구(`{os}용 다운로드`)를 바꾼다.

- OS 는 `navigator.userAgentData.platform` 또는 `navigator.platform` 으로 판별한다.
- Windows·Linux 의 아키텍처는 `navigator.userAgentData.getHighEntropyValues(["architecture", "bitness"])` 를
  먼저 사용한다. 64비트 `arm` 은 arm64, 64비트 `x86` 은 x64 로 본다. 이 API 가 아키텍처를 주면 그 값만
  따르며, 32비트 같은 다른 조합은 대응 자산이 없으므로 릴리스 페이지에 남는다.
- 이 API 가 없거나 거부되거나 빈 값을 주면 `navigator.platform`, 그다음 user agent 문자열에서
  `aarch64`·`arm64` 는 arm64, `x86_64`·`amd64`·`x64` 는 x64 로 읽는다. `armv8`·`armv8l` 처럼 32비트 ARM 환경일 수 있는 이름은 arm64 로 보지 않는다. 어느 쪽도 맞지 않으면
  아키텍처를 모르는 것으로 보고 릴리스 페이지에 남긴다.
- macOS 는 Apple silicon 산출물만 배포하고 Safari 가 아키텍처를 알려 주지 않으므로 아키텍처를 묻지 않고
  `data-macos-arm64` 를 사용한다.
- 브라우저가 보고한 값만 사용한다. Windows ARM 기기의 브라우저가 x64 라고 보고하면 x64 설치 파일로
  연결된다. 아키텍처를 판별하지 못한 방문자에게 다른 아키텍처의 파일을 대신 고르지 않는다.
- `release.json` 이 없거나 해당 조합의 자산이 없으면 속성이 없으므로 버튼은 릴리스 페이지로 간다.
  한국어·영어 랜딩은 같은 컴포넌트와 스크립트를 사용한다.

## 랜딩의 제품 창

랜딩 hero 의 창은 스크린샷도 전사본도 아니다 — 킷의 `app.jsx` 와 **같은 컴포넌트**를 같은
순서로 합성한 것이고(타이틀바 → 사이드바 | 탭 스트립 → 분할 서피스 → 상태바), 킷이 바뀌면
같이 바뀐다. `src/components/AppShell.jsx`, 프레임 스타일은 `src/styles/app-shell.css`.

**동작한다.** 탭을 고르고 닫고 열 수 있고(마크다운 탭은 패인을 마크다운 서피스로 바꾼다),
워크스페이스를 옮기고, 사이드바를 접고, 터미널 검색을 열고, 사이드바 버튼으로 Settings ·
Plugins · Ports · Remote · 커맨드 팔레트를 연다. 페이지이기 때문에 킷 프리뷰와 다른 점이 둘 있다.

- **테마는 페이지의 것이다.** `site.js` 가 `window.tastyTheme` 로 getter/setter 를 내주고
  셸의 상태바와 Settings 창이 그것을 통해서만 테마를 읽고 쓴다 — 헤더 토글과 어긋날 수 없고
  저장 규칙이 한 곳에 남는다.
- **오버레이는 `<body>` 끝의 고정 레이어로 나간다.** Settings 는 1100×700 이라 hero 가 셸에
  주는 프레임보다 크고, 도구 메뉴는 뷰포트 좌표에 앵커한다. 그림 안에 욱여넣어 줄이는 대신
  제 크기로 페이지 위에 띄운다.

랜딩의 AppShell과 갤러리처럼 상호작용이 필요한 곳은 React를 실행한다.
일반 가이드는 React 앱을 띄우지 않지만 테마·내비게이션을 위한 공용 사이트 스크립트는 사용한다.

### React 섬의 SSR

`astro.config.mjs`는 `react({ experimentalDisableStreaming: true })`로 섬을 `renderToString`으로 그린다. react-dom 18.3.1의 Node 스트림 렌더러(`renderToPipeableStream`)는 다음 글자가 멀티바이트라 2048바이트 버퍼의 남은 자리에 들어가지 않으면 안 쓴 자리까지 버퍼 전체를 내보내, HTML에 NUL 바이트가 들어간다. 18.3.1은 18.x의 마지막 버전이고 어느 페이지에 생기는지는 문구에 달려 있어, 스트림을 쓰지 않는 쪽을 고른다. 페이지가 Suspense로 스트리밍할 일은 없으므로 잃는 것이 없다.

- `useId`를 쓰지 않는다. 이 경로는 `identifierPrefix`를 넘기지 않아 한 페이지의 섬끼리 id가 겹칠 수 있다. 쓰게 되면 이 선택부터 다시 정한다.
- `Suspense`와 `lazy`도 지금 쓰지 않는다. `renderToString`은 Suspense 경계를 기다리지 않는다.
- 가이드 그림은 이 경로를 쓰지 않는다. `src/lib/diagrams.jsx`가 `renderToStaticMarkup`으로 그린다.

## 디자인 섹션

디자인 시스템 자체를 발행하는 구역이다. `vendor/` 가 정본이고 사이트는 소비자다. 세 종류의 페이지가 레이아웃 하나(`src/layouts/Design.astro`)를 쓰므로 페이지를 오갈 때 폭, 메뉴, 머리 부분이 바뀌지 않는다. 선택한 언어는 구역 안에서 유지되고, 안내 페이지 밖의 내용은 모든 언어에서 영어다. 메뉴 순서와 이전·다음은 `src/lib/design.ts`의 `DESIGN_GROUPS` 한 목록에서 나온다. 머리 부분은 `vendor/gallery/README.md`의 "Headings"를 따른다.

- **안내** (`/design/`) — 디자인 구역에서 유일하게 번역하는 페이지다. 문구는 사전의 `designHome`에 두고, 없는 언어는 영어로 대체하지 않고 예외를 던진다.
- **토큰** (`/design/tokens/`) — `vendor/gallery/tokens/`의 표본을 `tokens/tasty.tokens.json`에서 읽어 정적으로 그린다.
  갤러리와 같이 `SpecimenPage.astro`를 쓴다.
- **갤러리** (`/design/gallery/**`) — `vendor/gallery/<페이지>/` 15 페이지. 살아 있는 표본이라
  호버 · 포커스 · 열고 닫기가 실제로 동작하고, 각 표본이 레이아웃 스펙과 소비하는 토큰을
  함께 적는다. 구현은 위 [갤러리 페이지](#갤러리-페이지) 절에 있다.

## 작업 흐름 가이드의 그림

`using/workflow-layouts`는 페인별 작업 배치와 프리셋 재사용을, `agents/background-tasks`는 숨겨진 PTY의 생성·입력·조회·탭 전환·정리를 안내한다. 두 페이지는 한국어와 영어로 제공한다.

`src/components/diagrams/WorkflowLayout.jsx`는 vendor의 TabStrip과 TerminalPane을 조합한 정적 예시다. Markdown의 `tasty-diagram: workflow-layout` 및 `tasty-diagram: background-task` 표식을 통해 렌더한다. 가이드의 캡션은 실제 앱이 아닌 배치 예시임을 명시하고, 랜딩은 `caption` 값으로 자기 문구를 넘긴다. 비활성 컨트롤은 inert 처리한다. 좁은 화면에서는 페인을 세로로 배치한다. 문서의 실제 조작 순서와 명령이 그림의 설명을 보완한다.

## 갤러리 개발 서버와 빌드 캐시

개발 서버를 켠 상태에서도 배포 빌드를 실행할 수 있도록 Vite 의 의존성 캐시는 command·mode 별로 분리한다. `astro.config.mjs`의 `tasty-isolate-dependency-cache` 플러그인이 이 경로를 설정한다. 개발용 JSX 코드는 React의 `jsxDEV`를 사용하므로 production 의존성 번들을 재사용하면 갤러리 hydration이 실패하고 지연 렌더링하는 Stage가 비게 된다.

갤러리 검증은 HTTP 응답과 pageerror만으로 판정하지 않는다. 콘솔의 hydration 오류, React 아일랜드의 SSR 상태 해제, 첫 Stage의 실제 컨트롤 표시, 아래쪽 Stage의 스크롤 후 표시를 함께 확인한다. 개발 서버를 유지한 채 build한 뒤에도 새 브라우저에서 같은 검사를 수행한다.

가이드 사이드바의 현재 페이지와 본문 목차의 현재 절은 디자인 시스템의 `--tasty-accent-primary`로 강조한다. 선택 배경도 같은 토큰에서 파생하며, 로고의 수박색인 `--brand`를 선택 상태에 사용하지 않는다.

## 랜딩의 혼합 서피스 예시

메인 AppShell은 터미널과 마크다운이 한 탭에 나란히 놓인 혼합 배치로 시작한다. 기존 에이전트 터미널과 README는 별도 탭으로 전환한다. vendor의 MarkdownSurface는 path·children·focused를 받아 주소바와 본문, 포커스 배경을 구분한다. 이 컴포넌트와 layouts 갤러리의 혼합 분할 예시는 같은 디자인 원본에서 가져온다.

사이트 소유 AppShell은 한국어·영어 문서 예시와 현재 CLI 문법을 사용하며, 예시 명령을 실제로 실행하지 않는다. 혼합 배치에서는 터미널이 포커스된 표면이고 검색과 상태바도 해당 표면을 가리킨다. 모바일에서는 두 서피스를 세로로 배치해 문서를 숨기지 않는다.
