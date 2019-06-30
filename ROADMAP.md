## Key

:white_check_mark: - command done

:white_check_mark: :star: - command done with VS Code specific customization

:warning: - some variations of the command are not supported

:running: - work in progress

:arrow_down: - command is low priority; open an issue (or thumbs up the relevant issue) if you want to see it sooner

:x: - command impossible with current VSCode API

:1234: - command accepts numeric prefix

## Roadmap

These are the big Vim features, put generally in the order in which we plan to implement them.

| Status             | Command                |
| ------------------ | ---------------------- |
| :white_check_mark: | Normal Mode            |
| :white_check_mark: | Insert Mode            |
| :white_check_mark: | Visual Mode            |
| :white_check_mark: | Visual Line Mode       |
| :white_check_mark: | Number Prefixes        |
| :white_check_mark: | . Operator             |
| :white_check_mark: | Searching with / and ? |
| :white_check_mark: | Correct Undo/Redo      |
| :warning:          | Command Remapping      |
| :warning:          | Marks                  |
| :white_check_mark: | Text Objects           |
| :white_check_mark: | Visual Block Mode      |
| :white_check_mark: | Replace Mode           |
| :white_check_mark: | Multiple Select Mode   |
| :warning:          | Macros                 |
| :warning:          | Buffer/Window/Tab      |

Now follows an exhaustive list of every known Vim command that we could find.

## Custom commands

- `gh` - show the hover tooltip.
- `gb` - add an additional cursor at the next place that matches `*`.

## Left-right motions

| Status             | Command        | Description                                                                    |
| ------------------ | -------------- | ------------------------------------------------------------------------------ |
| :white_check_mark: | :1234: h       | left (also: CTRL-H, BS, or Left key)                                           |
| :white_check_mark: | :1234: l       | right (also: Space or Right key)                                               |
| :white_check_mark: | 0              | to first character in the line (also: Home key)                                |
| :white_check_mark: | ^              | to first non-blank character in the line                                       |
| :white_check_mark: | :1234: \$      | to the last character in the line (N-1 lines lower) (also: End key)            |
| :white_check_mark: | g0             | to first character in screen line (differs from "0" when lines wrap)           |
| :white_check_mark: | g^             | to first non-blank character in screen line (differs from "^" when lines wrap) |
| :white_check_mark: | :1234: g\$     | to last character in screen line (differs from "\$" when lines wrap)           |
| :white_check_mark: | gm             | to middle of the screen line                                                   |
| :white_check_mark: | :1234: \|      | to column N (default: 1)                                                       |
| :white_check_mark: | :1234: f{char} | to the Nth occurrence of {char} to the right                                   |
| :white_check_mark: | :1234: F{char} | to the Nth occurrence of {char} to the left                                    |
| :white_check_mark: | :1234: t{char} | till before the Nth occurrence of {char} to the right                          |
| :white_check_mark: | :1234: T{char} | till before the Nth occurrence of {char} to the left                           |
| :white_check_mark: | :1234: ;       | repeat the last "f", "F", "t", or "T" N times                                  |
| :white_check_mark: | :1234: ,       | repeat the last "f", "F", "t", or "T" N times in opposite direction            |

## Up-down motions

| Status             | Command   | Description                                                                               |
| ------------------ | --------- | ----------------------------------------------------------------------------------------- |
| :white_check_mark: | :1234: k  | up N lines (also: CTRL-P and Up)                                                          |
| :white_check_mark: | :1234: j  | down N lines (also: CTRL-J, CTRL-N, NL, and Down)                                         |
| :white_check_mark: | :1234: -  | up N lines, on the first non-blank character                                              |
| :white_check_mark: | :1234: +  | down N lines, on the first non-blank character (also: CTRL-M and CR)                      |
| :white_check_mark: | :1234: \_ | down N-1 lines, on the first non-blank character                                          |
| :white_check_mark: | :1234: G  | goto line N (default: last line), on the first non-blank character                        |
| :white_check_mark: | :1234: gg | goto line N (default: first line), on the first non-blank character                       |
| :white_check_mark: | :1234: %  | goto line N percentage down in the file; N must be given, otherwise it is the `%` command |
| :white_check_mark: | :1234: gk | up N screen lines (differs from "k" when line wraps)                                      |
| :white_check_mark: | :1234: gj | down N screen lines (differs from "j" when line wraps)                                    |

## Text object motions

| Status             | Command    | Description                                                 |
| ------------------ | ---------- | ----------------------------------------------------------- |
| :white_check_mark: | :1234: w   | N words forward                                             |
| :white_check_mark: | :1234: W   | N blank-separated WORDs forward                             |
| :white_check_mark: | :1234: e   | N words forward to the end of the Nth word                  |
| :white_check_mark: | :1234: E   | N words forward to the end of the Nth blank-separated WORD  |
| :white_check_mark: | :1234: b   | N words backward                                            |
| :white_check_mark: | :1234: B   | N blank-separated WORDs backward                            |
| :white_check_mark: | :1234: ge  | N words backward to the end of the Nth word                 |
| :white_check_mark: | :1234: gE  | N words backward to the end of the Nth blank-separated WORD |
| :white_check_mark: | :1234: )   | N sentences forward                                         |
| :white_check_mark: | :1234: (   | N sentences backward                                        |
| :white_check_mark: | :1234: }   | N paragraphs forward                                        |
| :white_check_mark: | :1234: {   | N paragraphs backward                                       |
| :white_check_mark: | :1234: ]]  | N sections forward, at start of section                     |
| :white_check_mark: | :1234: [[  | N sections backward, at start of section                    |
| :white_check_mark: | :1234: ][  | N sections forward, at end of section                       |
| :white_check_mark: | :1234: []  | N sections backward, at end of section                      |
| :white_check_mark: | :1234: [(  | N times back to unclosed '('                                |
| :white_check_mark: | :1234: [{  | N times back to unclosed '{'                                |
| :arrow_down:       | :1234: [m  | N times back to start of method (for Java)                  |
| :arrow_down:       | :1234: [M  | N times back to end of method (for Java)                    |
| :white_check_mark: | :1234: ])  | N times forward to unclosed ')'                             |
| :white_check_mark: | :1234: ]}  | N times forward to unclosed '}'                             |
| :arrow_down:       | :1234: ]m  | N times forward to start of method (for Java)               |
| :arrow_down:       | :1234: ]M  | N times forward to end of method (for Java)                 |
| :arrow_down:       | :1234: [#  | N times back to unclosed "#if" or "#else"                   |
| :arrow_down:       | :1234: ]#  | N times forward to unclosed "#else" or "#endif"             |
| :arrow_down:       | :1234: [\* | N times back to start of a C comment "/\*"                  |
| :arrow_down:       | :1234: ]\* | N times forward to end of a C comment "\*/"                 |

## Pattern searches

| Status                    | Command                            | Description                                            | Note                                                                            |
| ------------------------- | ---------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------- |
| :white_check_mark: :star: | :1234: `/{pattern}[/[offset]]<CR>` | search forward for the Nth occurrence of {pattern}     | Currently we only support JavaScript Regex but not Vim's in-house Regex engine. |
| :white_check_mark: :star: | :1234: `?{pattern}[?[offset]]<CR>` | search backward for the Nth occurrence of {pattern}    | Currently we only support JavaScript Regex but not Vim's in-house Regex engine. |
| :warning:                 | :1234: `/<CR>`                     | repeat last search, in the forward direction           | {count} is not supported.                                                       |
| :warning:                 | :1234: `?<CR>`                     | repeat last search, in the backward direction          | {count} is not supported.                                                       |
| :white_check_mark:        | :1234: n                           | repeat last search                                     |
| :white_check_mark:        | :1234: N                           | repeat last search, in opposite direction              |
| :white_check_mark:        | :1234: \*                          | search forward for the identifier under the cursor     |
| :white_check_mark:        | :1234: #                           | search backward for the identifier under the cursor    |
| :white_check_mark:        | :1234: g\*                         | like "\*", but also find partial matches               |
| :white_check_mark:        | :1234: g#                          | like "#", but also find partial matches                |
| :white_check_mark:        | gd                                 | goto local declaration of identifier under the cursor  |
| :arrow_down:              | gD                                 | goto global declaration of identifier under the cursor |

## Marks and motions

| Status             | Command                                                     | Description                                        |
| ------------------ | ----------------------------------------------------------- | -------------------------------------------------- |
| :white_check_mark: | m{a-zA-Z}                                                   | mark current position with mark {a-zA-Z}           |
| :white_check_mark: | `{a-z} | go to mark {a-z} within current file               |
| :white_check_mark: | `{A-Z} | go to mark {A-Z} in any file                       |
| :white_check_mark: | `{0-9} | go to the position where Vim was previously exited |
| :white_check_mark: | `` | go to the position before the last jump                |
| :arrow_down:       | `" | go to the position when last editing this file         |
| :arrow_down:       | `[ | go to the start of the previously operated or put text |
| :arrow_down:       | `] | go to the end of the previously operated or put text   |
| :arrow_down:       | `< | go to the start of the (previous) Visual area          |
| :arrow_down:       | `> | go to the end of the (previous) Visual area            |
| :white_check_mark: | `. | go to the position of the last change in this file     |
| :white_check_mark: | '.                                                          | go to the position of the last change in this file |
| :arrow_down:       | '{a-zA-Z0-9[]'"<>.}                                         | same as `, but on the first non-blank in the line  |
| :arrow_down:       | :marks                                                      | print the active marks                             |
| :white_check_mark: | :1234: CTRL-O                                               | go to Nth older position in jump list              |
| :white_check_mark: | :1234: CTRL-I                                               | go to Nth newer position in jump list              |
| :arrow_down:       | :ju[mps]                                                    | print the jump list                                |

## Various motions

| Status             | Command             | Description                                                                                        |
| ------------------ | ------------------- | -------------------------------------------------------------------------------------------------- |
| :white_check_mark: | %                   | find the next brace, bracket, comment, or "#if"/ "#else"/"#endif" in this line and go to its match |
| :white_check_mark: | :1234: H            | go to the Nth line in the window, on the first non-blank                                           |
| :white_check_mark: | M                   | go to the middle line in the window, on the first non-blank                                        |
| :white_check_mark: | :1234: L            | go to the Nth line from the bottom, on the first non-blank                                         |
| :arrow_down:       | :1234: go           | go to Nth byte in the buffer                                                                       |
| :arrow_down:       | :[range]go[to][off] | go to [off] byte in the buffer                                                                     |

## Using tags

The following are all marked low priority because VSCode has very good support for tags with Goto Symbol. Try it from the command palette if you haven't yet!

| Status       | Command                | Description                                                           |
| ------------ | ---------------------- | --------------------------------------------------------------------- |
| :arrow_down: | :ta[g][!] {tag}        | jump to tag {tag}                                                     |
| :arrow_down: | :[count]ta[g][!]       | jump to [count]'th newer tag in tag list                              |
| :arrow_down: | CTRL-]                 | jump to the tag under cursor, unless changes have been made           |
| :arrow_down: | :ts[elect][!] [tag]    | list matching tags and select one to jump to                          |
| :arrow_down: | :tj[ump][!] [tag]      | jump to tag [tag] or select from list when there are multiple matches |
| :arrow_down: | :lt[ag][!] [tag]       | jump to tag [tag] and add matching tags to the location list          |
| :arrow_down: | :tagsa                 | print tag list                                                        |
| :arrow_down: | :1234: CTRL-T          | jump back from Nth older tag in tag list                              |
| :arrow_down: | :[count]po[p][!]       | jump back from [count]'th older tag in tag list                       |
| :arrow_down: | :[count]tn[ext][!]     | jump to [count]'th next matching tag                                  |
| :arrow_down: | :[count]tp[revious][!] | jump to [count]'th previous matching tag                              |
| :arrow_down: | :[count]tr[ewind][!]   | jump to [count]'th matching tag                                       |
| :arrow_down: | :tl[ast][!]            | jump to last matching tag                                             |
| :arrow_down: | :pt[ag] {tag}          | open a preview window to show tag {tag}                               |
| :arrow_down: | CTRL-W }               | like CTRL-] but show tag in preview window                            |
| :arrow_down: | :pts[elect]            | like ":tselect" but show tag in preview window                        |
| :arrow_down: | :ptj[ump]              | like ":tjump" but show tag in preview window                          |
| :arrow_down: | :pc[lose]              | close tag preview window                                              |
| :arrow_down: | CTRL-W z               | close tag preview window`                                             |

## Scrolling

| Status             | Command       | Description                                    |
| ------------------ | ------------- | ---------------------------------------------- |
| :white_check_mark: | :1234: CTRL-E | window N lines downwards (default: 1)          |
| :white_check_mark: | :1234: CTRL-D | window N lines Downwards (default: 1/2 window) |
| :white_check_mark: | :1234: CTRL-F | window N pages Forwards (downwards)            |
| :white_check_mark: | :1234: CTRL-Y | window N lines upwards (default: 1)            |
| :white_check_mark: | :1234: CTRL-U | window N lines Upwards (default: 1/2 window)   |
| :white_check_mark: | :1234: CTRL-B | window N pages Backwards (upwards)             |
| :white_check_mark: | z CR or zt    | redraw, current line at top of window          |
| :white_check_mark: | z. or zz      | redraw, current line at center of window       |
| :white_check_mark: | z- or zb      | redraw, current line at bottom of window       |

These only work when 'wrap' is off:

| Status                    | Command   | Description                                   | Note                                                                                                          |
| ------------------------- | --------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| :white_check_mark: :star: | :1234: zh | scroll screen N characters to the right       | In Code, the cursor wil always move when you run this command, whether the horizontal scrollbar moves or not. |
| :white_check_mark: :star: | :1234: zl | scroll screen N characters to the left        | As above                                                                                                      |
| :white_check_mark: :star: | :1234: zH | scroll screen half a screenwidth to the right | As above                                                                                                      |
| :white_check_mark: :star: | :1234: zL | scroll screen half a screenwidth to the left  | As above                                                                                                      |

## Inserting text

| Status             | Command   | Description                                                   |
| ------------------ | --------- | ------------------------------------------------------------- |
| :white_check_mark: | :1234: a  | append text after the cursor (N times)                        |
| :white_check_mark: | :1234: A  | append text at the end of the line (N times)                  |
| :white_check_mark: | :1234: i  | insert text before the cursor (N times) (also: Insert)        |
| :white_check_mark: | :1234: I  | insert text before the first non-blank in the line (N times)  |
| :white_check_mark: | :1234: gI | insert text in column 1 (N times)                             |
| :white_check_mark: | gi        | insert at the end of the last change                          |
| :white_check_mark: | :1234: o  | open a new line below the current line, append text (N times) |
| :white_check_mark: | :1234: O  | open a new line above the current line, append text (N times) |

in Visual block mode:

| Status             | Command | Description                                             |
| ------------------ | ------- | ------------------------------------------------------- |
| :white_check_mark: | I       | insert the same text in front of all the selected lines |
| :white_check_mark: | A       | append the same text after all the selected lines       |

## Insert mode keys

leaving Insert mode:

| Status             | Command          | Description                                 |
| ------------------ | ---------------- | ------------------------------------------- |
| :white_check_mark: | Esc              | end Insert mode, back to Normal mode        |
| :white_check_mark: | CTRL-C           | like Esc, but do not use an abbreviation    |
| :white_check_mark: | CTRL-O {command} | execute {command} and return to Insert mode |

moving around:

| Status             | Command          | Description                             |
| ------------------ | ---------------- | --------------------------------------- |
| :white_check_mark: | cursor keys      | move cursor left/right/up/down          |
| :white_check_mark: | shift-left/right | one word left/right                     |
| :white_check_mark: | shift-up/down    | one screenful backward/forward          |
| :white_check_mark: | End              | cursor after last character in the line |
| :white_check_mark: | Home             | cursor to first character in the line   |

## Special keys in Insert mode

| Status                    | Command                      | Description                                                        | Note                                                                                                                   |
| ------------------------- | ---------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| :arrow_down:              | CTRL-V {char}..              | insert character literally, or enter decimal byte value            |
| :warning:                 | NL or CR or CTRL-M or CTRL-J | begin new line                                                     | CTRL-M and CTRL-J are not supported                                                                                    |
| :white_check_mark:        | CTRL-E                       | insert the character from below the cursor                         |
| :white_check_mark:        | CTRL-Y                       | insert the character from above the cursor                         |
| :white_check_mark: :star: | CTRL-A                       | insert previously inserted text                                    | We apply previously document change made in previous Insert session and we only apply changes that happen under cursor |
| :white_check_mark: :star: | CTRL-@                       | insert previously inserted text and stop Insert mode               | As above                                                                                                               |
| :white_check_mark:        | CTRL-R {0-9a-z%#:.-="}       | insert the contents of a register                                  |
| :white_check_mark:        | CTRL-N                       | insert next match of identifier before the cursor                  |
| :white_check_mark:        | CTRL-P                       | insert previous match of identifier before the cursor              |
| :arrow_down:              | CTRL-X ...                   | complete the word before the cursor in various ways                |
| :white_check_mark:        | BS or CTRL-H                 | delete the character before the cursor                             |
| :white_check_mark:        | Del                          | delete the character under the cursor                              |
| :white_check_mark:        | CTRL-W                       | delete word before the cursor                                      |
| :white_check_mark:        | CTRL-U                       | delete all entered characters in the current line                  |
| :white_check_mark:        | CTRL-T                       | insert one shiftwidth of indent in front of the current line       |
| :white_check_mark:        | CTRL-D                       | delete one shiftwidth of indent in front of the current line       |
| :arrow_down:              | 0 CTRL-D                     | delete all indent in the current line                              |
| :arrow_down:              | ^ CTRL-D                     | delete all indent in the current line, restore indent in next line |

## Digraphs

| Status             | Command                                 | Description                   |
| ------------------ | --------------------------------------- | ----------------------------- |
| :white_check_mark: | :dig[raphs]                             | show current list of digraphs |
| :arrow_down:       | :dig[raphs] {char1}{char2} {number} ... | add digraph(s) to the list    |

## Special inserts

| Status    | Command       | Description                                              |
| --------- | ------------- | -------------------------------------------------------- |
| :warning: | :r [file]     | insert the contents of [file] below the cursor           |
| :warning: | :r! {command} | insert the standard output of {command} below the cursor |

## Deleting text

| Status             | Command          | Description                                        |
| ------------------ | ---------------- | -------------------------------------------------- |
| :white_check_mark: | :1234: x         | delete N characters under and after the cursor     |
| :white_check_mark: | :1234: Del       | delete N characters under and after the cursor     |
| :white_check_mark: | :1234: X         | delete N characters before the cursor              |
| :white_check_mark: | :1234: d{motion} | delete the text that is moved over with {motion}   |
| :white_check_mark: | {visual}d        | delete the highlighted text                        |
| :white_check_mark: | :1234: dd        | delete N lines                                     |
| :white_check_mark: | :1234: D         | delete to the end of the line (and N-1 more lines) |
| :white_check_mark: | :1234: J         | join N-1 lines (delete EOLs)                       |
| :white_check_mark: | {visual}J        | join the highlighted lines                         |
| :white_check_mark: | :1234: gJ        | like "J", but without inserting spaces             |
| :white_check_mark: | {visual}gJ       | like "{visual}J", but without inserting spaces     |
| :white_check_mark: | :[range]d [x]    | delete [range] lines [into register x]             |

## Copying and moving text

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

## Changing text

| Status                    | Command         | Description                                                                                       | Note                     |
| ------------------------- | --------------- | ------------------------------------------------------------------------------------------------- | ------------------------ |
| :white_check_mark:        | :1234: r{char}  | replace N characters with {char}                                                                  |
| :arrow_down:              | :1234: gr{char} | replace N characters without affecting layout                                                     |
| :white_check_mark: :star: | :1234: R        | enter Replace mode (repeat the entered text N times)                                              | {count} is not supported |
| :arrow_down:              | :1234: gR       | enter virtual Replace mode: Like Replace mode but without affecting layout                        |
| :white_check_mark:        | {visual}r{char} | in Visual block, visual, or visual line modes: Replace each char of the selected text with {char} |

(change = delete text and enter Insert mode)

| Status             | Command                 | Description                                                                                     |
| ------------------ | ----------------------- | ----------------------------------------------------------------------------------------------- |
| :white_check_mark: | :1234: c{motion}        | change the text that is moved over with {motion}                                                |
| :white_check_mark: | {visual}c               | change the highlighted text                                                                     |
| :white_check_mark: | :1234: cc               | change N lines                                                                                  |
| :white_check_mark: | :1234: S                | change N lines                                                                                  |
| :white_check_mark: | :1234: C                | change to the end of the line (and N-1 more lines)                                              |
| :white_check_mark: | :1234: s                | change N characters                                                                             |
| :white_check_mark: | {visual}c               | in Visual block mode: Change each of the selected lines with the entered text                   |
| :white_check_mark: | {visual}C               | in Visual block mode: Change each of the selected lines until end-of-line with the entered text |
| :white_check_mark: | {visual}~               | switch case for highlighted text                                                                |
| :white_check_mark: | {visual}u               | make highlighted text lowercase                                                                 |
| :white_check_mark: | {visual}U               | make highlighted text uppercase                                                                 |
| :white_check_mark: | g~{motion}              | switch case for the text that is moved over with {motion}                                       |
| :white_check_mark: | gu{motion}              | make the text that is moved over with {motion} lowercase                                        |
| :white_check_mark: | gU{motion}              | make the text that is moved over with {motion} uppercase                                        |
| :arrow_down:       | {visual}g?              | perform rot13 encoding on highlighted text                                                      |
| :arrow_down:       | g?{motion}              | perform rot13 encoding on the text that is moved over with {motion}                             |
| :white_check_mark: | :1234: CTRL-A           | add N to the number at or after the cursor                                                      |
| :white_check_mark: | :1234: CTRL-X           | subtract N from the number at or after the cursor                                               |
| :white_check_mark: | :1234: <{motion}        | move the lines that are moved over with {motion} one shiftwidth left                            |
| :white_check_mark: | :1234: <<               | move N lines one shiftwidth left                                                                |
| :white_check_mark: | :1234: >{motion}        | move the lines that are moved over with {motion} one shiftwidth right                           |
| :white_check_mark: | :1234: >>               | move N lines one shiftwidth right                                                               |
| :white_check_mark: | :1234: gq{motion}       | format the lines that are moved over with {motion} to 'textwidth' length                        |
| :arrow_down:       | :[range]ce[nter][width] | center the lines in [range]                                                                     |
| :arrow_down:       | :[range]le[ft][indent]  | left-align the lines in [range] (with [indent])                                                 |
| :arrow_down:       | :[ranee]ri[ght][width]  | right-align the lines in [range]                                                                |

## Complex changes

| Status                              | Command                                        | Description                                                                                                                           | Note                                                                             |
| ----------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| :arrow_down:                        | :1234: `!{motion}{command}<CR>`                | filter the lines that are moved over through {command}                                                                                |
| :arrow_down:                        | :1234: `!!{command}<CR>`                       | filter N lines through {command}                                                                                                      |
| :arrow_down:                        | `{visual}!{command}<CR>`                       | filter the highlighted lines through {command}                                                                                        |
| :arrow_down:                        | `:[range]! {command}<CR>`                      | filter [range] lines through {command}                                                                                                |
| :white_check_mark:                  | :1234: ={motion}                               | filter the lines that are moved over through 'equalprg'                                                                               |
| :white_check_mark:                  | :1234: ==                                      | filter N lines through 'equalprg'                                                                                                     |
| :white_check_mark:                  | {visual}=                                      | filter the highlighted lines through 'equalprg'                                                                                       |
| :white_check_mark: :star: :warning: | :[range]s[ubstitute]/{pattern}/{string}/[g][c] | substitute {pattern} by {string} in [range] lines; with [g], replace all occurrences of {pattern}; with [c], confirm each replacement | Currently we only support JavaScript Regex and only options `gi` are implemented |
| :arrow_down:                        | :[range]s[ubstitute][g][c]                     | repeat previous ":s" with new range and options                                                                                       |
| :arrow_down:                        | &                                              | Repeat previous ":s" on current line without options                                                                                  |
| :arrow_down:                        | :[range]ret[ab][!] [tabstop]                   | set 'tabstop' to new value and adjust white space accordingly                                                                         |

## Visual mode

| Status             | Command | Description                                         |
| ------------------ | ------- | --------------------------------------------------- |
| :white_check_mark: | v       | start highlighting characters or stop highlighting  |
| :white_check_mark: | V       | start highlighting linewise or stop highlighting    |
| :white_check_mark: | CTRL-V  | start highlighting blockwise or stop highlighting   |
| :white_check_mark: | o       | exchange cursor position with start of highlighting |
| :white_check_mark: | gv      | start highlighting on previous visual area          |

## Text objects (only in Visual mode or after an operator)

| Status             | Command                                           | Description                                                 |
| ------------------ | ------------------------------------------------- | ----------------------------------------------------------- |
| :white_check_mark: | :1234: aw                                         | Select "a word"                                             |
| :white_check_mark: | :1234: iw                                         | Select "inner word"                                         |
| :white_check_mark: | :1234: aW                                         | Select "a WORD"                                             |
| :white_check_mark: | :1234: iW                                         | Select "inner WORD"                                         |
| :white_check_mark: | :1234: as                                         | Select "a sentence"                                         |
| :white_check_mark: | :1234: is                                         | Select "inner sentence"                                     |
| :white_check_mark: | :1234: ap                                         | Select "a paragraph"                                        |
| :white_check_mark: | :1234: ip                                         | Select "inner paragraph"                                    |
| :white_check_mark: | :1234: a], a[                                     | select '[' ']' blocks                                       |
| :white_check_mark: | :1234: i], i[                                     | select inner '[' ']' blocks                                 |
| :white_check_mark: | :1234: ab, a(, a)                                 | Select "a block" (from "[(" to "])")                        |
| :white_check_mark: | :1234: ib, i), i(                                 | Select "inner block" (from "[(" to "])")                    |
| :white_check_mark: | :1234: a>, a<                                     | Select "a &lt;&gt; block"                                   |
| :white_check_mark: | :1234: i>, i<                                     | Select "inner <> block"                                     |
| :white_check_mark: | :1234: aB, a{, a}                                 | Select "a Block" (from "[{" to "]}")                        |
| :white_check_mark: | :1234: iB, i{, i}                                 | Select "inner Block" (from "[{" to "]}")                    |
| :white_check_mark: | :1234: at                                         | Select "a tag block" (from &lt;aaa&gt; to &lt;/aaa&gt;)     |
| :white_check_mark: | :1234: it                                         | Select "inner tag block" (from &lt;aaa&gt; to &lt;/aaa&gt;) |
| :white_check_mark: | :1234: a'                                         | Select "a single quoted string"                             |
| :white_check_mark: | :1234: i'                                         | Select "inner single quoted string"                         |
| :white_check_mark: | :1234: a"                                         | Select "a double quoted string"                             |
| :white_check_mark: | :1234: i"                                         | Select "inner double quoted string"                         |
| :white_check_mark: | :1234: a` | Select "a backward quoted string"     |
| :white_check_mark: | :1234: i` | Select "inner backward quoted string" |

## Repeating commands

| Status                    | Command                           | Description                                                                                        | Note                                                                |
| ------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| :white_check_mark: :star: | :1234: .                          | repeat last change (with count replaced with N)                                                    | Content changes that don't happen under cursor can not be repeated. |
| :white_check_mark:        | q{a-z}                            | record typed characters into register {a-z}                                                        |
| :arrow_down:              | q{A-Z}                            | record typed characters, appended to register {a-z}                                                |
| :white_check_mark:        | q                                 | stop recording                                                                                     |
| :white_check_mark:        | :1234: @{a-z}                     | execute the contents of register {a-z} (N times)                                                   |
| :white_check_mark:        | :1234: @@                         | repeat previous @{a-z} (N times)                                                                   |
| :arrow_down:              | :@{a-z}                           | execute the contents of register {a-z} as an Ex command                                            |
| :arrow_down:              | :@@                               | repeat previous :@{a-z}                                                                            |
| :arrow_down:              | :[range]g[lobal]/{pattern}/[cmd]  | execute Ex command [cmd](default: ':p') on the lines within [range] where {pattern} matches        |
| :arrow_down:              | :[range]g[lobal]!/{pattern}/[cmd] | execute Ex command [cmd](default: ':p') on the lines within [range] where {pattern} does NOT match |
| :arrow_down:              | :so[urce] {file}                  | read Ex commands from {file}                                                                       |
| :arrow_down:              | :so[urce]! {file}                 | read Vim commands from {file}                                                                      |
| :arrow_down:              | :sl[eep][sec]                     | don't do anything for [sec] seconds                                                                |
| :arrow_down:              | :1234: gs                         | goto Sleep for N seconds                                                                           |

## options

| Status                    | Command                  | Description                                                                                                       | Note                                 |
| ------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| :arrow_down:              | :se[t]                   | show all modified options                                                                                         |
| :arrow_down:              | :se[t] all               | show all non-termcap options                                                                                      |
| :arrow_down:              | :se[t] termcap           | show all termcap options                                                                                          |
| :white_check_mark:        | :se[t] {option}          | set boolean option (switch it on), show string or number option                                                   |
| :white_check_mark:        | :se[t] no{option}        | reset boolean option (switch it off)                                                                              |
| :white_check_mark:        | :se[t] inv{option}       | invert boolean option                                                                                             |
| :white_check_mark:        | :se[t] {option}={value}  | set string/number option to {value}                                                                               |
| :white_check_mark:        | :se[t] {option}+={value} | append {value} to string option, add {value} to number option                                                     |
| :white_check_mark: :star: | :se[t] {option}-={value} | remove {value} to string option, subtract {value} from number option                                              | We don't support string option here. |
| :white_check_mark:        | :se[t] {option}?         | show value of {option}                                                                                            |
| :arrow_down:              | :se[t] {option}&         | reset {option} to its default value                                                                               |
| :arrow_down:              | :setl[ocal]              | like ":set" but set the local value for options that have one                                                     |
| :arrow_down:              | :setg[lobal]             | like ":set" but set the global value of a local option                                                            |
| :arrow_down:              | :fix[del]                | set value of 't_kD' according to value of 't_kb'                                                                  |
| :arrow_down:              | :opt[ions]               | open a new window to view and set options, grouped by functionality, a one line explanation and links to the help |

Since the list is too long, now we just put those already supported options here.

| Status             | Command         | Default Value                                                   | Description                                                                                                                                |
| ------------------ | --------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| :white_check_mark: | tabstop (ts)    | 4. we use Code's default value `tabSize` instead of Vim         | number of spaces that &lt;Tab&gt; in file uses                                                                                             |
| :white_check_mark: | hlsearch (hls)  | false                                                           | When there is a previous search pattern, highlight all its matches.                                                                        |
| :white_check_mark: | ignorecase (ic) | true                                                            | Ignore case in search patterns.                                                                                                            |
| :white_check_mark: | smartcase (scs) | true                                                            | Override the 'ignorecase' option if the search pattern contains upper case characters.                                                     |
| :white_check_mark: | iskeyword (isk) | `@,48-57,_,128-167,224-235`                                     | keywords contain alphanumeric characters and '\_'. If there is no user setting for `iskeyword`, we use `editor.wordSeparators` properties. |
| :white_check_mark: | scroll (scr)    | 20                                                              | Number of lines to scroll with CTRL-U and CTRL-D commands.                                                                                 |
| :white_check_mark: | expandtab (et)  | True. we use Code's default value `insertSpaces` instead of Vim | use spaces when &lt;Tab&gt; is inserted                                                                                                    |
| :white_check_mark: | autoindent      | true                                                            | Keep indentation when doing `cc` or `S` in normal mode to replace a line.                                                                  |

## Undo/Redo commands

| Status             | Command       | Description                | Note                                                       |
| ------------------ | ------------- | -------------------------- | ---------------------------------------------------------- |
| :white_check_mark: | :1234: u      | undo last N changes        | Current implementation may not cover every case perfectly. |
| :white_check_mark: | :1234: CTRL-R | redo last N undone changes | As above.                                                  |
| :white_check_mark: | U             | restore last changed line  |

## External commands

| Status       | Command     | Description                                                                |
| ------------ | ----------- | -------------------------------------------------------------------------- |
| :arrow_down: | :sh[ell]    | start a shell                                                              |
| :arrow_down: | :!{command} | execute {command} with a shell                                             |
| :arrow_down: | K           | lookup keyword under the cursor with 'keywordprg' program (default: "man") |

## Ex ranges

| Status                    | Command       | Description                                                                  | Note                                 |
| ------------------------- | ------------- | ---------------------------------------------------------------------------- | ------------------------------------ |
| :white_check_mark:        | ,             | separates two line numbers                                                   |
| :white_check_mark: :star: | ;             | idem, set cursor to the first line number before interpreting the second one | The cursor movement is not included. |
| :white_check_mark:        | {number}      | an absolute line number                                                      |
| :white_check_mark:        | .             | the current line                                                             |
| :white_check_mark:        | \$            | the last line in the file                                                    |
| :white_check_mark:        | %             | equal to 1,\$ (the entire file)                                              |
| :white_check_mark:        | \*            | equal to '<,'> (visual area)                                                 |
| :white_check_mark:        | 't            | position of mark t                                                           |
| :arrow_down:              | /{pattern}[/] | the next line where {pattern} matches                                        |
| :arrow_down:              | ?{pattern}[?] | the previous line where {pattern} matches                                    |
| :white_check_mark:        | +[num]        | add [num] to the preceding line number (default: 1)                          |
| :white_check_mark:        | -[num]        | subtract [num] from the preceding line number (default: 1)                   |

## Editing a file

| Status                    | Command        | Description  | Note                                                                                        |
| ------------------------- | -------------- | ------------ | ------------------------------------------------------------------------------------------- |
| :white_check_mark: :star: | :e[dit] {file} | Edit {file}. | We will open file in a new Tab of current Grouped Editor instead of opening in current tab. |

## Multi-window commands

| Status                    | Command           | Description                                                             | Note                                                                                                                   |
| ------------------------- | ----------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| :white_check_mark: :star: | :e[dit] {file}    | Edit {file}.                                                            | We will open file in a new Tab of current Grouped Editor instead of opening in current tab.                            |
| :white_check_mark: :star: | &lt;ctrl-w&gt; hl | Switching between windows.                                              | As we don't have the concept of Window in VS Code, we are mapping these commands to switching between Grouped Editors. |
| :white_check_mark:        | :sp {file}        | Split current window in two.                                            |                                                                                                                        |
| :white_check_mark: :star: | :vsp {file}       | Split vertically current window in two.                                 |                                                                                                                        |
| :white_check_mark:        | &lt;ctrl-w&gt; s  | Split current window in two.                                            |                                                                                                                        |
| :white_check_mark: :star: | &lt;ctrl-w&gt; v  | Split vertically current window in two.                                 |                                                                                                                        |
| :white_check_mark:        | :new              | Create a new window horizontally and start editing an empty file in it. |                                                                                                                        |
| :white_check_mark: :star: | :vne[w]           | Create a new window vertically and start editing an empty file in it.   |                                                                                                                        |

## Tabs

| Status                    | Command                              | Description                                                                   | Note                                                               |
| ------------------------- | ------------------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| :white_check_mark:        | :tabn[ext] :1234:                    | Go to next tab page or tab page {count}. The first tab page has number one.   |
| :white_check_mark:        | {count}&lt;C-PageDown&gt;, {count}gt | Same as above                                                                 |
| :white_check_mark:        | :tabp[revious] :1234:                | Go to the previous tab page. Wraps around from the first one to the last one. |
| :white_check_mark:        | :tabN[ext] :1234:                    | Same as above                                                                 |
| :white_check_mark:        | {count}&lt;C-PageUp&gt;, {count}gT   | Same as above                                                                 |
| :white_check_mark:        | :tabfir[st]                          | Go to the first tab page.                                                     |
| :white_check_mark:        | :tabl[ast]                           | Go to the last tab page.                                                      |
| :white_check_mark:        | :tabe[dit] {file}                    | Open a new tab page with an empty window, after the current tab page          |
| :arrow_down:              | :[count]tabe[dit], :[count]tabnew    | Same as above                                                                 | [count] is not supported.                                          |
| :white_check_mark:        | :tabnew {file}                       | Open a new tab page with an empty window, after the current tab page          |
| :arrow_down:              | :[count]tab {cmd}                    | Execute {cmd} and when it opens a new window open a new tab page instead.     |
| :white_check_mark: :star: | :tabc[lose][!] :1234:                | Close current tab page or close tab page {count}.                             | Code will close tab directly without saving.                       |
| :white_check_mark: :star: | :tabo[nly][!]                        | Close all other tab pages.                                                    | `!` is not supported, Code will close tab directly without saving. |
| :white_check_mark:        | :tabm[ove][n]                        | Move the current tab page to after tab page N.                                |
| :arrow_down:              | :tabs                                | List the tab pages and the windows they contain.                              | You can always use Code's built-in shortcut: `cmd/ctrl+p`          |
| :arrow_down:              | :tabd[o] {cmd}                       | Execute {cmd} in each tab page.                                               |

## Folding

### Fold methods

The folding method can be set with the 'foldmethod' option. This is currently not possible as we are relying on Code's Fold logic.

### Fold commands

Pretty much everything fold-related is blocked by [this issue](https://github.com/VSCodeVim/Vim/issues/1004).

| Status             | Command                  | Description                                                                                                  |
| ------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| :arrow_down:       | zf{motion} or {Visual}zf | Operator to create a fold.                                                                                   |
| :arrow_down:       | zF                       | Create a fold for [count] lines. Works like "zf".                                                            |
| :arrow_down:       | zd                       | Delete one fold at the cursor.                                                                               |
| :arrow_down:       | zD                       | Delete folds recursively at the cursor.                                                                      |
| :arrow_down:       | zE                       | Eliminate all folds in the window.                                                                           |
| :white_check_mark: | zo                       | Open one fold under the cursor.When a count is given, that many folds deep will be opened.                   |
| :white_check_mark: | zO                       | Open all folds under the cursor recursively.                                                                 |
| :white_check_mark: | zc                       | Close one fold under the cursor. When a count is given, that many folds deep are closed.                     |
| :white_check_mark: | zC                       | Close all folds under the cursor recursively.                                                                |
| :arrow_down:       | za                       | When on a closed fold: open it. When on an open fold: close it and set 'foldenable'.                         |
| :arrow_down:       | zA                       | When on a closed fold: open it recursively. When on an open fold: close it recursively and set 'foldenable'. |
| :arrow_down:       | zv                       | View cursor line: Open just enough folds to make the line in which the cursor is located not folded.         |
| :arrow_down:       | zx                       | Update folds: Undo manually opened and closed folds: re-apply 'foldlevel', then do "zv": View cursor line.   |
| :arrow_down:       | zX                       | Undo manually opened and closed folds                                                                        |
| :arrow_down:       | zm                       | Fold more: Subtract one from 'foldlevel'.                                                                    |
| :white_check_mark: | zM                       | Close all folds: set 'foldlevel' to 0. 'foldenable' will be set.                                             |
| :arrow_down:       | zr                       | Reduce folding: Add one to 'foldlevel'.                                                                      |
| :white_check_mark: | zR                       | Open all folds. This sets 'foldlevel' to highest fold level.                                                 |
| :arrow_down:       | zn                       | Fold none: reset 'foldenable'. All folds will be open.                                                       |
| :arrow_down:       | zN                       | Fold normal: set 'foldenable'. All folds will be as they were before.                                        |
| :arrow_down:       | zi                       | Invert 'foldenable'.                                                                                         |
| :arrow_down:       | [z                       | Move to the start of the current open fold.                                                                  |
| :arrow_down:       | ]z                       | Move to the end of the current open fold.                                                                    |
| :arrow_down:       | zj                       | Move downwards to the start of the next fold.                                                                |
| :arrow_down:       | zk                       | Move upwards to the end of the previous fold.                                                                |

### Fold options

Currently we don't support any fold option and we are following Code configurations.
