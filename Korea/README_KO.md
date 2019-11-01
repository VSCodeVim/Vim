<h2 align="center"><img src="https://raw.githubusercontent.com/VSCodeVim/Vim/master/images/icon.png" height="128"><br>VSCodeVim</h2>
<p align="center"><strong>Visual Studio code를 위한 Vim emulation</strong></p>

[![http://aka.ms/vscodevim](https://vsmarketplacebadge.apphb.com/version/vscodevim.vim.svg)](http://aka.ms/vscodevim)
[![](https://vsmarketplacebadge.apphb.com/installs-short/vscodevim.vim.svg)](https://marketplace.visualstudio.com/items?itemName=vscodevim.vim)
[![https://travis-ci.org/VSCodeVim/Vim](https://travis-ci.org/VSCodeVim/Vim.svg?branch=master)](https://travis-ci.org/VSCodeVim/Vim)
[![https://vscodevim.herokuapp.com/](https://img.shields.io/badge/vscodevim-slack-blue.svg?logo=slack)](https://vscodevim.herokuapp.com/)

VSCodeVim은  [Visual Studio Code](https://code.visualstudio.com/)를 위한 Vim emulation입니다.

- 🚚 지원되는 Vim 기능의 전체 목록은 [로드맵]을 참조하십시오.(ROADMAP.md).
- 📃 [변경된 로그](CHANGELOG.md)에는 릴리스 간 주요 / 주요 / 최소 업데이트가 요약되어 있습니다.
- ❓ 궁금한 점이 있으면 [Slack](https://vscodevim.herokuapp.com/)에서 우리와 함께하십시오.
- [GitHub](https://github.com/VSCodeVim/Vim/issues)에서 누락 된 기능 / 버그를보고하십시오.

<details>
 <summary><strong>목차</strong> (클릭하여 확장)</summary>

- [Installation](#-installation)
  - [Mac setup](#mac)
  - [Windows setup](#windows)
  - [Linux setup](#linux-setup)
- [Settings](#%EF%B8%8F-settings)
  - [VSCodeVim settings](#vscodevim-settings)
  - [Neovim Integration](#neovim-integration)
  - [Key remapping](#key-remapping)
  - [Vim settings](#vim-settings)
- [Multi-Cursor mode](#%EF%B8%8F-multi-cursor-mode)
- [Emulated plugins](#-emulated-plugins)
  - [vim-airline](#vim-airline)
  - [vim-easymotion](#vim-easymotion)
  - [vim-surround](#vim-surround)
  - [vim-commentary](#vim-commentary)
  - [vim-indent-object](#vim-indent-object)
  - [vim-sneak](#vim-sneak)
  - [CamelCaseMotion](#camelcasemotion)
  - [Input Method](#input-method)
  - [ReplaceWithRegister](#replacewithregister)
- [VSCodeVim tricks](#-vscodevim-tricks)
- [F.A.Q / Troubleshooting](#-faq)
- [Contributing](#️-contributing)

</details>

## 💾 설치

VSCodeVim은 VS Code를  [설치](https://marketplace.visualstudio.com/items?itemName=vscodevim.vim) 하고 다시로드 한 후에 자동으로 활성화됩니다.

> :warning: Vimscript는 지원되지 않습니다. 따라서 `.vimrc`를로드하거나 `.vim` vim 플러그인을 사용할 수 없습니다. [설정](#settings)과 [Emulated plugins](#-emulated-plugins)을 사용하여 이것을 복제해야합니다.

### Mac

키 반복을 활성화하려면 터미널에서 다음을 실행하고 VS 코드를 다시 시작하십시오:

```sh
$ defaults write com.microsoft.VSCode ApplePressAndHoldEnabled -bool false         # VS Code를 위해
$ defaults write com.microsoft.VSCodeInsiders ApplePressAndHoldEnabled -bool false # VS Code Insider를 위해
$ defaults delete -g ApplePressAndHoldEnabled                                      # 필요하면, global default값을 재설정 하세요
```

시스템 환경 설정-> 키보드에서 키 반복 및 지연 될 때까지 지연 설정을 높이는 것이 좋습니다.

### Windows

실제 vim과 마찬가지로 VSCodeVim은 제어 키를 대신합니다. 이 동작은 [`useCtrlKeys`](#vscodevim-settings)과 [`handleKeys`](#vscodevim-settings) 설정으로 조정할 수 있습니다.

## ⚙️ 설정

여기에 설명 된 설정은 지원되는 설정의 일부입니다. 전체 목록은 VS Code의 확장 메뉴에있는 `기여` 탭에 설명되어 있습니다.

### 빠른 예시

아래는 VSCodeVim과 관련된 설정이있는 [settings.json](https://code.visualstudio.com/Docs/customization/userandworkspace) 파일의 예입니다:

```json
{
  "vim.easymotion": true,
  "vim.sneak": true,
  "vim.incsearch": true,
  "vim.useSystemClipboard": true,
  "vim.useCtrlKeys": true,
  "vim.hlsearch": true,
  "vim.insertModeKeyBindings": [
    {
      "before": ["j", "j"],
      "after": ["<Esc>"]
    }
  ],
  "vim.normalModeKeyBindingsNonRecursive": [
    {
      "before": ["<leader>", "d"],
      "after": ["d", "d"]
    },
    {
      "before": ["<C-n>"],
      "commands": [":nohl"]
    }
  ],
  "vim.leader": "<space>",
  "vim.handleKeys": {
    "<C-a>": false,
    "<C-f>": false
  }
}
```

### VSCodeVim 설정

이 설정은 VSCodeVim에만 적용됩니다.

| 셋팅                          | 설명                                                                                                                                                                                                                                                                                                                                                                                                                      | 타입    | 기본값                         |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------- |
| vim.changeWordIncludesWhitespace | Include trailing whitespace when changing word. This configures the <kbd>cw</kbd> action to act consistently as its siblings (<kbd>yw</kbd> and <kbd>dw</kbd>) instead of acting as <kbd>ce</kbd>.                                                                                                                                                                                                                               | Boolean | false                                 |
| vim.cursorStylePerMode._{Mode}_  | Configure a specific cursor style for _{Mode}_. Omitted modes will use [default cursor type](https://github.com/VSCodeVim/Vim/blob/4a6fde6dbd4d1fac1f204c0dc27c32883651ef1a/src/mode/mode.ts#L34) Supported cursors: line, block, underline, line-thin, block-outline, and underline-thin.                                                                                                                                       | String  | None                                  |
| vim.digraphs._{shorthand}_       | Set custom digraph shorthands that can override the default ones. Entries should map a two-character shorthand to a descriptive string and one or more UTF16 code points. Example: `"R!": ["🚀", [55357, 56960]]`                                                                                                                                                                                                                | object  | `{"R!": ["🚀", [0xD83D, 0xDE80]]`     |  |
| vim.debug.silent                 | Boolean indicating whether log messages will be suppressed.                                                                                                                                                                                                                                                                                                                                                                      | Boolean | false                                 |
| vim.debug.loggingLevelForConsole | Maximum level of messages to log to console. Logs are visible in the [developer tools](https://code.visualstudio.com/docs/extensions/developing-extensions#_developer-tools-console). Supported values: 'error', 'warn', 'info', 'verbose', 'debug').                                                                                                                                                                            | String  | error                                 |
| vim.debug.loggingLevelForAlert   | Maximum level of messages to present as VS Code information window. Supported values: 'error', 'warn', 'info', 'verbose', 'debug').                                                                                                                                                                                                                                                                                              | String  | error                                 |
| vim.disableExtension             | Disable VSCodeVim extension. This setting can also be toggled using `toggleVim` command in the Command Palette                                                                                                                                                                                                                                                                                                                   | Boolean | false                                 |
| vim.handleKeys                   | Delegate configured keys to be handled by VSCode instead of by the VSCodeVim extension. Any key in `keybindings` section of the [package.json](https://github.com/VSCodeVim/Vim/blob/master/package.json) that has a `vim.use<C-...>` in the when argument can be delegated back to VS Code by setting `"<C-...>": false`. Example: to use `ctrl+f` for find (native VS Code behaviour): `"vim.handleKeys": { "<C-f>": false }`. | String  | `"<C-d>": true`                       |
| vim.overrideCopy                 | Override VS Code's copy command with our own, which works correctly with VSCodeVim. If cmd-c/ctrl-c is giving you issues, set this to false and complain [here](https://github.com/Microsoft/vscode/issues/217).                                                                                                                                                                                                                 | Boolean | false                                 |
| vim.searchHighlightColor         | Set the color of search highlights                                                                                                                                                                                                                                                                                                                                                                                               | String  | `editor.findMatchHighlightBackground` |
| vim.startInInsertMode            | Start in Insert mode instead of Normal Mode                                                                                                                                                                                                                                                                                                                                                                                      | Boolean | false                                 |
| vim.gdefault                     | `/g` flag in a substitute command replaces all occurrences in the line. Without this flag, replacement occurs only for the first occurrence in each line. With this setting enabled, the `g` is on by default.                                                                                                                                                                                                                   | Boolean | false                                 |
| vim.useCtrlKeys                  | Enable Vim ctrl keys overriding common VS Code operations such as copy, paste, find, etc.                                                                                                                                                                                                                                                                                                                                        | Boolean | true                                  |
| vim.visualstar                   | In visual mode, start a search with `*` or `#` using the current selection                                                                                                                                                                                                                                                                                                                                                       | Boolean | false                                 |
| vim.highlightedyank.enable       | Enable highlighting when yanking                                                                                                                                                                                                                                                                                                                                                                                                 | Boolean | false                                 |
| vim.highlightedyank.color        | Set the color of yank highlights                                                                                                                                                                                                                                                                                                                                                                                                 | String  | rgba(250, 240, 170, 0.5)              |
| vim.highlightedyank.duration     | Set the duration of yank highlights                                                                                                                                                                                                                                                                                                                                                                                              | Number  | 200                                   |

### Neovim 통합

> :warning: 실험적인 특징. neovim 통합에 대한 의견을 [여기에](https://github.com/VSCodeVim/Vim/issues/1735)남겨주세요.

Ex-command에 neovim을 활용하려면,

1.  [neovim](https://github.com/neovim/neovim/wiki/Installing-Neovim)을 설치하세요
2. 다음 구성을 수정하세요:

| 환경          | 설명                    | 타입    | 기본 값 |
| ---------------- | ------------------------------ | ------- | ------------- |
| vim.enableNeovim |  Neovim 활성화                  | Boolean | false         |
| vim.neovimPath   | neovim 실행 파일의 전체 경로 | String  |               |

neovim 통합으로 할 수있는 작업에 대한 몇 가지 아이디어가 있습니다:

- [The power of g](http://vim.wikia.com/wiki/Power_of_g)
- [The :normal command](https://vi.stackexchange.com/questions/4418/execute-normal-command-over-range)
- 더 빠른 검색과 교체!

### 키 리매핑(Key Remapping)

커스텀 리매핑은 모드별로 정의됩니다.

#### `"vim.insertModeKeyBindings"`/`"vim.normalModeKeyBindings"`/`"vim.visualModeKeyBindings"`

- 삽입, 일반 및 시각적 모드에 사용하도록 키 바인딩을 재정의합니다.
- 삽입 모드에서 `jj` 를 `<Esc>`에 바인딩하십시오:

```json
    "vim.insertModeKeyBindings": [
        {
            "before": ["j", "j"],
            "after": ["<Esc>"]
        }
    ]
```

- 커서 아래의 이전 전체 단어로 이동하려면 `£` 를 바인딩하십시오.

```json
    "vim.normalModeKeyBindings": [
        {
            "before": ["£"],
            "after": ["#"]
        }
    ]
```

- `:`를 묶어 명령 팔레트를 표시하십시오:

```json
    "vim.normalModeKeyBindingsNonRecursive": [
        {
            "before": [":"],
            "commands": [
                "workbench.action.showCommands",
            ]
        }
    ]
```

- `<leader>m` 을 바인드하여 책갈피를 추가하고 `<leader>b`를 사용하여 모든  [책갈피](https://marketplace.visualstudio.com/items?itemName=alefragnani.Bookmarks) 목록을 여십시오 (북마크 확장자 사용):

```json
    "vim.normalModeKeyBindingsNonRecursive": [
        {
            "before": ["<leader>", "m"],
            "commands": [
                "bookmarks.toggle"
            ]
        },
        {
            "before": ["<leader>", "b"],
            "commands": [
                "bookmarks.list"
            ]
        }
    ]
```

- `ZZ` 를 vim 명령`:wq` 에 바인딩합니다 (현재 파일을 저장하고 닫습니다):

```json
    "vim.normalModeKeyBindingsNonRecursive": [
        {
            "before": ["Z", "Z"],
            "commands": [
                ":wq"
            ]
        }
    ]
```

- `ctrl+n` 을 바인드하여 검색 강조 표시를 끄고`<leader>w` 를 사용하여 현재 파일을 저장하십시오:

```json
    "vim.normalModeKeyBindingsNonRecursive": [
        {
            "before":["<C-n>"],
            "commands": [
                ":nohl",
            ]
        },
        {
            "before": ["leader", "w"],
            "commands": [
                "workbench.action.files.save",
            ]
        }
    ]
```

- 현재 레지스터를 재정의하지 않고 붙여 넣기 위해 `p` 를 비주얼 모드로 바인딩

```json
    "vim.visualModeKeyBindingsNonRecursive": [
        {
            "before": [
                "p",
            ],
            "after": [
                "p",
                "g",
                "v",
                "y"
            ]
        }
    ],
```

- 시각적 모드에서`>` 및 `<`를 바인드하여 줄을 들여 쓰기 / 바꾸기 (반복 가능)

```json
    "vim.visualModeKeyBindingsNonRecursive": [
        {
            "before": [
                ">"
            ],
            "commands": [
                "editor.action.indentLines"
            ]
        },
        {
            "before": [
                "<"
            ],
            "commands": [
                "editor.action.outdentLines"
            ]
        },
    ]
```

- 이 저장소를 선택된 위치에 복제하려면`<leader>vim` 을 바인딩하십시오.

```json
    "vim.visualModeKeyBindingsNonRecursive": [
        {
            "before": [
                "<leader>", "v", "i", "m"
            ],
            "commands": [
                {
                    "command": "git.clone",
                    "args": [ "https://github.com/VSCodeVim/Vim.git" ]
                }
            ]
        }
    ]
```

#### `"vim.insertModeKeyBindingsNonRecursive"`/`"normalModeKeyBindingsNonRecursive"`/`"visualModeKeyBindingsNonRecursive"`

- 비 재귀 키 바인딩은 삽입, 일반 및 시각적 모드에 사용하도록 재정의합니다.
- _예:_  `j` 를 `gj`에 바인드하십시오.이 바인딩을 정상적으로 시도하면 gj의 j는 계속해서 gj로 확장됩니다. insertModeKeyBindingsNonRecursive 및 / 또는 normalModeKeyBindingNonRecursive를 사용하여이 순환 확장을 중지하십시오.

```json
    "vim.normalModeKeyBindingsNonRecursive": [
        {
            "before": ["j"],
            "after": ["g", "j"]
        }
    ]
```

#### Remappings 디버깅하기

1.  구성이 정확합니까?

    확장의 [logging level](#vscodevim-settings) 을 'debug'로 조정하고 VS Code를 다시 시작하십시오. 재 매핑 된 각 구성이 로드 될 때 콘솔로 출력됩니다. 개발자 도구 콘솔에 오류가 있습니까?

    ```console
    debug: Remapper: normalModeKeyBindingsNonRecursive. before=0. after=^.
    debug: Remapper: insertModeKeyBindings. before=j,j. after=<Esc>.
    error: Remapper: insertModeKeyBindings. Invalid configuration. Missing 'after' key or 'command'. before=j,k.
    ```

    잘못 구성된 구성은 무시됩니다.

2.  확장 프로그램이 다시 매핑하려는 키를 처리합니까?

    VSCodeVim은[package.json](https://github.com/VSCodeVim/Vim/blob/1a5f358a1a57c62d5079093ad0dd12c2bf018bba/package.json#L53). 을 통해 중요한 이벤트를 VS Code에 명시 적으로 지시합니다. 다시 매핑하려는 키가 vim / vscodevim이 일반적으로 처리하지 않는 키인 경우이 확장은 VS Code에서 해당 키 이벤트를받지 못할 가능성이 큽니다. [logging level](#vscodevim-settings)을 '디버그'로 조정 한 상태에서 키를 누르면 다음과 유사한 출력이 표시됩니다:

    ```console
    debug: ModeHandler: handling key=A.
    debug: ModeHandler: handling key=l.
    debug: ModeHandler: handling key=<BS>.
    debug: ModeHandler: handling key=<C-a>.
    ```

    다시 매핑하려는 키를 누르면 여기에 출력되는 것이 보입니까? 그렇지 않은 경우 해당 주요 key에 가입하지 않은 것입니다.

### Vim 설정

vim에서 복사 한 구성 설정. Vim 설정은 다음 순서로로드됩니다:

1.  `:set {setting}`
2.  `vim.{setting}` from user/workspace settings.
3.  VS Code 설정
4.  VSCodeVim 기본 값

| 환경          | 설명                                                                                                                                                                                                                                                           | 타입    | 기본 값 |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------- |
| vim.autoindent   | 새 줄을 시작할 때 현재 줄에서 들여 쓰기                                                                                                                                                                                                               | Boolean | true          |
| vim.hlsearch     | 현재 검색과 일치하는 모든 텍스트를 강조 표시합니다                                                                                                                                                                                                                          | Boolean | false         |
| vim.ignorecase   | 검색 패턴에서 대소 문자 무시                                                                                                                                                                                                                          | Boolean | true          |
| vim.incsearch    | 검색을 입력하는 동안 다음 매치 표시                                                                                                                                                                                                                           | Boolean | true          |
| vim.leader       | 키 재 매핑에 사용될`<leader>`의 키를 정의합니다                                                                                                                                                                                                               | String  | `\`           |
| vim.showcmd      | 상태 표시 줄에 (부분) 명령 표시                                                                                                                                                                                                                     | Boolean | true          |
| vim.showmodename | 상태 표시 줄에 현재 모드 이름 표시                                                                                                                                                                                                                           | Boolean | true          |
| vim.smartcase    | 검색 패턴에 대문자가 포함 된 경우 '무시'설정을 대체하십시오.                                                                                                                                                                                     | Boolean | true          |
| vim.textwidth    | `gq`를 사용할 때 너비를 자동 줄 바꿈                                                                                                                                                                                                                                    | Number  | 80            |
| vim.timeout      | 재 매핑 된 명령에 대한 시간 초과 (밀리 초)                                                                                                                                                                                                                      | Number  | 1000          |
| vim.whichwrap    | 줄의 시작과 끝에서 줄 바꿈을 제어합니다. 다음 / 이전 행으로 줄 바꿈해야하는 쉼표로 구분 된 키 집합입니다. 화살표 키는 삽입 모드에서 `[`  및  `]` 로 표시되며 일반 및 시각적 모드에서는`<` 및  `>` 로 표시됩니다. "everything"을 감싸려면 이것을`h,l,<,>,[,]`로 설정하십시오. | String  | ``            |
| vim.report       |라인 수 보고에 대한 임계 값이 변경되었습니다.                                                                                                                                                                                                                     | Number  | 2             |

## 🖱️ 멀티커서모드

> :warning:다중 커서 모드가 실험 중입니다. [feedback thread.](https://github.com/VSCodeVim/Vim/issues/824)에 문제를보고하십시오.

다음으로 다중 커서 모드로 들어갑니다:

- On OSX, `cmd-d`. On Windows, `ctrl-d`.
- `gb` `cmd-d` (OSX) 또는 `ctrl-d`  (Windows)에 해당하는 새로운 바로 가기가 추가되었습니다. 다음 단어에 커서가 현재있는 단어와 일치하는 다른 커서를 추가합니다.
- "Add Cursor Above/Below"을 실행하거나 다른 플랫폼으로 빠르게 접근하기.

커서가 여러 개 있으면 Vim 명령을 사용할 수 있습니다. 대부분 작동해야합니다. 일부는 지원되지 않습니다(참조 [PR#587](https://github.com/VSCodeVim/Vim/pull/587)).

- 각 커서에는 자체 클립 보드가 있습니다.
- 다중 커서 시각 모드에서 이스케이프를 누르면 다중 커서 보통 모드로 전환됩니다. 다시 누르면 일반 모드로 돌아갑니다.

## 🔌 에뮬레이트 된 플러그인

### vim-airline

> :warning: 이 플러그인을 사용하면 성능에 영향을 미칩니다. 상태 표시 줄을 변경하기 위해 작업 공간 settings.json의 구성을 재정 의하여 작업 디렉토리의 대기 시간이 증가하고 diff가 지속적으로 변경됩니다(참조 [이슈#2124](https://github.com/VSCodeVim/Vim/issues/2124)).

현재 모드에 따라 상태 표시 줄의 색상을 변경하십시오. 활성화되면`"vim.statusBarColors"`를 구성하십시오. 각 모드의 색상은 `string`  (배경 만) 또는 `string[]` (배경, 전경)로 정의 할 수 있습니다.

```json
    "vim.statusBarColorControl": true,
    "vim.statusBarColors.normal": ["#8FBCBB", "#434C5E"],
    "vim.statusBarColors.insert": "#BF616A",
    "vim.statusBarColors.visual": "#B48EAD",
    "vim.statusBarColors.visualline": "#B48EAD",
    "vim.statusBarColors.visualblock": "#A3BE8C",
    "vim.statusBarColors.replace": "#D08770"
```

### vim-easymotion

[vim-easymotion](https://github.com/easymotion/vim-easymotion)을 기반으로하며 다음 설정을 통해 구성됩니다:

| 환경                                    | 설명                                                                                                                                                                                                                                                       | 타입           | 기본값  |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | -------------- |
| vim.easymotion                             | easymotion 플러그인 활성화 / 비활성화                                                                                                                                                                                                                                  | Boolean        | false          |
| vim.easymotionMarkerBackgroundColor        | 마커 상자의 배경색입니다.                                                                                                                                                                                                                          |
| vim.easymotionMarkerForegroundColorOneChar | 한 문자 마커의 글꼴 색상입니다.                                                                                                                                                                                                                        |
| vim.easymotionMarkerForegroundColorTwoChar | 한 문자 마커와 구별하는 데 사용되는 두 문자 마커의 글꼴 색상입니다.                                                                                                                                                                       |
| vim.easymotionMarkerWidthPerChar           | 각 문자에 할당 된 너비 (픽셀)입니다.                                                                                                                                                                                                                 |
| vim.easymotionMarkerHeight                 |마커의 높이입니다.                                                                                                                                                                                                                                       |
| vim.easymotionMarkerFontFamily             | 마커 텍스트에 사용 된 글꼴 모음입니다.                                                                                                                                                                                                                         |
| vim.easymotionMarkerFontSize               | 마커 텍스트에 사용되는 글꼴 크기입니다.                                                                                                                                                                                                                         |
| vim.easymotionMarkerFontWeight             | 마커 텍스트에 사용 된 글꼴 굵기입니다.                                                                                                                                                                                                                         |
| vim.easymotionMarkerYOffset                | 마커 상단과 텍스트 사이의 거리 (일반적으로 높이 또는 글꼴 크기가 변경된 경우 약간의 조정이 필요함).                                                                                                                           |
| vim.easymotionKeys                         | 점프 마커 이름에 사용되는 문자                                                                                                                                                                                                                          |
| vim.easymotionJumpToAnywhereRegex          | Custom regex to match for JumpToAnywhere motion (analogous to `Easymotion_re_anywhere`). Example setting (which also matches start & end of line, as well as Javascript comments in addition to the regular behavior (note the double escaping required): ^\\s\*. | \\b[A-Za-z0-9] | [A-Za-z0-9]\\b | \_. | \\#. | [a-z][a-z] | // | .\$" |

easymotion이 활성화되면 다음 명령을 사용하여 모션을 시작하십시오. 모션을 시작하면 텍스트 데코레이터 / 마커가 표시되며 표시된 키를 눌러 해당 위치로 이동할 수 있습니다. `leader`는 설정이 가능하며 기본적으로`\` 입니다.

| Motion 명령어                      | 설명                                                                                                 |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `<leader><leader> s <char>`         | Search character                                                                                            |
| `<leader><leader> f <char>`         | Find character forwards                                                                                     |
| `<leader><leader> F <char>`         | Find character backwards                                                                                    |
| `<leader><leader> t <char>`         | Til character forwards                                                                                      |
| `<leader><leader> T <char>`         | Til character backwards                                                                                     |
| `<leader><leader> w`                | Start of word forwards                                                                                      |
| `<leader><leader> b`                | Start of word backwards                                                                                     |
| `<leader><leader> l`                | matches beginning & ending of word, camelCase, after \_ and after # forwards                                |
| `<leader><leader> h`                | matches beginning & ending of word, camelCase, after \_ and after # backwards                               |
| `<leader><leader> e`                | End of word forwards                                                                                        |
| `<leader><leader> ge`               | End of word backwards                                                                                       |
| `<leader><leader> j`                | Start of line forwards                                                                                      |
| `<leader><leader> k`                | Start of line backwards                                                                                     |
| `<leader><leader> / <char>... <CR>` | Search n-character                                                                                          |
| `<leader><leader><leader> bdt`      | Til character                                                                                               |
| `<leader><leader><leader> bdw`      | Start of word                                                                                               |
| `<leader><leader><leader> bde`      | End of word                                                                                                 |
| `<leader><leader><leader> bdjk`     | Start of line                                                                                               |
| `<leader><leader><leader> j`        | JumpToAnywhere motion; default behavior matches beginning & ending of word, camelCase, after \_ and after # |

`<leader><leader> (2s|2f|2F|2t|2T) <char><char>` 그리고 `<leader><leader><leader> bd2t <char>char>` 도 이용할 수 있다.
차이점은 검색에 필요한 문자 수입니다.
예를 들어,`<leader><leader> 2s <char><char>` 두 문자가 필요하며 두 문자로 검색한다.
이 매핑은 표준 매핑이 아니므로 사용자 지정 매핑을 사용하는 것이 좋습니다.

### vim-surround

[surround.vim](https://github.com/tpope/vim-surround)을 기반으로 플러그인은 괄호, 괄호, 따옴표 및 XML 태그와 같은 주변 문자를 처리하는 데 사용됩니다.

| 설정      | 설명                 | 타입    | 기본값 |
| ------------ | --------------------------- | ------- | ------------- |
| vim.surround | Enable/disable vim-surround | Boolean | true          |

`<desired char>`또는`<existing char>`로`t` 또는`<`는 태그를 수행하고 태그 입력 모드로 들어갑니다. `>`대신`<CR>`을 사용하여 태그 변경을 마치면 기존 속성이 유지됩니다.

| Surround Command                     | 설명                                                           |
| ------------------------------------ | --------------------------------------------------------------------- |
| `d s <existing char>`                | 기존 서라운드 삭제                                              |
| `c s <existing char> <desired char>` | Change surround existing to desired                                   |
| `y s <motion> <desired char>`        | Surround something with something using motion (as in "you surround") |
| `S <desired char>`                   | Surround when in visual modes (surrounds full selection)              |

몇가지 예:

- ` 'test'`로 끝나기 위해 인용 부호 안에 cs를 입력 한`'test'`
- `test``로 끝나는 인용 부호 ds 안에 커서가있는 "test"`
- `"test"` with cursor inside quotes type cs"t and enter 123> to end up with `<123>test</123>`
- 단어 테스트 유형 ysaw에 커서가있는`test`는`(test)`로 끝납니다.

### vim-commentary

[vim-commentary](https://github.com/tpope/vim-commentary)와 유사하지만 VSCode 기본 토글 라인 주석 및 토글 블록 주석 기능을 사용합니다.

사용 예시:

- `gc` -라인 주석을 토글합니다. 예를 들어`gcc`는 현재 행에 대한 라인 주석을 토글하고`gc2j`는 현재 라인과 다음 두 라인에 대한 라인 주석을 토글합니다.
- `gC`-블록 주석 토글. 예를 들어`gCi)`는 괄호 안의 모든 것을 주석 처리합니다.

### vim-indent-object
[vim-indent-object](https://github.com/michaeljsmith/vim-indent-object)를 기반으로하여 현재 들여 쓰기 수준의 코드 블록을 텍스트 객체로 처리 할 수 있습니다. 문장 주위에 중괄호를 사용하지 않는 언어 (예 : Python)에서 유용합니다.

여는 중괄호 / 태그 사이에 새로운 줄이 있다면, 그것은 무시할 수있는`cib` /`ci {`/`ci [`/`cit`로 간주 될 수 있습니다.

| 명령어        | 설명                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------------- |
| `<operator>ii` | This indentation level                                                                               |
| `<operator>ai` | This indentation level and the line above (think `if` statements in Python)                          |
| `<operator>aI` | This indentation level, the line above, and the line after (think `if` statements in C/C++/Java/etc) |

### vim-sneak

[vim-sneak](https://github.com/justinmk/vim-sneak)를 기반으로 두 문자로 지정된 위치로 이동할 수 있습니다.

| 환경                            | 설명                                                 | 타입    | 기본 값 |
| ---------------------------------- | ----------------------------------------------------------- | ------- | ------------- |
| vim.sneak                          | Enable/disable vim-sneak                                    | Boolean | false         |
| vim.sneakUseIgnorecaseAndSmartcase | Respect `vim.ignorecase` and `vim.smartcase` while sneaking | Boolean | false         |

몰래 활성화되면 다음 명령을 사용하여 모션을 시작하십시오. 연산자 sneak은`s` 대신`z`를 사용합니다. `s`는 이미 서라운드 플러그인에 의해 사용되기 때문입니다.

| Motion 명령            | 설명                                                             |
| ------------------------- | ----------------------------------------------------------------------- |
| `s<char><char>`           | Move forward to the first occurrence of `<char><char>`                  |
| `S<char><char>`           | Move backward to the first occurrence of `<char><char>`                 |
| `<operator>z<char><char>` | Perform `<operator>` forward to the first occurrence of `<char><char>`  |
| `<operator>Z<char><char>` | Perform `<operator>` backward to the first occurrence of `<char><char>` |

### CamelCaseMotion

정확한 에뮬레이션은 아니지만  [CamelCaseMotion](https://github.com/bkad/CamelCaseMotion)을 기반으로합니다. 이 플러그인은 camelCase 및 snake_case 단어를 쉽게 이동할 수있는 방법을 제공합니다.

| 환경                    | 설명                    | 타입    | 기본 값 |
| -------------------------- | ------------------------------ | ------- | ------------- |
| vim.camelCaseMotion.enable | Enable/disable CamelCaseMotion | Boolean | false         |

CamelCaseMotion이 활성화되면 다음 모션을 사용할 수 있습니다.

| Motion 명령어         | 설명                                                                |
| ---------------------- | -------------------------------------------------------------------------- |
| `<leader>w`            | Move forward to the start of the next camelCase or snake_case word segment |
| `<leader>e`            | Move forward to the next end of a camelCase or snake_case word segment     |
| `<leader>b`            | Move back to the prior beginning of a camelCase or snake_case word segment |
| `<operator>i<leader>w` | Select/change/delete/etc. the current camelCase or snake_case word segment |

기본적으로`<leader>`는`\`에 매핑되므로 예를 들어`d2i \ w`는 현재 및 다음 camelCase 단어 세그먼트를 삭제합니다.

### 입력 방법

삽입 모드를 종료 할 때 입력 방법을 비활성화하십시오.

| 환경                                 | 설명                                                                                      |
| --------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `vim.autoSwitchInputMethod.enable`      | Boolean denoting whether autoSwitchInputMethod is on/off.                                        |
| `vim.autoSwitchInputMethod.defaultIM`   | Default input method.                                                                            |
| `vim.autoSwitchInputMethod.obtainIMCmd` | The full path to command to retrieve the current input method key.                               |
| `vim.autoSwitchInputMethod.switchIMCmd` | The full path to command to switch input method, with `{im}` a placeholder for input method key. |

모든 타사 프로그램을 사용하여 입력 방법을 전환 할 수 있습니다. 다음은 [im-select](https://github.com/daipeihust/im-select)를 사용하여 구성을 안내합니다..

1. im-select 설치하기 (참조 [installation guide](https://github.com/daipeihust/im-select#installation))
1.  기본 입력 방법 키 찾기

    - Mac:

      입력 방법을 영어로 전환하고 터미널에서 `/<path-to-im-select-installation>/im-select` 를 실행하여 기본 입력 방법을 출력하십시오. 아래 표에는 MacOS의 일반적인 영어 키 레이아웃이 나와 있습니다.

      | Key                            | 설명 |
      | ------------------------------ | ----------- |
      | com.apple.keylayout.US         | U.S.        |
      | com.apple.keylayout.ABC        | ABC         |
      | com.apple.keylayout.British    | British     |
      | com.apple.keylayout.Irish      | Irish       |
      | com.apple.keylayout.Australian | Australian  |
      | com.apple.keylayout.Dvorak     | Dvorak      |
      | com.apple.keylayout.Colemak    | Colemak     |

    - Windows:

      입력 방법 키를 검색하는 방법은[im-select guide](https://github.com/daipeihust/im-select#to-get-current-keyboard-locale) 안내서를 참조하십시오.  일반적으로 키보드 레이아웃이 en_US 인 경우 입력 방법 키는 1033 (en_US의 로캘 ID)입니다. `LCID Decimal`열이 로컬 ID인 [이 페이지](https://www.science.co.il/language/Locale-codes.php)에서 로컬 ID를 찾을 수도 있습니다.

1.  Configure `vim.autoSwitchInputMethod`.

    - MacOS:

       `com.apple.keylayout.US` 과 `im-select` 은  `/usr/local/bin`에 있다. 구성은 다음과 같다.:

      ```json
      "vim.autoSwitchInputMethod.enable": true,
      "vim.autoSwitchInputMethod.defaultIM": "com.apple.keylayout.US",
      "vim.autoSwitchInputMethod.obtainIMCmd": "/usr/local/bin/im-select",
      "vim.autoSwitchInputMethod.switchIMCmd": "/usr/local/bin/im-select {im}"
      ```

    - Windows:

       `1033`  (en_US)과 `im-select.exe` 의 입력 방법 키는`D:/bin`에 있습니다. 구성은 다음과 같습니다:

      ```json
      "vim.autoSwitchInputMethod.enable": true,
      "vim.autoSwitchInputMethod.defaultIM": "1033",
      "vim.autoSwitchInputMethod.obtainIMCmd": "D:\\bin\\im-select.exe",
      "vim.autoSwitchInputMethod.switchIMCmd": "D:\\bin\\im-select.exe {im}"
      ```

위의`{im}`인수는 입력 방법을 나타내는 `im-select` 에 전달되는 명령 행 옵션입니다. 대체 프로그램을 사용하여 입력 방법을 전환하는 경우 유사한 옵션을 구성에 추가해야합니다. 예를 들어, 입력 방법을 전환하기 위해 프로그램의 사용법이`my-program -s imKey` 인 경우,`vim.autoSwitchInputMethod.switchIMCmd` 는 `/path/to/my-program -s {im}`이어야합니다.


### ReplaceWithRegister

 [ReplaceWithRegister](https://github.com/vim-scripts/ReplaceWithRegister)를 기반으로 기존 텍스트를 레지스터의 내용으로 쉽게 바꿀 수 있습니다.

| 환경                 | 설명                        | 타입    | 기본 값 |
| ----------------------- | ---------------------------------- | ------- | ------------- |
| vim.replaceWithRegister | Enable/disable ReplaceWithRegister | Boolean | false         |

활성화되면`gr`  (예 : "go replace")을 입력 한 다음 레지스터 내용으로 대체하려는 텍스트를 설명하는 동작을 입력하십시오.

| Motion 명령어          | 설명                                                                             |
| ----------------------- | --------------------------------------------------------------------------------------- |
| `[count]["a]gr<motion>` |모션에 설명 된 텍스트를 지정된 레지스터의 내용으로 바꿉니다.   |
| `[count]["a]grr`        |  \[count\] 줄 또는 현재 줄을 지정된 레지스터의 내용으로 바꿉니다.|
| `{Visual}["a]gr`        | 선택한 레지스터를 지정된 레지스터의 내용으로 바꿉니다.       |

## 🎩 VSCodeVim 트릭!

VSCode에는 멋진 트릭이 많이 있으며 그 중 일부를 보존하려고합니다:

- `gd` - 정의로 이동하십시오.
- `gq` - 주석 스타일을 유지하면서 시각적 선택 리플 로우 및 텍스트 줄 바꿈 텍스트 블록 문서 주석 형식화에 좋습니다.
- `gb` - 찾은 다음 단어에 커서 아래에있는 단어와 동일한 다른 커서를 추가합니다.
- `af` - 점점 더 큰 텍스트 블록을 선택하는 비주얼 모드 명령. 예를 들어 "blah (foo [bar 'ba | z'])"가 있으면 먼저 'baz'를 선택합니다. `af`를 다시 누르면 [bar'baz ']를 선택하고 세 번째로 수행 한 경우 "(foo [bar'baz '])"를 선택합니다.
- `gh` - 커서가있는 곳에 마우스를 올려 놓는 것과 같습니다. 마우스에 도달하지 않고도 유형 및 오류 메시지를 볼 수 있습니다!

## 📚 자주하는 질문

- 네이티브 Visual Studio Code `ctrl` (예 :`ctrl + f`,`ctrl + v`) 명령은 작동하지 않습니다

  [`useCtrlKeys` setting](#vscodevim-settings) 을 `false`로 설정하십시오..

- 폴드 위로 `j`/`k`를 움직이면 폴드가 열립니다

  `vim.foldfix` 를 `true`로 설정하십시오. 이것은 해킹입니다. 제대로 작동하지만 부작용이 있습니다(참조 [이슈#22276](https://github.com/Microsoft/vscode/issues/22276)).

- 키 반복이 작동하지 않습니다

  당신은 Mac유저 입니까? [mac-setup](#mac) 지침을 살펴 보셨습니까?

-  `<esc>`로 닫을 수없는 성가신 정보 / 알림 / 팝업이 있습니다! ! 그리고 나는 단편적인 지식 밖에 없어 좀 더 알고 싶습니다.

  `shift+<esc>` 를 눌러 모든 상자를 닫으십시오.

- Zen 모드 또는 상태 표시 줄이 비활성화 된 경우 명령 줄을 사용하려면 어떻게해야합니까?

   이 확장 기능은 재 맵핑 가능한 명령을 표시하여 vscode 스타일의 빠른 선택, 제한된 기능 버전의 명령 줄을 보여줍니다. VS 코드의 keybindings.json 설정 파일에서 다음과 같이 다시 매핑 할 수 있습니다.

  ```json
  {
    "key": "shift+;",
    "command": "vim.showQuickpickCmdLine",
    "when": "editorTextFocus && vim.mode != 'Insert'"
  }
  ```

  Or for Zen mode only:

  ```json
  {
    "key": "shift+;",
    "command": "vim.showQuickpickCmdLine",
    "when": "inZenMode && vim.mode != 'Insert'"
  }
  ```

- 단어 줄 바꿈을 사용하여 각 표시 줄에서 커서를 어떻게 이동합니까?

  단어 줄 바꿈이 있고<kbd>j</kbd>, <kbd>k</kbd>, <kbd>↓</kbd> 또는 <kbd>↑</kbd>를 사용할 때 커서가 줄 바꿈 된 각 줄에 들어가도록하려면  keybindings.json 설정 파일에서 다음을 설정하십시오.

  <!-- prettier-ignore -->
  ```json
  {
    "key": "up",
    "command": "cursorUp",
    "when": "editorTextFocus && vim.active && !inDebugRepl && !suggestWidgetMultipleSuggestions && !suggestWidgetVisible"
  },
  {
    "key": "down",
    "command": "cursorDown",
    "when": "editorTextFocus && vim.active && !inDebugRepl && !suggestWidgetMultipleSuggestions && !suggestWidgetVisible"
  },
  {
    "key": "k",
    "command": "cursorUp",
    "when": "editorTextFocus && vim.active && !inDebugRepl && vim.mode == 'Normal' && !suggestWidgetMultipleSuggestions && !suggestWidgetVisible"
  },
  {
    "key": "j",
    "command": "cursorDown",
    "when": "editorTextFocus && vim.active && !inDebugRepl && vim.mode == 'Normal' && !suggestWidgetMultipleSuggestions && !suggestWidgetVisible"
  }
  ```

  **경고:** 이 솔루션은<kbd>j</kbd> 및 <kbd>k</kbd> 키에 대한 기본 VS 코드 동작을 복원하므로`10j`와 같은 동작은 [작동하지 않습니다.](https://github.com/VSCodeVim/Vim/pull/3623#issuecomment-481473981). 이러한 동작이 작동해야하는 경우 [성능이 떨어지는 다른 옵션이 있습니다](https://github.com/VSCodeVim/Vim/issues/2924#issuecomment-476121848).

## ❤️ 기여하기

이 프로젝트는 [멋진 사람들](https://github.com/VSCodeVim/Vim/graphs/contributors)의 그룹에 의해 유지되고 기여는 매우 환영합니다 :heart:. 도움을 줄 수있는 방법에 대한 빠른 튜토리얼은 [기여 가이드](/.github/CONTRIBUTING.md)를 참조하십시오.

<a href="https://www.buymeacoffee.com/jasonpoon" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Us A Coffee" style="height: auto !important;width: auto !important;" ></a>

### 도움을 주신 분들:

- 리포지토리에 100 번 이상 커밋 한 @xconverge에게 감사합니다. 가장 좋아하지 않는 버그가 왜 포장되어 떠 났는지 궁금하다면 아마도 xconverge 덕분 일 것입니다.
- EasyMotion을 구현 한 @Metamist에게 감사합니다!
- 텍스트 객체를 구현 한 @sectioneight에게 감사합니다!
- 멋진 로고를 만든 [Kevin Coleman](http://kevincoleman.io)은 나에게 소중한 지주입니다!
- @chillee (일명 Horace He)에게 그의 기고와 노력에 감사합니다.
