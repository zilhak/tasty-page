# 앱 문구 번역 도구

Tasty 언어 파일 10개의 중국어 간체(`zh-Hans`) 번역을 Codex에 나눠 맡기고, 결과를 글자 그대로 보관해 검사한 뒤 조립한다. Python 표준 라이브러리만 쓴다.

**번역문은 Codex만 쓴다.** 값이 틀리면 키와 사유를 `repair`나 `retranslate`로 다시 보낸다. raw 파일과 조립 결과를 손으로 고치지 않는다.

zh-Hans는 tasty `cbab01edd`에서 내장 언어로 등록됐다. 그래서 이 레포에 두던 넘길 때의 사본은 지웠고, 등록 뒤 앱 문구의 zh-Hans 수정은 tasty 쪽 경로로 처리한다. 이 레포에 남는 것은 용어집 `vendor/i18n/zh-Hans/glossary.json`이다.

## Codex 실행 방식

도구는 묶음마다 아래 명령을 새 프로세스로 실행한다. 재료는 전부 표준 입력으로 넘기고, Codex는 셸과 파일을 쓰지 않는다. 출력 파일은 샌드박스 밖의 CLI 프로세스가 쓴다.

```
codex exec --skip-git-repo-check --ephemeral -s read-only --output-schema <스키마> -o <임시 파일> -
```

이 방식을 쓰는 이유(codex-cli 0.163.0에서 측정):

| 방법 | 결과 |
|---|---|
| `tasty codex spawn`(기본 샌드박스)로 파일 쓰기 | 실패. 사용자 네임스페이스가 막힌 컴퓨터에서 `bwrap` 오류로 쓰기와 셸 실행이 안 된다 |
| `tasty codex spawn --full-auto`로 파일 쓰기 | 쓰기는 되지만 샌드박스가 꺼진다 |
| 위 `codex exec` | 성공. 샌드박스가 필요한 일을 하지 않고, 도중에 끊으면 출력 파일이 생기지 않는다 |

### 샌드박스 확인

셸에 `alias codex='codex --dangerously-bypass-approvals-and-sandbox'` 같은 alias가 있으면, 셸에서 `codex`를 부를 때 `-s read-only`를 줘도 샌드박스 없이 돈다. 실행 로그에 `sandbox: danger-full-access`가 찍힌다.

- 도구는 실행 파일을 직접 실행하므로 alias를 타지 않는다. 다른 실행 파일을 쓰려면 `--codex-bin`으로 넘긴다.
- 도구는 실행 로그의 `sandbox:` 값을 실행 중에 읽는다. `read-only`가 아니거나 값이 없으면 Codex를 바로 끝내고, 출력을 남기지 않고, 원장에 실패로 적고, 남은 묶음을 시작하지 않고 종료 코드 2로 멈춘다.
- 멈추면 원인을 고치기 전에 다시 돌리지 않는다.
- 시험할 때도 같은 조건이다. 결과는 원장의 `sandbox` 칸으로 확인한다.

### 도구 밖에서 Codex를 부를 때

용어집처럼 이 도구의 묶음이 아닌 입력도 같은 방식으로 실행한다. `command`가 alias를 건너뛴다. `run.log`의 머리 부분만 읽어야 프롬프트 안의 글자에 속지 않는다.

```bash
command codex exec --skip-git-repo-check --ephemeral -s read-only \
  --output-schema schema.json -o out.json - < prompt.txt 2> run.log
sed -n '/^user$/q;p' run.log | grep -qx 'sandbox: read-only' \
  || { echo "read-only가 아니다. 결과를 버린다"; rm -f out.json; }
```

용어집의 raw 출력은 상태 폴더의 `glossary/`에 그대로 둔다. 커밋하는 `vendor/i18n/zh-Hans/glossary.json`은 이 raw를 들여쓰기만 바꾼 것이어야 한다. `assemble`은 파싱한 값이 같은 raw 파일을 찾아 그 해시를 `MANIFEST.json`에 적고, 없으면 멈춘다.

## 순서

상태 폴더는 Git에서 제외된 곳에 두고 절대 경로로 넘긴다. worktree를 지워도 남아야 한다. 도구 경로의 기준은 레포 최상위다.

```bash
T=scripts/app-translation/app_translation.py
S=<상태 폴더>/0801838a8

python3 $T prepare --tasty <tasty 경로> --commit 0801838a8 --state $S
python3 $T status --state $S
python3 $T run --state $S --chunk c034           # 작은 묶음으로 문체와 표기를 먼저 본다
python3 $T run --state $S --pending --jobs 2     # 끝까지 돌린다. 끊기면 같은 명령을 다시 실행한다
python3 $T check --state $S --json review.json
python3 $T repair --state $S --chunk <묶음>
python3 $T retranslate --state $S --keys <id,id 또는 파일> --reason "<사유>"
python3 $T decide --state $S --key <id> --keep --reason "<사유>"
python3 $T assemble --state $S --out <출력 폴더>
```

`check`, `run`, `assemble`은 기본으로 `vendor/i18n/zh-Hans/glossary.json`을 읽는다. 다른 파일은 `--glossary`로 넘긴다.

## 명령

| 명령 | 하는 일 |
|---|---|
| `prepare` | `git show`로 기준 커밋의 카탈로그만 읽는다. 키 수 표와 공개 검사가 다르면 멈춘다. 같은 폴더에 다른 커밋이 있으면 멈춘다. 재료를 상태 폴더로 복사하고 묶음을 만든다 |
| `run` | `--chunk`(여러 번 가능) 또는 `--pending`. `--pending`은 낡은 묶음을 건드리지 않고, `--include-stale`을 더하면 함께 돌린다. 완료·실패 묶음을 처음부터 다시 돌리려면 `--force`를 쓴다 |
| `repair` | 실패한 키와 사유만 보낸다. 묶음당 3회까지다. 넘으면 키와 사유를 보여 주고 멈춘다. 그 키는 질문 목록에 올린다 |
| `retranslate` | 검토에서 재번역으로 정한 키를 사유와 함께 보낸다. 실패 키가 아니어도 된다 |
| `decide` | 검토 항목의 유지 결정을 사유와 함께 저장한다. `--keys-file`로 여러 키를 넘길 수 있다 |
| `status` | 묶음별 완료, 미실행, 실패, 낡음과 남은 키 수, 검토 미결정 수 |
| `check` | 아래 검사. `--chunk`는 한 묶음만 본다. `--lang ko`, `--lang ja`는 기존 번역으로 규칙을 보정한다. `--json`은 실패와 검토 목록을 파일로 남긴다 |
| `assemble` | 모든 묶음이 완료이고 실패와 미결정이 0일 때만 파일을 쓴다. 다시 읽어 raw와 글자까지 같은지 대조한다 |

## 묶음

카탈로그 → 최상위 절 순서로 항목을 늘어놓고(`cli.help`는 경로 앞 3단계) 한 묶음 200항목, en 8,000자에서 자른다. 기준 커밋에서 34묶음이다. 묶음이 카탈로그 경계를 넘을 수 있다. 점 키가 같은 항목(`html.cli.desc`)은 한 묶음에 둔다. `--max-keys`, `--max-chars`로 한도를 바꿀 수 있다.

`meta.name`은 묶음에 있지만 Codex에 보내지 않는다. 값은 용어집의 `display_name`이다.

## 상태 폴더

| 위치 | 내용 |
|---|---|
| `manifest.json` | 기준 커밋, 카탈로그별 키 수, 묶음 목록과 입력 해시 |
| `public-check.json` | 공개 검사 결과 |
| `source/`, `allowlist.json` | 기준 커밋에서 복사한 언어 파일과 영어 동일값 허용 목록 |
| `input/<묶음>.json` | id(카탈로그 + TOML 경로), 점 키, en, ko, ja, 제약 표시 |
| `runs/<묶음>.<회차>.raw.json` | Codex 출력 원본. 고치지 않는다 |
| `runs/ledger.jsonl` | 회차별 입력 지문, raw 해시, 모델, 추론 수준, 샌드박스, 토큰, 종료 코드, 시각. 실패 회차도 적는다 |
| `decisions.json` | 유지 결정. 항목마다 그 결정이 본 raw 해시와 규칙을 적는다 |
| `locks/`, `tmp/`, `quarantine/`, `glossary/` | 잠금, 실행 중 임시 파일, 원장에 없는 raw, 용어집 raw |

진행 상태 파일은 따로 없다. 매번 파일을 검사해 계산하므로 어디서 끊겨도 어긋나지 않는다.

### 끊겼을 때

- **실행 중 프로세스가 죽으면** 출력 파일이 생기지 않아 그 묶음은 미실행으로 남는다. 새 세션에서 같은 상태 폴더로 `status`, `run --pending`을 실행하면 이어진다.
- **입력 지문**: 묶음 입력, 프롬프트에 들어가는 용어집(`style`과 `app` 범위 용어), 프롬프트 틀, 출력 스키마, 기준 커밋을 합쳐 해시한다. 하나라도 바뀌면 기존 결과는 낡음이 되고 쓰지 않는다. `site` 범위 용어만 바뀌면 Codex가 본 내용이 같으므로 낡지 않는다. 낡은 묶음을 다시 돌릴지는 `status`를 보고 정한다.
- **고아 raw**: 원장에 없는 raw는 쓰지 않는다. 다음 실행이 `quarantine/`으로 옮긴 뒤 그 묶음을 돌린다.
- **중복 실행**: 묶음별 잠금으로 막는다. 기록된 PID가 죽어 있으면 잠금을 넘겨받는다.
- **회차 제한**: 원장에 남은 회차로 세므로 재개 뒤에도 유지된다. `repair`는 묶음당 3회, 실패한 `run`도 3회다. `run`은 원인을 고친 뒤 `--force`로 넘을 수 있고 `repair`는 넘을 수 없다.
- 키마다 가장 나중 회차의 값을 쓴다. 입력 지문이 다른 raw는 쓰지 않는다.

## 동시 실행

기본값은 `--jobs 1`이다. `--jobs 2`까지 시험했다.

| 조건 (5항목 묶음 2개) | 시간 | 결과 |
|---|---|---|
| 순차 | 15초 | 둘 다 `read-only`, 실패 0, 호출당 약 17,000토큰 |
| `--jobs 2` | 7초 | 둘 다 `read-only`, 실패 0, 호출당 약 18,000토큰 |

충돌이나 사용량 제한은 없었지만 큰 묶음으로는 재지 않았다. 그래서 기본값은 올리지 않고, 전체를 돌릴 때 `--jobs 2`를 쓴다. 3 이상은 시험하지 않았다. 호출마다 내용과 상관없이 약 17,000토큰이 든다.

## 등록 전에 새로 생긴 키

번역 기준은 `0801838a8`로 고정한다. tasty 등록 직전에 main의 키가 늘었으면 차이만 같은 경로로 번역한다. 원본 상태 폴더는 그대로 두고 새 폴더를 쓴다.

```bash
N=<tasty main 커밋>
python3 $T prepare --tasty <tasty 경로> --commit $N --state <상태 폴더>/$N --delta-from <상태 폴더>/0801838a8
python3 $T status --state <상태 폴더>/$N
python3 $T run --state <상태 폴더>/$N --pending
python3 $T check --state <상태 폴더>/$N
python3 $T assemble --state <상태 폴더>/$N --out <출력 폴더>
```

- `prepare`는 `added`(새 항목), `changed`(en이 바뀐 항목), `removed`(없어진 항목)를 id까지 출력한다. 묶음은 `added`와 `changed`로만 만든다.
- `repair`, `retranslate`, `decide`, `status`, `check`는 새 폴더에서 그대로 쓴다. 유지 결정은 raw가 같으면 이어진다. 앞 폴더 값을 재번역하려면 앞 폴더에서 `retranslate`를 실행한다. 그러면 새 폴더에서도 결정 대상이 된다.
- `check`와 `assemble`은 앞 폴더의 값과 합친 전체를 보고, 새 커밋의 `ko.toml`을 틀로 쓴다. `removed` 항목은 빠진다. 키 수 기대값은 새 커밋에서 잰다.
- `MANIFEST.json`의 `tasty_commit`은 새 커밋이고, `based_on_commits`와 `delta`에 지나온 커밋과 차이가 남는다.
- 규칙의 원본 시험 파일이 바뀌었으면 `prepare`가 경고한다. `rules.py`와 비교한 뒤 진행한다.
- 이미 `zh-Hans.toml`이 있는 커밋은 거부한다. 등록 뒤의 수정은 tasty 쪽 경로로 처리한다.

조립 결과는 tasty에 넘길 때의 사본이었다. tasty 등록(`cbab01edd`)이 main에 들어가 이 레포의 사본은 지웠다.

## 검사

**실패** (하나라도 있으면 묶음 또는 전체 미완료). `--lang` 실행에서는 `foreign_script`를 뺀다.

| 규칙 | 내용 | 원본 |
|---|---|---|
| `toml_parse`, `key_set` | 파일 10개가 읽힌다. TOML 경로 집합과 순서가 `ko.toml`과 같다. 수가 표와 같다. en `_one` 키가 없다 | `tests/i18n_key_parity.rs` |
| `duplicate_key` | 점 키가 겹치는 항목의 값이 같다 | `flatten_catalog_toml` |
| `placeholders`, `placeholder_mix` | 자리표시 칸과 이름이 en과 같다. `{}`와 `{0}`을 섞지 않는다 | `tests/i18n_key_parity.rs` |
| `flags`, `backtick_parity`, `list_lines` | 긴 플래그 집합, 백틱 홀짝, 목록 줄 수 | 기존 ko, ja로 보정 |
| `empty_value` | 빈 값은 ko도 빈 키에서만 허용한다 | 기존 ko, ja로 보정 |
| `table_header` | 표 헤더 3키의 열 시작 위치 | `crates/tasty-cli`, `mono_cells` |
| `toast_cap` | 토스트 19키가 200자 안이다. `{}`가 있으면 12자를 더해 잰다 | `tests/toast_message_fits_cap.rs` |
| `when_column` | `file_handler.picker.when_*` 5키가 10칸 안이다 | `tests/file_handler_when_fits_column.rs` |
| `foreign_script` | en에 없는 한글과 가나 | |
| `local_path` | 값, 조립 결과, 주석, `MANIFEST.json`에 로컬 경로가 없다 | `checks/tests/no_local_path_in_tracked_files.rs` |
| `schema_ids` | 입력에 없는 id와 빠진 id | |
| `raw_integrity` | raw가 원장 해시와 같다 | |
| `char_limit_notice` | `toast.char_limit_notice`는 `{}` 1개에 ASCII 숫자가 없다 | `tests/toast_message_fits_cap.rs` |
| `macos_app_name`, `macos_no_placeholder` | About, Hide, Quit은 `{}` 1개, 나머지 `menu.macos.*`는 `{}` 없음 | `tests/native_surface_labels_i18n.rs` |

**검토** (실패가 아니다. 항목마다 재번역 또는 유지와 사유를 정한다). `check`는 ko, ja 기준선을 함께 보여 준다. 기준선보다 많으면 원인을 본다.

| 규칙 | 내용 | ko | ja |
|---|---|---:|---:|
| `line_structure` | 줄바꿈 수, 빈 줄 수 | 31 | 31 |
| `backtick_count` | 백틱 개수 | 14 | 13 |
| `backtick_spans` | 백틱 구간 내용 | 19 | 18 |
| `flag_count` | 플래그 횟수 | 2 | 2 |
| `angle_tokens` | `<token>` 집합 | 5 | 5 |
| `urls` | URL 집합 | 2 | 2 |
| `edge_whitespace` | 앞뒤 공백 | 2 | 5 |
| `tasty_commands` | `tasty <명령>` 집합 | 43 | 43 |
| `same_as_en` | en과 같은 값. ko, ja 기준선은 세 갈래를 합친 수다 | 67 | 67 |
| `latin_no_han` | 영문자가 있는데 한자가 없고 en과도 다른 값 | | |
| `traditional_candidate` | GB2312로 인코딩되지 않는 한자. 번체 후보를 찾는 근사다 | | |
| `same_en_different_value` | en이 같은데 번역이 다른 키. 용어 일관성 후보다 | | |
| `glossary_missing`, `glossary_avoid` | en에 용어가 있는데 지정 표기가 없다. `avoid` 표기가 있다 | | |

en과 같은 값은 세 갈래다. ① `is_language_neutral` 통과 ② 기준 커밋의 허용 목록에 ko, ja로 있음 ③ 그 밖. ③만 결정이 필요하다. 세 갈래 목록은 `MANIFEST.json`에 남고 ③에는 사유가 함께 적힌다. 허용 목록에 넣을지는 tasty 등록 쪽이 정한다.

`prepare`의 공개 검사는 en, ko, ja 전체를 줄 단위로 본다. 기준 커밋에서 `~/.claude/` 12줄과 `--account zilhak` 예시 48줄(16키 × 3언어)만 나온다. `--account zilhak`은 공개 GitHub 계정 이름이고 원문대로 둔다. `~/.claude/`는 번역에서 `~/` 바로 뒤에 그대로 둔다.

### 이 도구가 재지 못하는 것

번역의 정확성과 자연스러움, 실제 글꼴과 UI에서의 잘림, tasty 시험 자체의 통과. 최종 대조는 tasty 등록 때 돈다.

## 결과

```
<출력 폴더>/MANIFEST.json
<출력 폴더>/lang/zh-Hans.toml
<출력 폴더>/crates/tasty-plugin-<id>/lang/zh-Hans.toml   (9개)
```

`ko.toml`을 틀로 값만 바꾼다. 키 순서, 절 순서, 주석은 그대로이고 첫 줄 언어 표시 주석만 바꾼다. 상대 경로는 tasty와 같다.

## 시험

```bash
python3 -B scripts/app-translation/test_app_translation.py
```

가짜 Codex로 도는 합성 시험이다. 번역문을 쓰지 않고 채움 글자 하나로 값을 표시한다. `TASTY_REPO`에 tasty 경로를 주면 기준 커밋의 `prepare`와 ko, ja 보정도 함께 돈다. 실제 Codex 호출은 없다.
