# Tasty 홈페이지

[Tasty](https://github.com/zilhak/tasty)의 랜딩 페이지와 사용자 가이드 소스 레포다. 공개 레포다.

## 역할

- Tasty를 내려받아 쓰는 사람을 위한 정보를 제공한다. 소스 경로, ADR, IPC 메서드 이름처럼 개발자용 내용은 넣지 않는다.
- 공개 사이트는 사용자가 받을 수 있는 버전을 설명한다.

사이트 소스는 아직 본체 레포에서 옮겨 오는 중이다.

## 게시용 페이지와 최신 페이지

이 레포는 페이지를 두 벌 관리한다.

- 게시용 페이지: 릴리스된 Tasty 버전을 설명하는 페이지 소스다. 공개 사이트에 배포하는 것은 이 페이지뿐이다.
- 최신 페이지: 개발 중에 바뀐 사실을 바로 반영해 두는 페이지 소스다. 로컬에서만 확인하고 배포하지 않는다.
- 사용자에게 보이는 동작이 바뀌면 최신 페이지를 고친다. 게시용 페이지는 평소에 고치지 않는다.
- Tasty를 릴리스할 때 최신 페이지를 게시용 페이지로 옮기고 배포한다.

두 페이지를 레포에 담는 구조와 옮기는 절차는 아직 정하지 않았다.

## Git 규칙

- [Conventional Commits](https://www.conventionalcommits.org/)를 따른다: `type(scope): description`. type은 `feat`, `fix`, `docs`, `refactor`, `test`, `perf`, `style`, `i18n`, `chore` 중에서 고른다.
- 제목과 본문은 영어 평문으로 쓰고 Markdown 서식을 쓰지 않는다.
- 한 커밋에는 한 변경만 담는다. 기능 수정이나 추가가 끝나면 다시 묻지 않고 커밋한다. 리팩토링과 기능 추가는 나눈다.
- `--no-verify`를 쓰지 않는다. 훅이 막으면 우회하지 말고 고치거나 보고한다.
- `.claude`와 `.claude-workspace`는 git에 넣지 않는다. 로컬 경로와 로컬 작업 문서를 이 레포에 적지 않는다.
- 자세한 기준은 [커밋 컨벤션](https://github.com/zilhak/tasty/blob/main/docs/dev-guide/commit-convention.md)을 따른다.
