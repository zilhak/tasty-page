# 홈페이지 기획

기획서는 무엇을 보여 줄지만 적는다. 문구는 최신 페이지(main)에 바로 쓴다.

## 사이트 구성

처음 방문한 사용자는 제품 소개에서 설치와 첫 배치로, 사용 중인 사람은 목적별 가이드로 들어가게 한다. 디자인 기여자를 위한 구역은 사용 가이드와 나누고, 개인정보 안내를 별도로 둔다. 기존 URL과 가이드 읽기 순서를 유지한다. 다운로드와 변경 이력은 프로젝트의 기존 외부 페이지로 연결한다.

| 구역 | 역할과 범위 | 기획 |
|---|---|---|
| 랜딩 | 터미널 소개, 배치, 일상 기능, CLI·에이전트, 플랫폼·설치 | [랜딩](landing.md) |
| 공통 요소·개인정보 | 길찾기, 언어·번역 상태, 검색, 공유 소개, 통계 안내 | [공통](common.md) |
| 디자인 | 디자인 안내·토큰·영어 공용 갤러리 15개 | [디자인](design.md) |
| 시작하기 | 가이드 홈, 설치, 첫 화면 | [시작하기](guide-start.md) |
| 기본 사용 | 프로젝트 관리, 배치 실습, 조작 참조, 터미널·파일 | [기본 사용](guide-using.md) |
| 맞춤 설정 | 단축키, 설정, 테마, 스크립트 | [맞춤 설정](guide-customize.md) |
| CLI·에이전트 | CLI 입문·참조, 백그라운드 작업, 연동, 작업 순서, 이벤트 | [CLI·에이전트](guide-agents.md) |
| 원격·확장·도움말 | 원격 연결, 플러그인, 증상별 해결, CLI 진단 | [원격·도움말](guide-remote-help.md) |

## 가이드 페이지 목록

한국어는 `/ko/guide/`, 영어는 `/guide/` 아래에 같은 구성을 둔다.

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
