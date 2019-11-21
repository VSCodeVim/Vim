## Key

:white_check_mark: - 명령 완료

:white_check_mark: :star: - VScode 특정 사용자 정의로 수행되는 명령

:warning: - 명령의 일부 변형이 지원되지 않습니다

:running: - 진행중인 작업

:arrow_down: - 명령이 우선 순위가 낮습니다. 더 빨리 보고싶다면 이슈를 열거나 관련 이슈를 엄지손가락으로 올리십시오.

:x: - 현재 VSCode API로는 불가능한 명령

:1234: - 명령어는 숫자 접두사를 허용합니다

## 로드맵

이들은 Vim의 큰 기능으로, 일반적으로 구현할 순서대로되어 있습니다.

| Status             | Command                |
| ------------------ | ---------------------- |
| :white_check_mark: | 일반 모드               |
| :white_check_mark: | 삽입 모드               |
| :white_check_mark: | 비주얼  모드            |
| :white_check_mark: | 비주얼 라인 모드        |
| :white_check_mark: | 숫자 접두사             |
| :white_check_mark: | . 연산자               |
| :white_check_mark: |  / 과 ? 로 검색        |
| :white_check_mark: | 실행 취소 / 재실행      |
| :warning:          | 명령 재 매핑           |
| :warning:          | 마크                   |
| :white_check_mark: | 텍스트 객체             |
| :white_check_mark: | 비주얼 블록 모드        |
| :white_check_mark: | 교체 모드               |
| :white_check_mark: | 다중 선택 모드          |
| :warning:          | 매크로                 |
| :warning:          | Buffer/Window/Tab      |

이제 우리가 찾을 수있는 모든 알려진 Vim 명령의 전체 목록을 따릅니다.

## 사용자 명령어

- `gh` - hover tooltip 표시.
- `gb` - 다음 위치에 `*` 와 일치하는 추가 커서를 추가하십시오.

## 좌우 동작

| Status             | Command        | Description                                                                    |
| ------------------ | -------------- | ------------------------------------------------------------------------------ |
| :white_check_mark: | :1234: h       | 왼쪽 (또한 CTRL-H, BS 또는 왼쪽 키)                                              |
| :white_check_mark: | :1234: l       | 오른쪽 (또한 스페이스 또는 오른쪽 키)                                             |
| :white_check_mark: | 0              | 줄의 첫 번째 문자 (또한 Home 키)                                                 |
| :white_check_mark: | ^              | 행의 첫 번째 공백이 아닌 문자                                                    |
| :white_check_mark: | :1234: \$      | 줄의 마지막 문자 (N-1 줄 아래) (또한 End 키)                                     |
| :white_check_mark: | g0             | 화면 줄의 첫 문자 (줄 바꿈시 "0"과 다름)                                          |
| :white_check_mark: | g^             | 화면 줄에서 공백이 아닌 첫 문자로 줄 바꾸기 (줄 바꿈시 "^"와 다름)                  |
| :white_check_mark: | :1234: g\$     | 화면 줄의 마지막 문자 (줄 바꿈시 "\ $"와 다름)                                    |
| :white_check_mark: | gm             | 화면 라인의 중간                                                                |
| :white_check_mark: | :1234: \|      | N 열까지 (기본값 : 1)                                                           |
| :white_check_mark: | :1234: f{char} | 오른쪽으로 {char}의 N 번째 발생                                                 |
| :white_check_mark: | :1234: F{char} | 왼쪽으로 {char}의 N 번째 발생                                                   |
| :white_check_mark: | :1234: t{char} | 오른쪽으로 {char}의 N 번째 발생 전까지                                           |
| :white_check_mark: | :1234: T{char} | 왼쪽으로 {char}의 N 번째 발생 전까지                                             |
| :white_check_mark: | :1234: ;       | 마지막 "f", "F", "t"또는 "T"N 번 반복                                           |
| :white_check_mark: | :1234: ,       | 반대 방향으로 마지막 "f", "F", "t"또는 "T"N 번 반복                              |

## 상하 동작

| Status             | Command   | Description                                                                               |
| ------------------ | --------- | ----------------------------------------------------------------------------------------- |
| :white_check_mark: | :1234: k  | N 줄 위로 (CTRL-P 및 Up)                                                                   |
| :white_check_mark: | :1234: j  | N 줄 아래로 (또한 CTRL-J, CTRL-N, NL 및 Down)                                              |
| :white_check_mark: | :1234: -  | 공백이 아닌 첫 번째 문자에서 N 줄 위로                                                       |
| :white_check_mark: | :1234: +  | 공백이 아닌 첫 번째 문자에서 N 줄 아래로 (CTRL-M 및 CR)                                      |
| :white_check_mark: | :1234: \_ | 공백이 아닌 첫 번째 문자에서 N-1 줄 아래로                                                   |
| :white_check_mark: | :1234: G  | 공백이 아닌 첫 번째 문자에서 goto 행 N (기본값 : 마지막 행)                                   |
| :white_check_mark: | :1234: gg | 공백이 아닌 첫 번째 문자의 goto 행 N (기본값 : 첫 번째 행)                                    |
| :white_check_mark: | :1234: %  | 파일에서 N 줄 아래로 이동; N을 지정해야합니다. 그렇지 않으면 % 명령입니다.                      |
| :white_check_mark: | :1234: gk | N 화면 줄 위로 (줄 바꿈시 "k"와 다름)                                                        |
| :white_check_mark: | :1234: gj | N 화면 줄 아래로 (줄 바꿈시 "j"와 다름)                                                      |

## 텍스트 객체 동작

| Status             | Command    | Description                                                 |
| ------------------ | ---------- | ----------------------------------------------------------- |
| :white_check_mark: | :1234: w   | 앞으로 N 단어                                                |
| :white_check_mark: | :1234: W   | 공백으로 분리 된 N 개의 단어 앞으로                            |
| :white_check_mark: | :1234: e   | N 번째 단어의 끝까지 N 단어                                   |
| :white_check_mark: | :1234: E   | 공백으로 분리 된 N 번째 단어의 끝으로 N 단어 앞으로             |
| :white_check_mark: | :1234: b   | 뒤로 N 단어                                                  |
| :white_check_mark: | :1234: B   | 공백으로 분리 된 N개의 단어 뒤로                               |
| :white_check_mark: | :1234: ge  | N번째 단어의 끝까지 N단어                                     |
| :white_check_mark: | :1234: gE  | 공백으로 분리 된 N 번째 단어의 끝까지 N 단어                   |
| :white_check_mark: | :1234: )   | 앞으로 N 문장                                                |
| :white_check_mark: | :1234: (   | 뒤로 N 문장                                                  |
| :white_check_mark: | :1234: }   | 앞으로 N 단락                                                |
| :white_check_mark: | :1234: {   | 뒤로 N 단락                                                  |
| :white_check_mark: | :1234: ]]  | 섹션 시작시 N 섹션 앞으로                                     |
| :white_check_mark: | :1234: [[  | 섹션 시작시 뒤로 N 섹션                                       |
| :white_check_mark: | :1234: ][  | 섹션 끝에서 N 섹션 앞으로                                     |
| :white_check_mark: | :1234: []  | 섹션 끝에서 뒤로 N 섹션                                       |
| :white_check_mark: | :1234: [(  | 닫히지 않은 '('로 N 번                                        |
| :white_check_mark: | :1234: [{  | 닫히지 않은 '{'로 N 번                                        |
| :arrow_down:       | :1234: [m  | 메소드 시작으로 다시 N 번 (Java의 경우)                        |
| :arrow_down:       | :1234: [M  | 메소드의 끝까지 N 번 (Java의 경우)                            |
| :white_check_mark: | :1234: ])  | 닫히지 않은 ')'까지 N 번 전달                                 |
| :white_check_mark: | :1234: ]}  | 닫히지 않은 '}'까지 N 번 전달                                 |
| :arrow_down:       | :1234: ]m  | 메소드 시작까지 N 배 앞으로 (Java의 경우)                      |
| :arrow_down:       | :1234: ]M  | 메소드의 끝까지 N 배 앞으로 (Java의 경우)                      |
| :arrow_down:       | :1234: [#  | 닫히지 않은 "#if"또는 "#else"로 다시 N 번                     |
| :arrow_down:       | :1234: ]#  | 닫히지 않은 "#else"또는 "#endif"로 N 번 전달                  |
| :arrow_down:       | :1234: [\* | C 주석 "/ *"의 시작으로 다시 N 번                             |
| :arrow_down:       | :1234: ]\* | C 주석 "* /"의 끝까지 N 배 앞으로                             |

## 패턴 검색

| Status                    | Command                            | Description                                            | Note                                                                            |
| ------------------------- | ---------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------- |
| :white_check_mark: :star: | :1234: `/{pattern}[/[offset]]<CR>` | {pattern}의 N 번째 발생을 검색                          | 현재는 JavaScript 정규식 만 지원하지만 Vim의 사내 정규식 엔진은 지원하지 않습니다. |
| :white_check_mark: :star: | :1234: `?{pattern}[?[offset]]<CR>` | {pattern}의 N 번째 발생을 뒤로 검색                      | 현재는 JavaScript 정규식 만 지원하지만 Vim의 사내 정규식 엔진은 지원하지 않습니다. |
| :warning:                 | :1234: `/<CR>`                     | 정방향으로 마지막 검색 반복                              | {count}는 지원되지 않습니다.                                                      |
| :warning:                 | :1234: `?<CR>`                     | 역방향으로 마지막 검색 반복                              | {count}는 지원되지 않습니다.                                                      |
| :white_check_mark:        | :1234: n                           | 마지막 검색 반복                                        |
| :white_check_mark:        | :1234: N                           | 반대 방향으로 마지막 검색 반복                           |
| :white_check_mark:        | :1234: \*                          | 커서 아래에서 식별자를 검색                              |
| :white_check_mark:        | :1234: #                           | 커서 아래에서 식별자를 뒤로 검색                          |
| :white_check_mark:        | :1234: g\*                         | "*"와 비슷하지만 부분 일치도 찾습니다                     |
| :white_check_mark:        | :1234: g#                          | "#"과 같지만 부분 일치 항목도 찾습니다.                   |
| :white_check_mark:        | gd                                 | 커서 아래 식별자의 로컬 선언으로 이동                     |
| :arrow_down:              | gD                                 | 커서 아래에 식별자의 goto 글로벌 선언                     |

## 마크와 

| Status             | Command                                                     | Description                                            |
| ------------------ | ----------------------------------------------------------- | ------------------------------------------------------ |
| :white_check_mark: | m{a-zA-Z}                                                   | {a-zA-Z} 표시로 현재 위치 표시                            |
| :white_check_mark: | `{a-z} | 현재 파일에서 {a-z}로 이동                           |
| :white_check_mark: | `{A-Z} | 모든 파일에서 {A-Z}로 이동                           |
| :white_check_mark: | `{0-9} | Vim이 이전에 나간 위치로 이동                        |
| :white_check_mark: | `` | 마지막 점프 전 위치로 이동                               |
| :arrow_down:       | `" | 이 파일을 마지막으로 편집 할 때 위치로 이동               |
| :white_check_mark: | `[ | 이전에 운영 한 텍스트의 시작으로 이동하거나 텍스트를 넣습니다|
| :white_check_mark: | '[                                                          | 이전에 운영 한 텍스트의 시작으로 이동하거나 텍스트를 넣습니다         |
| :white_check_mark: | `] | 이전에 운영 한 텍스트의 시작으로 이동하거나 텍스트를 넣습니다|
| :white_check_mark: | ']                                                          | 이전에 운영 한 텍스트의 시작으로 이동하거나 텍스트를 넣습니다         |
| :arrow_down:       | `< | (이전) 시각 영역의 시작으로 이동                         |
| :arrow_down:       | `> | (이전) 시각 영역의 끝으로 이동                           |
| :white_check_mark: | `. | 이 파일에서 마지막 변경 위치로 이동                      |
| :white_check_mark: | '.                                                          | 이 파일에서 마지막 변경 위치로 이동     |
| :arrow_down:       | '{a-zA-Z0-9[]'"<>.}                                         | `와 동일하지만 첫 번째 공백이 아닌 행   |
| :arrow_down:       | :marks                                                      | 활성마크를 인쇄                                          |
| :white_check_mark: | :1234: CTRL-O                                               | 점프 목록에서 N 번째 이전 위치로 이동                      |
| :white_check_mark: | :1234: CTRL-I                                               | 점프 목록에서 N 번쨰 새로운 위치로 이동                    |
| :arrow_down:       | :ju[mps]                                                    | 점프리스트를 인쇄                                       |

## 다양한 동작

| Status             | Command             | Description                                                                                        |
| ------------------ | ------------------- | -------------------------------------------------------------------------------------------------- |
| :white_check_mark: | %                   | 이 줄에서 다음 중괄호, 대괄호, 주석 또는 "#if"/ "#else"/ "# endif"를 찾아서 해당 행으로 이동하십시오.  |
| :white_check_mark: | :1234: H            | 공백이 아닌 첫 번째 창에서 N 번째 줄로 이동                                                           |
| :white_check_mark: | M                   | 공백이 아닌 첫 번째 창에서 가운데 줄로 이동                                                           |
| :white_check_mark: | :1234: L            | 첫 번째 공백이 아닌 바닥에서 N 번째 줄로 이동                                                         |
| :arrow_down:       | :1234: go           | 버퍼의 N 번째 바이트로 이동                                                                         | 
| :arrow_down:       | :[range]go[to][off] | 버퍼의 [off] 바이트로 이동                                                                           |

## 태그 사용

VSCode는 Goto Symbol 태그를 매우 잘 지원하므로 다음은 우선 순위가 낮습니다. 아직 명령 팔레트에서 사용해보십시오!

| Status       | Command                | Description                                                           |
| ------------ | ---------------------- | --------------------------------------------------------------------- |
| :arrow_down: | :ta[g][!] {tag}        | 태그 {tag}로 이동                                                      |
| :arrow_down: | :[count]ta[g][!]       | 태그 목록에서 [count] '번째 최신 태그로 이동                             |
| :arrow_down: | CTRL-]                 | 변경 사항이 없으면 커서 아래의 태그로 이동                               |
| :arrow_down: | :ts[elect][!] [tag]    | 일치하는 태그를 나열하고 이동할 태그를 선택하십시오.                      |
| :arrow_down: | :tj[ump][!] [tag]      | 일치하는 태그가 여러 개인 경우 [tag] 태그로 이동하거나 목록에서 선택하십시오.|
| :arrow_down: | :lt[ag][!] [tag]       | [tag] 태그로 이동하여 위치 목록에 일치하는 태그 추가 인쇄 태그 목록        |
| :arrow_down: | :tagsa                 | 인쇄 태그 목록                                                         |
| :arrow_down: | :1234: CTRL-T          | 태그 목록에서 N 번째 오래된 태그에서 뒤로 이동                           |
| :arrow_down: | :[count]po[p][!]       | 태그 목록에서 [count] 번째 오래된 태그에서 뒤로 이동                     |
| :arrow_down: | :[count]tn[ext][!]     | 다음으로 일치하는 [count] 번째 태그로 이동                              |
| :arrow_down: | :[count]tp[revious][!] | 이전 일치하는 [count] 번째 태그로 이동                                  |
| :arrow_down: | :[count]tr[ewind][!]   | 일치하는 [count] 번째 태그로 이동                                       |
| :arrow_down: | :tl[ast][!]            | 마지막으로 일치하는 태그로 이동                                         |
| :arrow_down: | :pt[ag] {tag}          | {tag} 태그를 표시하기 위해 미리보기 창을 엽니 다.                        |
| :arrow_down: | CTRL-W }               | CTRL-]와 유사하지만 미리보기 창에 태그 표시                              |
| :arrow_down: | :pts[elect]            | ": tselect"와 같지만 미리보기 창에 태그 표시                             |
| :arrow_down: | :ptj[ump]              | ": tjump"와 같지만 미리보기 창에 태그 표시                               |
| :arrow_down: | :pc[lose]              | 태그 미리보기 창 닫기                                                   |
| :arrow_down: | CTRL-W z               | 태그 미리보기 창 닫기`                                                  |

## 스크롤

| Status             | Command       | Description                                    |
| ------------------ | ------------- | ---------------------------------------------- |
| :white_check_mark: | :1234: CTRL-E | window N 줄 아래로 내려갑니다 (기본값: 1)        |
| :white_check_mark: | :1234: CTRL-D | window N 줄 아래로 내려갑니다(기본값: 1/2 window) |
| :white_check_mark: | :1234: CTRL-F | window N 페이지 앞으로 (아래로)                  |
| :white_check_mark: | :1234: CTRL-Y | window N 줄 위쪽을 향합니다 (기본값: 1)          |
| :white_check_mark: | :1234: CTRL-U | window N 줄 위쪽을 향합니다 (기본값: 1/2 window) |
| :white_check_mark: | :1234: CTRL-B | window N 페이지 뒤로 (위로)                     |
| :white_check_mark: | z CR or zt    | window 맨 위에있는 현재 행 다시 그리기           |
| :white_check_mark: | z. or zz      | window 가운데에 현재 행 다시 그리기              |
| :white_check_mark: | z- or zb      | window 맨 아래에 현재 행 다시 그리기             |

'wrap'이 꺼져있을 때만 작동합니다.

| Status                    | Command   | Description                                   | Note                                                                                                          |
| ------------------------- | --------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| :white_check_mark: :star: | :1234: zh | 화면 N 문자를 오른쪽으로 스크롤                 | 코드에서 가로 스크롤 막대의 이동 여부에 관계없이이 명령을 실행할 때 커서는 항상 이동합니다.                          |
| :white_check_mark: :star: | :1234: zl | 화면 N 문자를 왼쪽으로 스크롤                   | 위와 같음                                                                                                      |
| :white_check_mark: :star: | :1234: zH | 화면 너비를 화면 너비의 오른쪽으로 스크롤        | 위와 같음                                                                                                      |
| :white_check_mark: :star: | :1234: zL | 화면 너비를 화면 너비의 왼쪽으로 스크롤          | 위와 같음                                                                                                      |

## 텍스트 삽입

| Status             | Command   | Description                                                   |
| ------------------ | --------- | ------------------------------------------------------------- |
| :white_check_mark: | :1234: a  | 커서 다음에 텍스트 추가 (N 회)                                  |
| :white_check_mark: | :1234: A  | 줄의 끝에 텍스트를 추가하십시오 (N 번)                           |
| :white_check_mark: | :1234: i  | 커서 앞에 텍스트 삽입 (N 번) (또한 삽입)                         |
| :white_check_mark: | :1234: I  | 첫 번째 공백이 아닌 줄 앞에 텍스트를 삽입하십시오 (N 번)          |
| :white_check_mark: | :1234: gI | 1 열에 텍스트 삽입 (N 회)                                       |
| :white_check_mark: | gi        | 마지막 변경이 끝날 때 삽입                                      |
| :white_check_mark: | :1234: o  | 현재 줄 아래에 새 줄을 열고 텍스트를 추가하십시오 (N 번)          |
| :white_check_mark: | :1234: O  | 현재 줄 위에 새 줄을 열고 텍스트를 추가하십시오 (N 번)            |

비주얼 블록 모드에서:

| Status             | Command | Description                                             |
| ------------------ | ------- | ------------------------------------------------------- |
| :white_check_mark: | I       | 선택한 모든 줄 앞에 같은 텍스트를 삽입                     |
| :white_check_mark: | A       | 선택한 모든 줄 다음에 같은 텍스트를 추가하십시오            |

## 모드 키 삽입

삽입 모드 종료:

| Status             | Command          | Description                                 |
| ------------------ | ---------------- | ------------------------------------------- |
| :white_check_mark: | Esc              | 삽입 모드 종료, 다시 일반 모드                |
| :white_check_mark: | CTRL-C           | Esc와 같지만 약어를 사용하지 않습니다          |
| :white_check_mark: | CTRL-O {command} | {command}를 실행하고 삽입 모드로 돌아갑니다    |

이동:

| Status             | Command          | Description                             |
| ------------------ | ---------------- | --------------------------------------- |
| :white_check_mark: | cursor keys      | 커서를 왼쪽/오른쪽/위/아래로 이동          |
| :white_check_mark: | shift-left/right | 한 단어 왼쪽/오른쪽                       |
| :white_check_mark: | shift-up/down    | 한 화면 뒤로/앞으로                       |
| :white_check_mark: | End              | 줄의 마지막 문자 다음에 커서              |
| :white_check_mark: | Home             | 줄의 첫 문자에 커서                      |

## 삽입 모드의 특수 키

| Status                    | Command                      | Description                                                        | Note                                                                                                                   |
| ------------------------- | ---------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| :arrow_down:              | CTRL-V {char}..              | 문자를 문자 그대로 삽입하거나 10 진수 바이트 값을 입력하십시오.         |
| :warning:                 | NL or CR or CTRL-M or CTRL-J | 새 줄을 시작하다                                                    | CTRL-M 및 CTRL-J는 지원되지 않습니다                                                                                    |
| :white_check_mark:        | CTRL-E                       | 커서 아래에서 문자를 삽입                                            |
| :white_check_mark:        | CTRL-Y                       | 커서 위에서 문자를 삽입                                              |
| :white_check_mark: :star: | CTRL-A                       | 이전에 삽입 한 텍스트 삽입                                           | 이전 삽입 세션에서 작성된 이전 문서 변경 사항을 적용하고 커서 아래에서 발생하는 변경 사항 만 적용합니다                        |
| :white_check_mark: :star: | CTRL-@                       | 이전에 삽입 한 텍스트 삽입 및 삽입 모드 중지                          | 위와 같음                                                                                                               |
| :white_check_mark:        | CTRL-R {0-9a-z%#:.-="}       | 레지스터의 내용을 삽입                                               |
| :white_check_mark:        | CTRL-N                       | 커서 앞에 식별자의 다음 일치를 삽입                                   |
| :white_check_mark:        | CTRL-P                       | 커서 앞에 식별자의 이전 일치를 삽입                                   |
| :arrow_down:              | CTRL-X ...                   | 다양한 방법으로 커서 앞에있는 단어를 완성하십시오                      |
| :white_check_mark:        | BS or CTRL-H                 | 커서 앞의 문자를 삭제                                                |
| :white_check_mark:        | Del                          | 커서 아래의 문자를 삭제                                              |
| :white_check_mark:        | CTRL-W                       | 커서 앞의 단어를 삭제                                                |
| :white_check_mark:        | CTRL-U                       | 현재 줄에 입력한 모든 문자를 삭제                                    |
| :white_check_mark:        | CTRL-T                       | 현재 줄 앞에 한 개의 들여 쓰기 폭을 삽입                              |
| :white_check_mark:        | CTRL-D                       | 현재 줄 앞에 들여 쓰기 한 이동 폭 삭제                                |
| :arrow_down:              | 0 CTRL-D                     | 현재 줄의 들여 쓰기를 모두 삭제하십시오.                              |
| :arrow_down:              | ^ CTRL-D                     | 현재 줄에서 들여 쓰기를 모두 삭제하고 다음 줄 들여 쓰기를 복원          |

## Di그래프

| Status             | Command                                 | Description                   |
| ------------------ | --------------------------------------- | ----------------------------- |
| :white_check_mark: | :dig[raphs]                             | di그래프의 현재 목록 표시       |
| :arrow_down:       | :dig[raphs] {char1}{char2} {number} ... | 목록에 digraph(s) 추가         |

## Special inserts

| Status    | Command       | Description                                              |
| --------- | ------------- | -------------------------------------------------------- |
| :warning: | :r [file]     | 커서 아래에 [file]의 내용을 삽입하십시오.                   |
| :warning: | :r! {command} | 커서 아래에 {command}의 표준 출력을 삽입하십시오.           |

## 텍스트 삭제

| Status             | Command          | Description                                        |
| ------------------ | ---------------- | -------------------------------------------------- |
| :white_check_mark: | :1234: x         | 커서 아래 및 뒤에 N 문자를 삭제 하십시오.             |
| :white_check_mark: | :1234: Del       | 커서 아래 및 뒤에 N 문자를 삭제 하십시오.             |
| :white_check_mark: | :1234: X         | 커서 앞의 N 문자를 삭제 하십시오.                    |
| :white_check_mark: | :1234: d{motion} | {motion}으로 이동한 텍스트를 삭제하십시오.            |
| :white_check_mark: | {visual}d        | 강조 표시된 텍스트를 삭제                            |
| :white_check_mark: | :1234: dd        | N 줄을 삭제                                         |
| :white_check_mark: | :1234: D         | 줄 끝까지 삭제 (및 N-1 줄 더)                        |
| :white_check_mark: | :1234: J         | N-1 라인 가입 (EOL 삭제)                            |
| :white_check_mark: | {visual}J        | 강조 표시된 라인에 참여                              |
| :white_check_mark: | :1234: gJ        | "J"와 같지만 공백을 삽입하지 않음                    |
| :white_check_mark: | {visual}gJ       | "{visual} J"와 같지만 공백을 삽입하지 않음           |
| :white_check_mark: | :[range]d [x]    | [범위] 줄 삭제 [등록 x]                             |

## 텍스트 복사 및 이동

| Status             | Command          | Description                                            |
| ------------------ | ---------------- | ------------------------------------------------------ |
| :white_check_mark: | "{char}          | use register {char} for the next delete, yank, or put  |
| :white_check_mark: | "\*              | use register `*` to access system clipboard            |
| :white_check_mark: | :reg             | show the contents of all registers                     |
| :white_check_mark: | :reg {arg}       | show the contents of registers mentioned in {arg}      |
| :white_check_mark: | :1234: y{motion} | yank the text moved over with {motion} into a register |
| :white_check_mark: | {visual}y        | yank the highlighted text into a register              |
| :white_check_mark: | :1234: yy        | yank N lines into a register                           |
| :white_check_mark: | :1234: Y         | yank N lines into a register                           |
| :white_check_mark: | :1234: p         | put a register after the cursor position (N times)     |
| :white_check_mark: | :1234: P         | put a register before the cursor position (N times)    |
| :white_check_mark: | :1234: ]p        | like p, but adjust indent to current line              |
| :white_check_mark: | :1234: [p        | like P, but adjust indent to current line              |
| :white_check_mark: | :1234: gp        | like p, but leave cursor after the new text            |
| :white_check_mark: | :1234: gP        | like P, but leave cursor after the new text            |

## 텍스트 변경

| Status                    | Command         | Description                                                                                       | Note                     |
| ------------------------- | --------------- | ------------------------------------------------------------------------------------------------- | ------------------------ |
| :white_check_mark:        | :1234: r{char}  | N 문자를 {char}로 바꾸십시오                                                                       |
| :arrow_down:              | :1234: gr{char} | 레이아웃에 영향을주지 않고 N 문자를 교체                                                             |
| :white_check_mark: :star: | :1234: R        | 바꾸기 모드로 들어가십시오 (입력 한 텍스트를 N 번 반복하십시오)                                        | {count} is not supported |
| :arrow_down:              | :1234: gR       | 가상 교체 모드로 전환 : 대체 모드와 유사하지만 레이아웃에 영향을 미치지 않음                            |
| :white_check_mark:        | {visual}r{char} | 비주얼 블록, 비주얼 또는 비주얼 라인 모드에서 : 선택한 텍스트의 각 문자를 {char}로 바꿉니다.            |

(변경 = 텍스트 삭제 및 삽입 모드 입력)

| Status             | Command                 | Description                                                                                     |
| ------------------ | ----------------------- | ----------------------------------------------------------------------------------------------- |
| :white_check_mark: | :1234: c{motion}        | {motion}으로 이동 한 텍스트를 변경하십시오.                                                         |
| :white_check_mark: | {visual}c               | 강조 표시된 텍스트를 변경                                                                        |
| :white_check_mark: | :1234: cc               | N줄 바꾸기                                                                                      |
| :white_check_mark: | :1234: S                | N줄 바꾸기                                                                                      |
| :white_check_mark: | :1234: C                | 줄의 끝으로 변경 (및 N-1 더 많은 줄)                                                              |
| :white_check_mark: | :1234: s                | N 문자를 바꾸다                                                                                  |
| :white_check_mark: | {visual}c               | 비주얼 블록 모드에서 : 입력 한 텍스트로 선택한 각 줄을 변경합니다                                    |
| :white_check_mark: | {visual}C               | 비주얼 블록 모드에서 : 입력 한 텍스트로 줄 끝까지 선택된 각 줄을 변경합니다.                          |
| :white_check_mark: | {visual}~               | 강조 표시된 텍스트의 경우 전환                                                                    |
| :white_check_mark: | {visual}u               | 강조 표시된 텍스트를 소문자로 설정                                                                 |
| :white_check_mark: | {visual}U               | 강조 표시된 텍스트를 대문자로 만듭니다.                                                             |
| :white_check_mark: | g~{motion}              | {motion}으로 이동 한 텍스트의 대소 문자 전환                                                      |
| :white_check_mark: | gu{motion}              | {motion}으로 옮긴 텍스트를 소문자로 만듭니다.                                                      |
| :white_check_mark: | gU{motion}              | {motion}으로 이동 한 텍스트를 대문자로 만듭니다.                                                  |
| :arrow_down:       | {visual}g?              | 강조 표시된 텍스트에서 rot13 인코딩 수행                                                          |
| :arrow_down:       | g?{motion}              | {motion}으로 이동 한 텍스트에서 rot13 인코딩 수행                                                  |
| :white_check_mark: | :1234: CTRL-A           | 커서 위 또는 뒤에있는 숫자에 N을 더하다                                                            |
| :white_check_mark: | :1234: CTRL-X           | 커서에서 또는 뒤에있는 숫자에서 N을 빼기                                                          |
| :white_check_mark: | :1234: <{motion}        | {motion}으로 이동 한 줄을 한 이동 폭 왼쪽으로 이동                                                |
| :white_check_mark: | :1234: <<               | N 라인을 한 이동 폭만큼 왼쪽으로 이동                                                              |
| :white_check_mark: | :1234: >{motion}        | {motion}으로 이동 한 선을 한 이동 폭만큼 오른쪽으로 이동                                            |
| :white_check_mark: | :1234: >>               | N 라인을 한 이동 폭만큼 오른쪽으로 이동                                                            |
| :white_check_mark: | :1234: gq{motion}       | {motion}으로 이동 한 행을 'textwidth'길이로 형식화                                                |
| :arrow_down:       | :[range]ce[nter][width] | [range]에서 선 중심                                                                              |
| :arrow_down:       | :[range]le[ft][indent]  | [range]에서 줄을 왼쪽 정렬합니다  ([indent] 포함)                                                 |
| :arrow_down:       | :[ranee]ri[ght][width]  | [range]에서 선을 오른쪽 정렬합니다                                                                |

## 복잡한 변화

| Status                              | Command                                        | Description                                                                                                                           | Note                                                                             |
| ----------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| :arrow_down:                        | :1234: `!{motion}{command}<CR>`                | {command}를 통해 이동 한 행을 필터링                                                                                                        |
| :arrow_down:                        | :1234: `!!{command}<CR>`                       | {command}를 통해 N 라인 필터링                                                                                                            |
| :arrow_down:                        | `{visual}!{command}<CR>`                       | {command}를 통해 강조 표시된 줄을 필터링하십시오.                                                                                          |
| :arrow_down:                        | `:[range]! {command}<CR>`                      | {command}를 통해 [range] 라인 필터링                                                                                                      |
| :white_check_mark:                  | :1234: ={motion}                               | 'equalprg'를 통해 이동 한 라인을 필터링 through 'equalprg'                                                                               |
| :white_check_mark:                  | :1234: ==                                      | 'equalprg'를 통해 N 라인 필터링                                                                                                          |
| :white_check_mark:                  | {visual}=                                      | 'equalprg'를 통해 강조 표시된 줄을 필터링하십시오.                                                                                        |
| :white_check_mark: :star: :warning: | :[range]s[ubstitute]/{pattern}/{string}/[g][c] | [range] 행에서 {string}으로 {pattern}을 대체하십시오. [g]로, 모든 {pattern}을 대체하십시오. [c]로 각 교체 확인 | 현재는 JavaScript 정규식 만 지원하며 gi 옵션 만 구현됩니다.                                           |
| :arrow_down:                        | :[range]s[ubstitute][g][c]                     | 새로운 범위와 옵션으로 이전 ": s"반복                                                                                                   |
| :arrow_down:                        | &                                              | 옵션없이 현재 줄에서 이전 ": s"반복                                                                                                      |
| :arrow_down:                        | :[range]ret[ab][!] [tabstop]                   | 'tabstop'을 새 값으로 설정하고 그에 따라 공백을 조정하십시오.                                                                              |

## 비주얼 모드

| Status             | Command | Description                                         |
| ------------------ | ------- | --------------------------------------------------- |
| :white_check_mark: | v       | 문자 강조 표시 시작 또는 강조 표시 중지                |
| :white_check_mark: | V       | 선으로 강조 표시 시작 또는 강조 표시 중지              |
| :white_check_mark: | CTRL-V  | 블록 단위로 강조 표시 시작 또는 강조 표시 중지         |
| :white_check_mark: | o       | 강조 표시 시작으로 커서 위치 교환                     |
| :white_check_mark: | gv      | 이전 시각적 영역에서 강조 표시 시작                   |

## 텍스트 객체 (비주얼 모드에서만 또는 연산자 뒤)

| Status             | Command                                           | Description                                                 |
| ------------------ | ------------------------------------------------- | ----------------------------------------------------------- |
| :white_check_mark: | :1234: aw                                         | "a word"를 선택하십시오.                                     |
| :white_check_mark: | :1234: iw                                         | "inner word"를 선택하십시오.                                 |
| :white_check_mark: | :1234: aW                                         | "a WORD"를 선택하십시오.                                     |
| :white_check_mark: | :1234: iW                                         | "inner WORD"를 선택하십시오.                                 |
| :white_check_mark: | :1234: as                                         | "a sentence"를 선택하십시오.                                 |
| :white_check_mark: | :1234: is                                         | "inner sentence"를 선택하십시오.                             |
| :white_check_mark: | :1234: ap                                         | "a paragraph"를 선택하십시오.                                 |
| :white_check_mark: | :1234: ip                                         | "inner paragraph"를 선택하십시오.                             |
| :white_check_mark: | :1234: a], a[                                     | '[' ']'블록을 선택하십시오                                     |
| :white_check_mark: | :1234: i], i[                                     | 내부 '[' ']'블록을 선택하십시오.                               |
| :white_check_mark: | :1234: ab, a(, a)                                 | "a block"을 선택하십시오. ("[("에서 "])"까지)                 |
| :white_check_mark: | :1234: ib, i), i(                                 | "inner block"을 선택하십시오. ("[("에서 "])"까지)             |
| :white_check_mark: | :1234: a>, a<                                     | "a &lt;&gt; block"을 선택하십시오.                           |
| :white_check_mark: | :1234: i>, i<                                     | "inner <> block"을 선택하십시오.                             |
| :white_check_mark: | :1234: aB, a{, a}                                 | "a Block"을 선택하십시오. ("[{"에서 "]}"까지)                 |
| :white_check_mark: | :1234: iB, i{, i}                                 | "inner Block"을 ("[{"에서 "]}"까지)                           |
| :white_check_mark: | :1234: at                                         | "a tag block"을 선택하십시오. (&lt;aaa&gt;에서 &lt;/aaa&gt;까지)    |
| :white_check_mark: | :1234: it                                         | "inner tag block"을 선택하십시오. (&lt;aaa&gt;에서 &lt;/aaa&gt;까지)    |
| :white_check_mark: | :1234: a'                                         | "a single quoted string"을 선택하십시오.                     |
| :white_check_mark: | :1234: i'                                         | "inner single quoted string"을 선택하십시오.                 |
| :white_check_mark: | :1234: a"                                         | "a double quoted string"을 선택하십시오.                     |
| :white_check_mark: | :1234: i"                                         | "inner double quoted string"을 선택하십시오.                 |
| :white_check_mark: | :1234: a` | "a backward quoted string"을 선택하십시오.    |
| :white_check_mark: | :1234: i` | "inner backward quoted string"을 선택하십시오.|

## 반복 명령

| Status                    | Command                           | Description                                                                                        | Note                                                                |
| ------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| :white_check_mark: :star: | :1234: .                          | 마지막 변경을 반복합니다 (N으로 개수를 대체)                                                    | 커서 아래에서 발생하지 않는 내용 변경은 반복 할 수 없습니다.             |
| :white_check_mark:        | q{a-z}                            | 입력 된 문자를 레지스터 {a-z}에 기록                                                                |
| :arrow_down:              | q{A-Z}                            | {a-z} 등록을 위해 추가 된 레코드 유형 문자                                                            |
| :white_check_mark:        | q                                 | 녹화 중지                                                                                          |
| :white_check_mark:        | :1234: @{a-z}                     | 레지스터 {a-z}의 내용을 실행합니다 (N 회)                                                            |
| :white_check_mark:        | :1234: @@                         | 이전 @ {a-z} 반복 (N 회)                                                                            |
| :arrow_down:              | :@{a-z}                           | 레지스터 {a-z}의 내용을 Ex 명령으로 실행                                                            |
| :arrow_down:              | :@@                               | 이전 반복 : @ {a-z}                                                                                |
| :arrow_down:              | :[range]g[lobal]/{pattern}/[cmd]  | execute Ex command [cmd](default: ':p') on the lines within [range] where {pattern} matches        |
| :arrow_down:              | :[range]g[lobal]!/{pattern}/[cmd] | execute Ex command [cmd](default: ':p') on the lines within [range] where {pattern} does NOT match |
| :arrow_down:              | :so[urce] {file}                  | {file}에서 EX  명령을 읽습니다.                                                                       |
| :arrow_down:              | :so[urce]! {file}                 | {file}에서 Vim 명령을 읽습니다.                                                                      |
| :arrow_down:              | :sl[eep][sec]                     | [sec] 초 동안 아무 것도하지 마십시오                                                                  |
| :arrow_down:              | :1234: gs                         | N 초 동안 절전 모드로 전환                                                                           |

## 옵션

| Status                    | Command                  | Description                                                                                                       | Note                                 |
| ------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| :arrow_down:              | :se[t]                   | 수정 된 모든 옵션 표시                                                                                              |
| :arrow_down:              | :se[t] all               | 모든 non-termcap 옵션을 표시                                                                                       |
| :arrow_down:              | :se[t] termcap           | 모든 termcap 옵션을 표시                                                                                           |
| :white_check_mark:        | :se[t] {option}          | set boolean option (switch it on), 문자열 또는 숫자 옵션 표시                                                      |
| :white_check_mark:        | :se[t] no{option}        | boolean option 재설정(switch it off)                                                                              |
| :white_check_mark:        | :se[t] inv{option}       | boolean option 반전                                                                                              |
| :white_check_mark:        | :se[t] {option}={value}  | 문자열 / 숫자 옵션을 {value}로 설정                                                                                |
| :white_check_mark:        | :se[t] {option}+={value} | 문자열 옵션에 {value} 추가, 숫자 옵션에 {value} 추가                                                                |
| :white_check_mark: :star: | :se[t] {option}-={value} | 문자열 옵션에서 {value}를 제거하고 숫자 옵션에서 {value}를 뺍니다.                                                    | 여기서는 문자열 옵션을 지원하지 않습니다. |
| :white_check_mark:        | :se[t] {option}?         | {option}의 가치를 보여주십시오.                                                                                    |
| :arrow_down:              | :se[t] {option}&         | {option}을 기본 값으로 재설정                                                                                      |
| :arrow_down:              | :setl[ocal]              | ": set"과 같지만 옵션이있는 옵션의 로컬 값을 설정하십시오.                                                            |
| :arrow_down:              | :setg[lobal]             | ": set"과 같지만 로컬 옵션의 전역 값을 설정하십시오.                                                                |
| :arrow_down:              | :fix[del]                | 't_kb'값에 따른 't_kD'값 설정                                                                                      |
| :arrow_down:              | :opt[ions]               | 기능별로 분류 된 옵션, 한 줄 설명 및 도움말 링크를 보려면 새 창을 엽니 다. |

목록이 너무 길기 때문에 이미 지원되는 옵션을 여기에 넣습니다.

| Status             | Command         | Default Value                                                   | Description                                                                                                                                |
| ------------------ | --------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| :white_check_mark: | tabstop (ts)    | 4. we use Code's default value `tabSize` instead of Vim         | 파일의 &lt;Tab&gt;이 사용하는 공백 수                                                                                            |
| :white_check_mark: | hlsearch (hls)  | false                                                           | 이전 검색 패턴이 있으면 일치하는 항목을 모두 강조 표시하십시오.                                                                                 |
| :white_check_mark: | ignorecase (ic) | true                                                            | 검색 패턴에서 대소 문자를 무시하십시오.                                                                                                       |
| :white_check_mark: | smartcase (scs) | true                                                            | 검색 패턴에 대문자가 포함 된 경우 'ignorecase'옵션을 대체하십시오.                                                                              |
| :white_check_mark: | iskeyword (isk) | `@,48-57,_,128-167,224-235`                                     | 키워드는 영숫자와 '\ _'를 포함합니다. `iskeyword`에 대한 사용자 설정이 없으면`editor.wordSeparators` 속성을 사용합니다.                         |
| :white_check_mark: | scroll (scr)    | 20                                                              | CTRL-U 및 CTRL-D 명령으로 스크롤 할 행의 수입니다.                                                                                             |
| :white_check_mark: | expandtab (et)  | True. we use Code's default value `insertSpaces` instead of Vim |  &lt;Tab&gt;을 삽입 할 때 공백을 사용하십시오.                                                                                                 |
| :white_check_mark: | autoindent      | true                                                            | 정상 모드에서`cc` 또는`S`를 수행 할 때 들여 쓰기를 유지하여 줄을 바꿉니다.                                                                     |

## 실행 취소 / 재실행 명령

| Status             | Command       | Description                | Note                                                       |
| ------------------ | ------------- | -------------------------- | ---------------------------------------------------------- |
| :white_check_mark: | :1234: u      | undo last N changes        | 현재 구현이 모든 경우를 완벽하게 다루지는 않을 수 있습니다.    |
| :white_check_mark: | :1234: CTRL-R | redo last N undone changes | 위와 같음                                                   |
| :white_check_mark: | U             | restore last changed line  |

## 외부 명령

| Status       | Command     | Description                                                                |
| ------------ | ----------- | -------------------------------------------------------------------------- |
| :arrow_down: | :sh[ell]    | shell을 시작하다                                                            |
| :arrow_down: | :!{command} | shell로 {command}를 실행                                                    |
| :arrow_down: | K           | 'keywordprg'프로그램이있는 커서 아래의 검색 키워드 (기본값 : "man")            |

## 전 번호

| Status                    | Command       | Description                                                                  | Note                                 |
| ------------------------- | ------------- | ---------------------------------------------------------------------------- | ------------------------------------ |
| :white_check_mark:        | ,             | 두 줄 번호를 구분                                                             |
| :white_check_mark: :star: | ;             | idem, 두 번째 행을 해석하기 전에 커서를 첫 번째 행 번호로 설정하십시오. 커서 이동은 포함되지 않습니다.               |
| :white_check_mark:        | {number}      | 절대적인 line number                                                          |
| :white_check_mark:        | .             | 현재 줄                                                                       |
| :white_check_mark:        | \$            | 파일의 마지막 줄                                                              |
| :white_check_mark:        | %             | 1,\$와 같음 (전체 파일)                                                       |
| :white_check_mark:        | \*            | '<,'>은 같음(시작적 영역)                                                      |
| :white_check_mark:        | 't            | mark t의 위치                                                                 |
| :arrow_down:              | /{pattern}[/] | {pattern}이 일치하는 다음 줄                                                   |
| :arrow_down:              | ?{pattern}[?] | {pattern}이 일치하는 이전 줄                                                   |
| :white_check_mark:        | +[num]        | 앞 줄 번호에 [num]을 추가하십시오 (기본값 : 1).                                 |
| :white_check_mark:        | -[num]        | 이전 줄 번호에서 [num]을 뺍니다 (기본값 : 1).                                   |

## 파일 편집

| Status                    | Command        | Description  | Note                                                                                        |
| ------------------------- | -------------- | ------------ | ------------------------------------------------------------------------------------------- |
| :white_check_mark: :star: | :e[dit] {file} | Edit {file}. |현재 탭에서 열지 않고 현재 그룹화 된 편집기의 새 탭에서 파일을 엽니 다. |

## Multi-window 명령

| Status                    | Command           | Description                                                             | Note                                                                                                                   |
| ------------------------- | ----------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| :white_check_mark: :star: | :e[dit] {file}    | {file}을 편집하십시오.                                                   | 현재 탭에서 열지 않고 현재 그룹화 된 편집기의 새 탭에서 파일을 엽니 다.                                                       |
| :white_check_mark: :star: | &lt;ctrl-w&gt; hl | 창 사이를 전환합니다.                                                    | VS Code에는 Window라는 개념이 없으므로 이러한 명령을 그룹화 된 편집기 간 전환에 매핑합니다.                               |
| :white_check_mark:        | :sp {file}        | 현재 창을 두개로 나눕니다.                                                |                                                                                                                        |
| :white_check_mark: :star: | :vsp {file}       | 세로로 현재 창을 두 개로 나눕니다.                                        |                                                                                                                        |
| :white_check_mark:        | &lt;ctrl-w&gt; s  | 현재 창을 두개로 나눕니다.                                                |                                                                                                                        |
| :white_check_mark: :star: | &lt;ctrl-w&gt; v  | 세로로 현재 창을 두 개로 나눕니다.                                        |                                                                                                                        |
| :white_check_mark:        | :new              | 새 창을 가로로 만들고 빈 파일 편집을 시작하십시오.                         |                                                                                                                        |
| :white_check_mark: :star: | :vne[w]           | 새 창을 세로로 만들고 빈 파일 편집을 시작하십시오.                         |                                                                                                                        |

## 탭

| Status                    | Command                              | Description                                                                   | Note                                                               |
| ------------------------- | ------------------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| :white_check_mark:        | :tabn[ext] :1234:                    | 다음 탭 페이지 또는 탭 페이지 {count}로 이동하십시오. 첫 번째 탭 페이지는 1 번입니다. |
| :white_check_mark:        | {count}&lt;C-PageDown&gt;, {count}gt | 위와 동일                                                                       |
| :white_check_mark:        | :tabp[revious] :1234:                | 이전 탭 페이지로 이동하십시오. 첫 번째부터 마지막까지 감싸줍니다.                   |
| :white_check_mark:        | :tabN[ext] :1234:                    | 위와 동일                                                                       |
| :white_check_mark:        | {count}&lt;C-PageUp&gt;, {count}gT   | 위와 동일                                                                       |
| :white_check_mark:        | :tabfir[st]                          | 첫 번째 탭 페이지로 이동하십시오.                                               |
| :white_check_mark:        | :tabl[ast]                           | 마지막 탭 페이지로 이동하십시오.                                                 |
| :white_check_mark:        | :tabe[dit] {file}                    | 현재 탭 페이지 다음에 빈 창이있는 새 탭 페이지를 엽니 다.                         |
| :arrow_down:              | :[count]tabe[dit], :[count]tabnew    | 위와 동일                                                                       | [count] 는 지원되지 않습니다.                                           |
| :white_check_mark:        | :tabnew {file}                       | 현재 탭 페이지 다음에 빈 창이있는 새 탭 페이지를 엽니 다.                         |
| :arrow_down:              | :[count]tab {cmd}                    | {cmd}를 실행하고 새 창이 열리면 대신 새 탭 페이지를여십시오.                       |
| :white_check_mark: :star: | :tabc[lose][!] :1234:                | 현재 탭 페이지를 닫거나 탭 페이지 {count}를 닫습니다.                              | 코드는 저장하지 않고 탭을 직접 닫습니다.                            |
| :white_check_mark: :star: | :tabo[nly][!]                        | 다른 모든 탭 페이지를 닫습니다.                                                   | `!`는 지원되지 않으며, 코드는 저장하지 않고 탭을 직접 닫습니다.     |
| :white_check_mark:        | :tabm[ove][n]                        | 현재 탭 페이지를 탭 페이지 N 이후로 이동하십시오.                                 |
| :arrow_down:              | :tabs                                | 탭 페이지와 포함 된 창을 나열하십시오.                                   | 항상 코드의 내장 단축키를 사용할 수 있습니다 :`cmd / ctrl + p`          |
| :arrow_down:              | :tabd[o] {cmd}                       | 각 탭 페이지에서 {cmd}를 실행하십시오.                                              |

## Folding

### Fold methods

folding 방법은 'foldmethod' 옵션으로 설정할 수 있습니다. 현재 Code's Fold logic에 의존하고 있기 때문에 불가능합니다.

### Fold 명령

모든 fold-related가 [this issue](https://github.com/VSCodeVim/Vim/issues/1004)에 의해 차단되었습니다.

| Status             | Command                  | Description                                                                                                  |
| ------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| :arrow_down:       | zf{motion} or {Visual}zf | fold를 만드는 연산자입니다.                                                                                    |
| :arrow_down:       | zF                       | [count] 줄의 fold를 만듭니다. "zf"처럼 작동합니다.                                                            |
| :arrow_down:       | zd                       | 커서에서 하나의 fold를 삭제하십시오.                                                                           |
| :arrow_down:       | zD                       | 커서에서 fold를 재귀적으로 삭제합니다.                                                                           |
| :arrow_down:       | zE                       | 창의 모든 fold를 제거하십시오.                                                                                |
| :white_check_mark: | zo                       | 커서 아래에 하나의 fold를 엽니다. 카운트가 주어지면 그 많은 폴드가 열립니다.                   |
| :white_check_mark: | zO                       | 커서 아래의 모든 fold를 재귀적으로 엽니다.                                                                      |
| :white_check_mark: | zc                       | 커서 아래에서 한 개의 fold를 닫습니다. 카운트가 주어지면 깊은 곳의 많은 folds가 닫힙니다.                        |
| :white_check_mark: | zC                       | 커서 아래의 모든fold를 재귀적으로 닫습니다.                                                                    |
| :white_check_mark: | za                       | 닫힌 fold에있을 때 : 여십시오. 열린 fold시 : 닫고 '접을 수 있음'을 설정하십시오.                                  |
| :arrow_down:       | zA                       | 열린 fold에 있을 때: 재귀적으로 엽니다. 닫힌 fold에 있을 때 : 재귀적으로 닫고  'foldenable'을 설정하십시오. |
| :arrow_down:       | zv                       | View cursor line: 라인을 만들기에 충분한 fold를 엽니다.                                                        |
| :arrow_down:       | zx                       | 'foldlevel'을 다시 적용한 다음 "zv"를 수행하십시오. 커서 행을보십시오.                                          |
| :arrow_down:       | zX                       | Update folds : 수동으로 열리고 닫힌 fold를 취소합니다. 'foldlevel'을 다시 적용한 다음 "zv"를 수행하십시오. 커서 행을보십시오.                                                   |
| :arrow_down:       | zm                       | Fold more : 'foldlevel'에서 하나를 빼십시오.                                                                   |
| :white_check_mark: | zM                       | Close all folds  : 'foldlevel'을 0으로 설정하십시오. 'foldenable'이 설정됩니다.                                  |
| :arrow_down:       | zr                       | Reduce folding : '폴더'에 하나를 추가하십시오.                                                                   |
| :white_check_mark: | zR                       | Open all fold. 'foldlevel'을 가장 높은 접기 수준으로 설정합니다.                                             |
| :arrow_down:       | zn                       | Fold none : 'foldenable'을 재설정하십시오. 모든 주름이 열립니다.                                                 |
| :arrow_down:       | zN                       | Fold normal : 'foldenable'을 설정하십시오. 모든 주름은 이전과 동일합니다.                                         |
| :arrow_down:       | zi                       | 'foldenable'을 반전시킵니다.                                                                                  |
| :arrow_down:       | [z                       | 현재 열린 fold 시작으로 이동합니다.                                                                            |
| :arrow_down:       | ]z                       | 현재 열린 fold의 끝으로 이동합니다.                                                                            |
| :arrow_down:       | zj                       | 다음 fold의 시작 부분으로 아래로 이동하십시오.                                                                  |
| :arrow_down:       | zk                       | 이전 fold의 끝으로 위로 이동하십시오.                                                                          |

### Fold 옵션

현재 fold option을 지원하지 않으며 코드 구성을 따르고 있습니다.
