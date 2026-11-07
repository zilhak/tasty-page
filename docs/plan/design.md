# 디자인 구역

## 디자인 안내 페이지

- 사이트 소스: [영어 진입점](../../src/pages/design/index.astro) · [한국어 진입점](../../src/pages/ko/design/index.astro) · [기초 요소](../../src/components/design/Foundations.astro) · [카드](../../src/components/design/Cards.astro) · [페이지 구성](../../src/lib/design.ts)
- 역할: 디자인을 이해하거나 기여하려는 사람이 색·글꼴·간격과 컴포넌트 예시를 고르는 진입점.
- 보여 줄 항목: 브랜드·색·타이포그래피·간격 카드, 토큰 안내, 다섯 그룹의 갤러리 진입점, 영어 공용 예시의 언어 범위, 사용자 가이드 연결.
- 넣지 않을 항목: 설치·사용 실습, 모든 예시를 실제 앱의 동작 보장으로 소개하는 설명, 원본 카드 전체 번역.

## 토큰 안내 페이지

- 사이트 소스: [영어 진입점](../../src/pages/design/tokens/index.astro) · [한국어 진입점](../../src/pages/ko/design/tokens/index.astro) · [페이지 구성](../../src/components/design/TokenSystem.astro) · [원본 카드](../../vendor/guidelines/token-system.html)
- 역할: 디자인 기여자가 값과 역할, 컴포넌트 적용의 관계를 이해하는 참조 페이지.
- 보여 줄 항목: 원시·의미·컴포넌트의 세 단계, 단계 간 참조 관계, 영어 원본 카드, 원본 보기와 사본 날짜.
- 넣지 않을 항목: 사용자 테마 제작 전체 과정, 웹 예시와 앱 내부 값의 완전 일치 보장.

## 갤러리 공통 구성

- 사이트 소스: [갤러리 레이아웃](../../src/layouts/GalleryPage.astro) · [그룹·순서·소개 데이터](../../src/lib/design.ts)
- 역할: 목적과 상태에 따라 디자인 표본을 비교하는 영어 공용 참조 구역.
- 보여 줄 항목: 사이트 공용 머리글·테마·언어 선택·푸터, 왼쪽 페이지·절 링크, 본문, 이전·다음 탐색. 아래 표 순서로 다섯 그룹을 구성한다.
- 표본 구성: 사용 목적, 조작 예시, 고정 상태, 숨은 화면의 고정 예시, 치수·토큰 명세를 내용이 있는 항목만 보여 준다. 명세는 항상 표시한다.
- 소개 범위: 각 페이지 소개와 공유 설명의 의미를 맞추고 표본의 소개 대체값도 같은 범위를 가리키게 한다. 기존 표본별 산문 전체 교체는 포함하지 않는다.
- 넣지 않을 항목: 한국어 갤러리 신설, 갤러리 전용 상단 바·오른쪽 목차, 명세 표시 토글, 옛 공용 조작 안내, 사이드바의 중복 타일 설명.

| 그룹 | 페이지와 사이트 소스 | 역할·보여 줄 항목 | 넣지 않을 항목 |
|---|---|---|---|
| Foundations | [기초 요소](../../src/pages/design/gallery/index.astro) | 색·간격·글꼴·형태·떠 있는 면의 토큰 사용 위치와 역할 | 실제 앱 화면 전체의 동작 보장 |
| Foundations | [아이콘](../../src/pages/design/gallery/icons/index.astro) | 이름·용도별 아이콘 탐색, 역할, 보조키 기호, 공용 컴포넌트 사용 | 별도 아이콘 체계 신설 |
| Foundations | [색 사용 규칙](../../src/pages/design/gallery/rules/index.astro) | 바탕별 글자·아이콘 역할, 아홉 묶음의 대비 | 근거 없는 대비 적합성 보장 |
| Foundations | [배치 지도](../../src/pages/design/gallery/rules-map/index.astro) | 위치별 바탕과 중첩, 밝고 어두운 테마 비교 | 실제 레이아웃 편집 기능 |
| Components | [기본 컴포넌트](../../src/pages/design/gallery/components/index.astro) | 기본 컨트롤·상태·스크롤바, 스크롤바의 사용 목적 | 기존 표본별 산문 전체 재작성 |
| Overlays | [대화상자](../../src/pages/design/gallery/overlays-dialogs/index.astro) | 확인·편집, 바탕별 가림막, 프레임과 사용 목적 | 명세 표시 토글 |
| Overlays | [윈도우](../../src/pages/design/gallery/overlays-windows/index.astro) | 설정·목록·도구의 큰 화면과 상태 | 앱 기능 변경안 |
| Overlays | [팝업과 메뉴](../../src/pages/design/gallery/overlays-popups/index.astro) | 메뉴·검색·전환 안내·불투명 표시 | 실행 가능한 전체 앱 메뉴라는 보장 |
| Overlays | [배너](../../src/pages/design/gallery/overlays-banners/index.astro) | 안내·조치·대기열·표시 범위 | 새 알림 채널 |
| Overlays | [튜토리얼](../../src/pages/design/gallery/overlays-tutorial/index.astro) | 단계별 안내·초점·차단 범위 | 사용자 가이드 전체 대체 |
| Shell | [배치](../../src/pages/design/gallery/layouts/index.astro) | 창·사이드바·탭·분할, 타이틀바의 사용 목적 | 실제 명령 실행 보장 |
| Shell | [로딩](../../src/pages/design/gallery/loading/index.astro) | 대기·진행·초기 화면의 상태와 적용 위치 | 실제 처리 시간 보장 |
| Surfaces | [작업 그래프](../../src/pages/design/gallery/dag/index.astro) | 노드·관계·진행·결과 분기의 시각 표현 | 그래프 편집으로 작업을 생성하는 기능 |
| Surfaces | [플러그인](../../src/pages/design/gallery/plugins/index.astro) | 뷰어·도구 표면과 상태 | 플러그인 개발 API 전체 |
| Surfaces | [탐색기 작업](../../src/pages/design/gallery/explorer-ops/index.astro) | 파일 작업 진행·충돌·결과·원격 상태 | 실제 파일 작업 실행 보장 |
