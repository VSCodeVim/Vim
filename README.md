[![Build Status](https://travis-ci.org/VSCodeVim/Vim.svg?branch=master)](https://travis-ci.org/VSCodeVim/Vim) [![Slack Status](https://vscodevim-slackin.azurewebsites.net/badge.svg)](https://vscodevim-slackin.azurewebsites.net)

# Vim

Vim (aka. VSCodeVim) is a [Visual Studio Code](https://code.visualstudio.com/) extension that enables the power of the Vim keybinding experience within Visual Studio Code. This is a _work in progress_ and contributions are welcomed and loved!

![Screenshot](images/screen.png)

## Install

1. Within Visual Studio Code, open the command palette (`Ctrl-Shift-P` / `Cmd-Shift-P`)
2. Select `Install Extension` and search for 'vim' *or* run `ext install vim`

## Configure

Adjust configurations through user settings (File -> Preferences -> User Settings).

* vim.keyboardLayout: 
    * Supported Values: `en-US (QWERTY)` (default), `es-ES (QWERTY)`, `de-DE (QWERTZ)`, `da-DK (QWERTY)`

Keybindings can be overridden for a mode by supplying a `{string: string}` object defining what key(s) should perform a given action. 

_Note_: Currently, by defining keybindings for a mode, all bindings for that mode will be overridden. This should be fixed in a future update.

Example:
```json
{
    "vim.normalModeKeyBindings": {
        "d": "DeleteChar",
        "D": "DeleteLastChar"
    },
    "vim.insertModeKeyBindings": {
        "e": "InsertAtCursor",
        "E": "InsertAfterCursor"
    }
}
```

* vim.normalModeKeyBindings
    * Supported Actions:

    ```
    MoveUp
    MoveDown
    MoveLeft
    MoveRight

    MoveLineBegin
    MoveLineEnd
    MoveWordBegin
    MoveWordEnd
    MoveFullWordBegin
    MoveFullWordEnd
    MoveLastWord
    MoveLastFullWord
    MoveLastWordEnd
    MoveLastFullWordEnd

    MoveFullPageUp
    MoveFullPageDown

    MoveParagraphBegin
    MoveParagraphEnd

    MoveNonBlank
    MoveNonBlankFirst
    MoveNonBlankLast
    MoveMatchingBracket

    // Find
    Find
    
    // Folding
    Fold
    Unfold
    FoldAll
    UnfoldAll
    
    // Text Modification
    Undo
    Redo
    Copy
    Paste

    ChangeWord
    ChangeFullWord
    ChangeCurrentWord
    ChangeCurrentWordToNext
    ChangeToLineEnd

    DeleteLine
    DeleteToNextWord
    DeleteToFullNextWord
    DeleteToWordEnd
    DeleteToFullWordEnd
    DeleteToWordBegin
    DeleteToFullWordBegin
    DeleteToLineEnd

    DeleteChar
    DeleteLastChar

    Indent
    Outdent

    // Misc
    EnterCommand
    ExitMessages
   ```

* vim.insertModeKeyBindings
    * Supported Actions:
    ```
    // Enter insert mode
    InsertAtCursor
    InsertAtLineBegin
    InsertAfterCursor
    InsertAtLineEnd
    InsertNewLineBelow
    InsertNewLineAbove
   ```

* vim.visualModeKeyBindings
   * Supported Actions:
   ```
    EnterVisualMode
   ```
    
## Project Status

Check out our [release notes](https://github.com/VSCodeVim/Vim/releases) for more notes. The tables below are obviously an incomplete list, but show, at a glance, the current commands supported:

### Keys in Insert Mode
Status              | Key                       | Description
------------------- | ------------------------- | -------------------------
:white_check_mark:  | Esc                       | end Insert mode, back to Normal mode
:white_check_mark:  | `Ctrl+[`                  | Command Mode

### Writing and Quitting
Status              | Key                       | Description
------------------- | ------------------------- | -------------------------
:white_check_mark:  | :                         | Open command palette
:white_check_mark:  | :q                        | Quit current buffer, unless changes have been made.  Exit Vim when there are no other                         non-help buffers
:white_check_mark:  | :w                        | Write the current file and exit.

### Motions

#### Left-Right Motions
Status              | Key                       | Description
------------------- | ------------------------- | -------------------------
:white_check_mark:  | h                         | left (also: CTRL-H, <BS>, or <Left> key)
:white_check_mark:  | l                         | right (also: <Space> or <Right> key)
:white_check_mark:  | 0                         | to first character in the line (also: <Home> key)
:white_check_mark:  | ^                         | to first non-blank character in the line
:white_check_mark:  | $                         | to the last character in the line (N-1 lines lower)
                    | g0                        | to first character in screen line (differs from "0" when lines wrap)
                    | g^                        | to first non-blank character in screen line (differs from "^" when lines wrap)
                    | g$                        | to last character in screen line (differs from "$" when lines wrap)
                    | &#124;                    | to column N (default: 1)
                    | f<char>                   | to the Nth occurrence of <char> to the right
                    | F<char>                   | to the Nth occurrence of <char> to the left
                    | t<char>                   | till before the Nth occurrence of <char> to the right
                    | T<char>                   | till before the Nth occurrence of <char> to the left
                    | ;                         | repeat the last "f", "F", "t", or "T" N times
                    | ,                         | repeat the last "f", "F", "t", or "T" N times in opposite direction

#### Up-Down Motions
Status              | Key                       | Description
------------------- | ------------------------- | -------------------------
:white_check_mark:  | k                         | up (also: CTRL-P and <Up>)
:white_check_mark:  | j                         | down (also: CTRL-J, CTRL-N, <NL>, and <Down>)
                    | -                         | up, on the first non-blank character
                    | +                         | down, on the first non-blank character (also: CTRL-M and <CR>)
                    | _                         | down N-1 lines, on the first non-blank character
:white_check_mark:  | G                         | goto last line, on the first non-blank character
:white_check_mark:  | gg                        | goto frst line, on the firstnon-blank character
                    | %                         | goto line N percentage down in the file.  N must be given, otherwise it is the % command.
matching brace      | %                         | jump to matching brace, C-style comment, C/C++ preprocessor conditional                   
                    | gk                        | up N screen lines (differs from "k" when line wraps)
                    | gj                        | down N screen lines (differs from "j" when line wraps)
:white_check_mark:  | CTRL-F                    | page down
:white_check_mark:  | CTRL-B                    | page up

#### Word Motions
Status              | Key                       | Description
------------------- | ------------------------- | -------------------------
:white_check_mark:  | w                         | words forward
:white_check_mark:  | W                         | N blank-separated WORDS forward
:white_check_mark:  | e                         | forward to the end of the word
:white_check_mark:  | E                         | forward to the end of the Nth blank-separated WORD
:white_check_mark:  | b                         | words backward
:white_check_mark:  | B                         | N blank-separated WORDS backward
:white_check_mark:  | ge                        | backward to the end of the Nth word
:white_check_mark:  | gE                        | backward to the end of the Nth blank-separated WORD

### Insert Mode Commands
Status              | Key                       | Description
------------------- | ------------------------- | -------------------------
:white_check_mark:  | a                         | append text after the cursor
:white_check_mark:  | A                         | append text at the end of the line (N times)
:white_check_mark:  | i                         | insert text before the cursor (N times) (also: <Insert>)
:white_check_mark:  | I                         | insert text before the first non-blank in the line (N times)
:white_check_mark:  | o                         | open a new line below the current line, append text (N times)
:white_check_mark:  | O                         | open a new line above the current line, append text (N times)

### Deleting Text
Status                 | Key                       | Description
---------------------- | ------------------------- | -------------------------
:white_check_mark:     | x                         | delete characters under and after the cursor
                       | <Del>                     | delete N characters under and after the cursor
:white_check_mark:     | X                         | delete N characters before the cursor
dw, dW, db, dB, de, dE | d{motion}                 | delete the text that is moved over with {motion}
                       | {visual}d                 | delete the highlighted text
:white_check_mark:     | dd                        | delete N lines
:white_check_mark:     | D                         | delete to end-of-line (and N-1 more lines)
                       | J                         | join N-1 lines (delete newlines)
                       | {visual}J                 | join the highlighted lines

### Deleting and Inserting
Status                 | Key                       | Description
---------------------- | ------------------------- | -------------------------
:white_check_mark:     | C                         | Delete from the cursor position to the end of the line and enter insert mode
:white_check_mark:     | cw                        | Delete from the cursor position to the end of the word and enter insert mode
:white_check_mark:     | cW                        | Delete from the cursor position to the end of the WORD and enter insert mode
:white_check_mark:     | ciw                       | Delete word and enter insert mode
:white_check_mark:     | caw                       | Delete word, right-side blanks and enter insert mode
:white_check_mark:     | s                         | Delete character under cursor and enter insert mode

### Changing Text
Status              | Key                       | Description
------------------- | ------------------------- | -------------------------
:white_check_mark:  | <<                        | move N lines one shiftwidth left
:white_check_mark:  | >>                        | move N lines one shiftwidth right

### Undo/Redo

Status              | Key                       | Description
------------------- | ------------------------- | -------------------------
:white_check_mark:  | u                         | undo last change
:white_check_mark:  | CTRL-R                    | redo last undone change
                    | U                         | restore last changed line

## Contributing

This project is maintained by a group of awesome [contributors](https://github.com/VSCodeVim/Vim/graphs/contributors). *Thank you!* :heart: 

## License

[MIT](LICENSE.txt)
