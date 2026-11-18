# 홈페이지 기획

기획서는 무엇을 보여 줄지만 적는다. 문구는 최신 페이지(develop)에 바로 쓴다.

## 사이트 구성

처음 방문한 사용자는 제품 소개에서 설치와 첫 배치로, 사용 중인 사람은 목적별 가이드로 들어가게 한다. 디자인 기여자를 위한 구역은 사용 가이드와 나누고, 개인정보 안내를 별도로 둔다. 기존 URL과 가이드 읽기 순서를 유지한다. 다운로드와 변경 이력은 프로젝트의 기존 외부 페이지로 연결한다.

## 지원 언어

- 언어와 주소: 영어 `/`, 한국어 `/ko/`, 일본어 `/ja/`, 중국어 간체 `/zh/`. 기존 주소는 그대로 두고 일본어와 중국어 주소를 더한다. 중국어는 간체만 지원하고 번체판은 두지 않는다.
- 번역 범위: 랜딩, 공통 요소, 개인정보 안내, 가이드 전체, 디자인 첫 페이지.
- 영어 고정 범위: 토큰, 갤러리, 디자인 메뉴, 이전·다음은 모든 언어에서 영어다.
- 첫 방문 언어 판단: 번체 환경(`zh-TW`, `zh-HK`, `zh-MO`, `zh-Hant*`)은 간체로 보내지 않고 영어 랜딩에 둔다. 사용자가 언어 전환으로 고른 값은 그대로 따른다.

| 구역 | 역할과 범위 | 기획 |
|---|---|---|
| 랜딩 | 터미널 소개, 배치, 일상 기능, CLI·에이전트, 플랫폼·설치 | [랜딩](landing.md) |
| 공통 요소·개인정보 | 길찾기, 언어·번역 상태, 검색, 공유 소개, 통계 안내 | [공통](common.md) |
| 디자인 | 언어별 디자인 안내·영어 고정 토큰·카드 내용을 합친 Foundations를 포함한 영어 고정 갤러리 15개, 언어별 경로와 공통 레이아웃 | [디자인](design.md) |
| 시작하기 | 가이드 홈, 설치, 첫 화면 | [시작하기](guide-start.md) |
| 기본 사용 | 프로젝트 관리, 배치 실습, 조작 참조, 터미널·파일 | [기본 사용](guide-using.md) |
| 맞춤 설정 | 단축키, 설정, 테마, 스크립트 | [맞춤 설정](guide-customize.md) |
| CLI·에이전트 | CLI 입문·참조, 백그라운드 작업, 연동, 작업 순서, 이벤트 | [CLI·에이전트](guide-agents.md) |
| 원격·확장·도움말 | 원격 연결, 플러그인, 증상별 해결, CLI 진단 | [원격·도움말](guide-remote-help.md) |

## 가이드 페이지 목록

영어는 `/guide/`, 한국어는 `/ko/guide/`, 일본어는 `/ja/guide/`, 중국어 간체는 `/zh/guide/` 아래에 같은 구성을 둔다. 번역은 `content/<언어>/`의 같은 상대 경로에 두므로 아래 표에는 정본과 영어 소스만 적는다.

| 페이지 | 사이트 소스 | 상세 범위 |
|---|---|---|
| Tasty 가이드 | [한국어](../../content/index.md) · [영어](../../content/en/index.md) | [guide-start](guide-start.md) |
| 설치 | [한국어](../../content/getting-started/install.md) · [영어](../../content/en/getting-started/install.md) | [guide-start](guide-start.md) |
| 첫 화면 둘러보기 | [한국어](../../content/getting-started/first-look.md) · [영어](../../content/en/getting-started/first-look.md) | [guide-start](guide-start.md) |
| 워크스페이스 | [한국어](../../content/using/workspaces.md) · [영어](../../content/en/using/workspaces.md) | [guide-using](guide-using.md) |
| 작업 배치 만들고 다시 쓰기 | [한국어](../../content/using/workflow-layouts.md) · [영어](../../content/en/using/workflow-layouts.md) | [guide-using](guide-using.md) |
| 페인 · 탭 · 분할 | [한국어](../../content/using/panes-tabs-splits.md) · [영어](../../content/en/using/panes-tabs-splits.md) | [guide-using](guide-using.md) |
| 터미널 다루기 | [한국어](../../content/using/terminal.md) · [영어](../../content/en/using/terminal.md) | [guide-using](guide-using.md) |
| 파일 관리와 보기 | [한국어](../../content/using/files.md) · [영어](../../content/en/using/files.md) | [guide-using](guide-using.md) |
| 단축키 | [한국어](../../content/customize/keybindings.md) · [영어](../../content/en/customize/keybindings.md) | [guide-customize](guide-customize.md) |
| 설정 | [한국어](../../content/customize/settings.md) · [영어](../../content/en/customize/settings.md) | [guide-customize](guide-customize.md) |
| 테마 | [한국어](../../content/customize/themes.md) · [영어](../../content/en/customize/themes.md) | [guide-customize](guide-customize.md) |
| Lua 스크립트 | [한국어](../../content/customize/scripts.md) · [영어](../../content/en/customize/scripts.md) | [guide-customize](guide-customize.md) |
| tasty CLI로 터미널 조작하기 | [한국어](../../content/agents/cli.md) · [영어](../../content/en/agents/cli.md) | [guide-agents](guide-agents.md) |
| CLI 명령 참조 | [한국어](../../content/agents/cli-reference.md) · [영어](../../content/en/agents/cli-reference.md) | [guide-agents](guide-agents.md) |
| 백그라운드 작업을 탭으로 가져오기 | [한국어](../../content/agents/background-tasks.md) · [영어](../../content/en/agents/background-tasks.md) | [guide-agents](guide-agents.md) |
| Claude·Codex와 함께 쓰기 | [한국어](../../content/agents/claude-codex.md) · [영어](../../content/en/agents/claude-codex.md) | [guide-agents](guide-agents.md) |
| 작업 순서 관리 (DAG) | [한국어](../../content/agents/tasks.md) · [영어](../../content/en/agents/tasks.md) | [guide-agents](guide-agents.md) |
| 훅 · 알림 · 웹훅 | [한국어](../../content/agents/hooks-notifications.md) · [영어](../../content/en/agents/hooks-notifications.md) | [guide-agents](guide-agents.md) |
| 원격 작업 이어가기 (attach) | [한국어](../../content/remote/attach.md) · [영어](../../content/en/remote/attach.md) | [guide-remote-help](guide-remote-help.md) |
| 플러그인 | [한국어](../../content/plugins/index.md) · [영어](../../content/en/plugins/index.md) | [guide-remote-help](guide-remote-help.md) |
| 문제 해결 | [한국어](../../content/help/troubleshooting.md) · [영어](../../content/en/help/troubleshooting.md) | [guide-remote-help](guide-remote-help.md) |
| CLI 응답 지연과 연결 진단 | [한국어](../../content/help/cli-diagnostics.md) · [영어](../../content/en/help/cli-diagnostics.md) | [guide-remote-help](guide-remote-help.md) |

## 포함하지 않는 범위

새 제품 기능, 별도 다운로드·변경 이력 페이지, 제작자 개인 이야기 페이지, 근거 없는 성능 비교, 작업 성공·프로세스 복원·환경 동기화 보장은 넣지 않는다. 조사 기록과 문구 초안은 페이지 구성에 포함하지 않는다.
