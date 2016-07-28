## Key

:white_check_mark: - command done

:warning: - command partially implemented

:arrow_down: - command is low priority; open an issue (or thumbs up the relevant issue) if you want to see it sooner

:x: - command impossible with current VSCode API

:1234: - command accepts numeric prefix

## Roadmap

These are the big Vim features, put generally in the order in which we plan to implement them.

Status | Command
---|--------
:white_check_mark: | Normal Mode
:white_check_mark: | Insert Mode
:white_check_mark: | Visual Mode
:white_check_mark: | Visual Line Mode
:white_check_mark: | Number Prefixes
:white_check_mark: | . Operator
:warning: | Searching with / and ?
:white_check_mark: | Correct Undo/Redo
:warning: | Command Remapping
:warning:  | Marks
:white_check_mark: | Text Objects
:white_check_mark: | Visual Block Mode
:warning: | Replace Mode
 | Multiple Select Mode
 | Macros
:warning: | Buffer/Window/Tab


Now follows an exhaustive list of every known Vim command that we could find.

## Left-right motions

Status | Command | Description
---|--------|------------
:white_check_mark:   |:1234:  h	| 	left (also: CTRL-H, BS, or Left key)
:white_check_mark:   |:1234:  l	| 	right (also: Space or Right key)
:white_check_mark:   |   0		| to first character in the line (also: Home key)
:white_check_mark:   |   ^		| to first non-blank character in the line
:white_check_mark:   |:1234:  $	| to the last character in the line (N-1 lines lower) (also: End key)
:white_check_mark:   |   g0		| to first character in screen line (differs from "0" when lines wrap)
:white_check_mark:   |   g^		| to first non-blank character in screen line (differs from "^" when lines wrap)
:white_check_mark:   |:1234:  g$    	| to last character in screen line (differs from "$" when lines wrap)
:white_check_mark:   |   gm		| to middle of the screen line
:white_check_mark:   |:1234:  \|	| to column N (default: 1)
:white_check_mark:   |:1234:  f{char}	| to the Nth occurrence of {char} to the right
:white_check_mark:   |:1234:  F{char}	| to the Nth occurrence of {char} to the left
:white_check_mark:   |:1234:  t{char}	| till before the Nth occurrence of {char} to the right
:white_check_mark:   |:1234:  T{char}	| till before the Nth occurrence of {char} to the left
   |:1234:  ;	| repeat the last "f", "F", "t", or "T" N times
   |:1234:  ,	| repeat the last "f", "F", "t", or "T" N times in opposite direction

## Up-down motions

Status | Command | Description
---|--------|------------
:white_check_mark:   | :1234:  k		| up N lines (also: CTRL-P and Up)
:white_check_mark:   | :1234:  j		| up N lidown N lines (also: CTRL-J, CTRL-N, NL, and Down)
:white_check_mark:   | :1234:  -		| up N lines, on the first non-blank character
:white_check_mark:   | :1234:  +		| down N lines, on the first non-blank character (also: CTRL-M and CR)
:white_check_mark:   | :1234:  _		| down N-1 lines, on the first non-blank character
:white_check_mark:   | :1234:  G		| goto line N (default: last line), on the first non-blank character
:white_check_mark:   | :1234:  gg		| goto line N (default: first line), on the first non-blank character
:white_check_mark:   | :1234:  %		| goto line N percentage down in the file; N must be given, otherwise it is the |%| command
:white_check_mark:   | :1234:  gk		| up N screen lines (differs from "k" when line wraps)
:white_check_mark:   | :1234:  gj		| own N screen lines (differs from "j" when line wraps)

## Text object motions

Status | Command | Description
---|--------|------------
:white_check_mark:   | :1234:  w		| N words forward
:white_check_mark:   | :1234:  W		| N blank-separated |WORD|s forward
:white_check_mark:   | :1234:  e		| N words forward to the end of the Nth word
:white_check_mark:   | :1234:  E		| N words forward to the end of the Nth blank-separated |WORD|
:white_check_mark:   | :1234:  b		| N words backward
:white_check_mark:   | :1234:  B		| N blank-separated |WORD|s backward
:white_check_mark:   | :1234:  ge		| N words backward to the end of the Nth word
:white_check_mark:   | :1234:  gE		| N words backward to the end of the Nth blank-separated |WORD|
:white_check_mark:   | :1234:  )		| N sentences forward
:white_check_mark:   | :1234:  (		| N sentences backward
:white_check_mark:   | :1234:  }		| N paragraphs forward
:white_check_mark:   | :1234:  {		| N paragraphs backward
:white_check_mark:   | :1234:  ]]		| N sections forward, at start of section
:white_check_mark:   | :1234:  [[		| N sections backward, at start of section
:white_check_mark:   | :1234:  ][		| N sections forward, at end of section
:white_check_mark:   | :1234:  []		| N sections backward, at end of section
:white_check_mark:   | :1234:  [(		| N times back to unclosed '('
:white_check_mark:   | :1234:  [{		| N times back to unclosed '{'
:arrow_down:   | :1234:  [m		| N times back to start of method (for Java)
:arrow_down:   | :1234:  [M		| N times back to end of method (for Java)
:white_check_mark:   | :1234:  ])		| N times forward to unclosed ')'
:white_check_mark:   | :1234:  ]}		| N times forward to unclosed '}'
:arrow_down:   | :1234:  ]m		| N times forward to start of method (for Java)
:arrow_down:   | :1234:  ]M		| N times forward to end of method (for Java)
:arrow_down:   | :1234:  [#		| N times back to unclosed "#if" or "#else"
:arrow_down:   | :1234:  ]#		| N times forward to unclosed "#else" or "#endif"
:arrow_down:   | :1234:  [*		| N times back to start of a C comment "/*"
:arrow_down:   | :1234:  ]*		| N times forward to end of a C comment "*/"

## Various motions

Status | Command | Description
---|--------|------------------------------
:white_check_mark:    |   %		        | find the next brace, bracket, comment, or "#if"/ "#else"/"#endif" in this line and go to its match
:white_check_mark:    |:1234:  H		        | go to the Nth line in the window, on the first non-blank
:white_check_mark:    |        M		        | go to the middle line in the window, on the first non-blank
:white_check_mark:    |:1234:  L		        | go to the Nth line from the bottom, on the first non-blank
    |:1234:  go			| go to Nth byte in the buffer
    |:[range]go[to] [off]	| go to [off] byte in the buffer

These only work when 'wrap' is off:

Status | Command | Description
---|--------|------------------------------
  :x:  | :1234:  zh	|	scroll screen N characters to the right
 :x:   | :1234:  zl	|	scroll screen N characters to the left
  :x:  | :1234:  zH	|	scroll screen half a screenwidth to the right
:x:   | :1234:  zL	|	scroll screen half a screenwidth to the left

## Inserting text

Status | Command | Description
---|--------|------------------------------
:white_check_mark:    | :1234:  a	| append text after the cursor (N times)
:white_check_mark:    | :1234:  A	| append text at the end of the line (N times)
:white_check_mark:    | :1234:  i	| insert text before the cursor (N times) (also: Insert)
:white_check_mark:    | :1234:  I	| insert text before the first non-blank in the line (N times)
:white_check_mark:    | :1234:  gI	| insert text in column 1 (N times)
:white_check_mark:    | :1234:  o	| open a new line below the current line, append text (N times)
:white_check_mark:    | :1234:  O	| open a new line above the current line, append text (N times)

in Visual block mode:

Status | Command | Description
---|--------|------------------------------
   | I	| insert the same text in front of all the selected lines
   | A	| append the same text after all the selected lines

## Insert mode keys

leaving Insert mode:

Status | Command | Description
---|--------|------------------------------
:white_check_mark:   | Esc		 | end Insert mode, back to Normal mode
:white_check_mark:   | CTRL-C		 | like Esc, but do not use an abbreviation
:arrow_down:   | CTRL-O {command}    | execute {command} and return to Insert mode

moving around:

Status | Command | Description
---|--------|------------------------------
:white_check_mark:   | cursor keys	| move cursor left/right/up/down
:white_check_mark:   | shift-left/right   | one word left/right
:white_check_mark:   | shift-up/down	| one screenful backward/forward
:white_check_mark:   | End		| cursor after last character in the line
:white_check_mark:   | Home		| cursor to first character in the line

## Deleting text

Status | Command | Description
---|--------|------------------------------
:white_check_mark:    | :1234:  x		| delete N characters under and after the cursor
:white_check_mark:    | :1234:  Del	    | delete N characters under and after the cursor
:white_check_mark:    | :1234:  X		| delete N characters before the cursor
:white_check_mark:    | :1234:  d{motion}	| delete the text that is moved over with {motion}
:white_check_mark:    |    {visual}d	| delete the highlighted text
:white_check_mark:    | :1234:  dd	| 	delete N lines
:white_check_mark:    | :1234:  D		| delete to the end of the line (and N-1 more lines)
:white_check_mark:    | :1234:  J		| join N-1 lines (delete EOLs)
    |    {visual}J	| join the highlighted lines
:white_check_mark:    | :1234:  gJ	| 	like "J", but without inserting spaces
    |    {visual}gJ	| like "{visual}J", but without inserting spaces
    | :[range]d [x]	| delete [range] lines [into register x]

## Copying and moving text

Status | Command | Description
---|--------|------------------------------
:warning:   | "{char}	        | use register {char} for the next delete, yank, or put
:white_check_mark:   | "*	        | use register `*` to access system clipboard
   | :reg		| show the contents of all registers
   | :reg {arg}	        | show the contents of registers mentioned in {arg}
:white_check_mark:   | :1234:  y{motion}	| yank the text moved over with {motion} into a register
:white_check_mark:   |    {visual}y	| yank the highlighted text into a register
:white_check_mark:   | :1234:  yy		| yank N lines into a register
:warning:   | :1234:  Y		| yank N lines into a register
:white_check_mark:   | :1234:  p		| put a register after the cursor position (N times)
:white_check_mark:   | :1234:  P		| put a register before the cursor position (N times)
:white_check_mark:   | :1234:  ]p		| like p, but adjust indent to current line
:white_check_mark:   | :1234:  [p		| like P, but adjust indent to current line
:white_check_mark:   | :1234:  gp		| like p, but leave cursor after the new text
:white_check_mark:   | :1234:  gP		| like P, but leave cursor after the new text

## Changing text

Status | Command | Description
---|--------|------------------------------
:warning:    | :1234:  r{char}	| replace N characters with {char}
    | :1234:  gr{char}	| replace N characters without affecting layout
:warning:    | :1234:  R		| enter Replace mode (repeat the entered text N times)
    | :1234:  gR		| enter virtual Replace mode: Like Replace mode but without affecting layout
    |  {visual}r{char} | in Visual block mode: Replace each char of the selected text with {char}

(change = delete text and enter Insert mode)

Status | Command | Description
---|--------|------------------------------
:warning:    | :1234:  c{motion}	| change the text that is moved over with {motion}
:white_check_mark:    |    {visual}c	| change the highlighted text
:warning:    | :1234:  cc	| 	change N lines
:warning:    | :1234:  S		| change N lines
:warning:    | :1234:  C		| change to the end of the line (and N-1 more lines)
    | :1234:  s		| change N characters
    |    {visual}c	| in Visual block mode: Change each of the selected lines with the entered text
    |    {visual}C	| in Visual block mode: Change each of the selected lines until end-of-line with the entered text
:warning:    | :1234:  ~		| switch case for N characters and advance cursor
    |    {visual}~	| switch case for highlighted text
    |    {visual}u	| make highlighted text lowercase
    |    {visual}U	| make highlighted text uppercase
    |    g~{motion}     | switch case for the text that is moved over with {motion}
    |    gu{motion}     | make the text that is moved over with {motion} lowercase
    |    gU{motion}     | make the text that is moved over with {motion} uppercase
:arrow_down:    |    {visual}g?     | perform rot13 encoding on highlighted text
:arrow_down:    |    g?{motion}     | perform rot13 encoding on the text that is moved over with {motion}
:white_check_mark:    | :1234:  CTRL-A	| add N to the number at or after the cursor
:white_check_mark:    | :1234:  CTRL-X	| subtract N from the number at or after the cursor
:white_check_mark:    | :1234:  <{motion}	| move the lines that are moved over with {motion} one shiftwidth left
:white_check_mark:    | :1234:  <<	|	move N lines one shiftwidth left
:white_check_mark:    | :1234:  >{motion}	|  move the lines that are moved over with {motion} one shiftwidth right
:white_check_mark:    | :1234:  >>	|	move N lines one shiftwidth right
    | :1234:  gq{motion}|	format the lines that are moved over with {motion} to 'textwidth' length
    | :[range]ce[nter] [width] | center the lines in [range]
    | :[range]le[ft] [indent]  | left-align the lines in [range] (with [indent])
    | :[range]ri[ght] [width]  | right-align the lines in [range]

## Visual mode

Status | Command | Description
---|--------|------------------------------
:white_check_mark:   | v		| start highlighting characters
:white_check_mark:   | V		| start highlighting linewise
   | CTRL-V	| start highlighting blockwise
   | o		| exchange cursor position with start of highlighting
   | gv		| start highlighting on previous visual area
:white_check_mark:   | v		| highlight characters or stop highlighting
:white_check_mark:   | V		| highlight linewise or stop highlighting
   | CTRL-V	| highlight blockwise or stop highlighting

## Text objects (only in Visual mode or after an operator)

Status | Command | Description
---|--------|------------------------------
:white_check_mark:    | :1234:  aw	| Select "a word"
:white_check_mark:    | :1234:  iw	| Select "inner word"
:white_check_mark:    | :1234:  aW	| Select "a |WORD|"
:white_check_mark:    | :1234:  iW	| Select "inner |WORD|"
:white_check_mark:    | :1234:  as	| Select "a sentence"
:white_check_mark:    | :1234:  is	| Select "inner sentence"
    | :1234:  ap	| Select "a paragraph"
    | :1234:  ip	| Select "inner paragraph"
    | :1234:  ab	| Select "a block" (from "[(" to "])")
    | :1234:  ib	| Select "inner block" (from "[(" to "])")
    | :1234:  aB	| Select "a Block" (from "[{" to "]}")
    | :1234:  iB	| Select "inner Block" (from "[{" to "]}")
:white_check_mark:    | :1234:  a>	| Select "a &lt;&gt; block"
:white_check_mark:    | :1234:  i>	| Select "inner <> block"
    | :1234:  at	| Select "a tag block" (from <aaa> to </aaa>)
    | :1234:  it	| Select "inner tag block" (from <aaa> to </aaa>)
:white_check_mark:    | :1234:  a'	| Select "a single quoted string"
:white_check_mark:    | :1234:  i'	| Select "inner single quoted string"
:white_check_mark:    | :1234:  a"	| Select "a double quoted string"
:white_check_mark:    | :1234:  i"	| Select "inner double quoted string"
:white_check_mark:    | :1234:  a`	| Select "a backward quoted string"
:white_check_mark:    | :1234:  i`	| Select "inner backward quoted string"

## Repeating commands

Status | Command | Description
---|--------|------------------------------
:white_check_mark:   | :1234:  .		 | repeat last change (with count replaced with N)
   |    q{a-z}	         | record typed characters into register {a-z}
   |    q{A-Z}	         | record typed characters, appended to register {a-z}
   |    q		 | stop recording
   | :1234:  @{a-z}	 | execute the contents of register {a-z} (N times)
   | :1234:  @@	         |    repeat previous @{a-z} (N times)
   | :@{a-z}	         | execute the contents of register {a-z} as an Ex command
   | :@@		 | repeat previous :@{a-z}
   | :[range]g[lobal]/{pattern}/[cmd]  | execute Ex command [cmd] (default: ":p") on the lines within [range] where {pattern} matches
   | :[range]g[lobal]!/{pattern}/[cmd]  | execute Ex command [cmd] (default: ":p") on the lines within [range] where {pattern} does NOT match
:arrow_down:   | :so[urce] {file}  | read Ex commands from {file}
:arrow_down:   | :so[urce]! {file}  | read Vim commands from {file}
:arrow_down:   | :sl[eep] [sec]  | don't do anything for [sec] seconds
:arrow_down:   | :1234:  gs	 | goto Sleep for N seconds


## Marks and motions

Status | Command | Description
---|--------|------------------------------
:white_check_mark: |    m{a-zA-Z}	       |  mark current position with mark {a-zA-Z}
      |    `{a-z}	       |  go to mark {a-z} within current file
      |    `{A-Z}	       |  go to mark {A-Z} in any file
      |    `{0-9}	       |  go to the position where Vim was previously exited
      |    ``		       |  go to the position before the last jump
      |    `"		       |  go to the position when last editing this file
      |    `[		       |  go to the start of the previously operated or put text
      |    `]		       |  go to the end of the previously operated or put text
      |    `<		       |  go to the start of the (previous) Visual area
      |    `>		       |  go to the end of the (previous) Visual area
      |    `.		       |  go to the position of the last change in this file
      |    '{a-zA-Z0-9[]'"<>.} |  same as `, but on the first non-blank in the line
      | :marks	               |  print the active marks
      | :1234:  CTRL-O	       |  go to Nth older position in jump list
      | :1234:  CTRL-I	       |  go to Nth newer position in jump list
      | :ju[mps]	       |  print the jump list

## Complex changes

Status | Command | Description
---|--------|------------------------------
   | :1234:  !{motion}{command}<CR> | filter the lines that are moved over through {command}
   | :1234:  !!{command}<CR>        | filter N lines through {command}
   |    {visual}!{command}<CR>      |  filter the highlighted lines through {command}
   | :[range]! {command}<CR>      | filter [range] lines through {command}
:white_check_mark:   | :1234:  ={motion}           | filter the lines that are moved over through 'equalprg'
   | :1234:  ==	                 |    filter N lines through 'equalprg'
:white_check_mark:  |    {visual}=                | filter the highlighted lines through 'equalprg'
:warning:   | :[range]s[ubstitute]/{pattern}/{string}/[g][c]     | substitute {pattern} by {string} in [range] lines; with [g], replace all occurrences of {pattern}; with [c], confirm each replacement
   | :[range]s[ubstitute] [g][c] | repeat previous ":s" with new range and options
   |    &		| Repeat previous ":s" on current line without options
 :arrow_down:  | :[range]ret[ab][!] [tabstop] | set 'tabstop' to new value and adjust white space accordingly


## Special keys in Insert mode

Status | Command | Description
---|--------|------------------------------
    | CTRL-V {char}..	                 |  insert character literally, or enter decimal byte value
:warning:    | NL or CR or CTRL-M or CTRL-J |  begin new line
    | CTRL-E		                 |  insert the character from below the cursor
    | CTRL-Y		                 |  insert the character from above the cursor
    | CTRL-A		                 |  insert previously inserted text
    | CTRL-@		                 |  insert previously inserted text and stop Insert mode
    | CTRL-R {0-9a-z%#:.-="}           |  insert the contents of a register
    | CTRL-N		                 |  insert next match of identifier before the cursor
    | CTRL-P		                 |  insert previous match of identifier before the cursor
    | CTRL-X ...	                 |  complete the word before the cursor in various ways
    | BS or CTRL-H	                 |  delete the character before the cursor
:white_check_mark:    | Del		                 |  delete the character under the cursor
:white_check_mark:    | CTRL-W		                 |  delete word before the cursor
    | CTRL-U		                 |  delete all entered characters in the current line
    | CTRL-T		                 |  insert one shiftwidth of indent in front of the current line
    | CTRL-D		                 |  delete one shiftwidth of indent in front of the current line
    | 0 CTRL-D	                 |  delete all indent in the current line
    | ^ CTRL-D	                 |  delete all indent in the current line, restore indent in next line



## Scrolling

Status | Command | Description
---|--------|------------------------------
:x:    | :1234:  CTRL-E	| window N lines downwards (default: 1)
:warning:   | :1234:  CTRL-D	| window N lines Downwards (default: 1/2 window)
:x:    | :1234:  CTRL-F	| window N pages Forwards (downwards)
  :x:  | :1234:  CTRL-Y	| window N lines upwards (default: 1)
:warning:   | :1234:  CTRL-U	| window N lines Upwards (default: 1/2 window)
:x:    | :1234:  CTRL-B	| window N pages Backwards (upwards)
:x:    |    z CR or zt	| redraw, current line at top of window
:warning: |    z.	 or zz	| redraw, current line at center of window
:x:    |    z-	 or zb	| redraw, current line at bottom of window


## Special inserts

Status | Command | Description
---|--------|------------------------------
   | :r [file]	    | insert the contents of [file] below the cursor
   | :r! {command}  | insert the standard output of {command} below the cursor


## Window

Status | Command | Description
---|--------|------------------------------
:warning:   | :e[dit] {file}  | Edit {file}. We will open file in a new Tab of current Grouped Editor instead of opening in current tab.
:warning:   | <ctrl-w> hl  | Switching between windows. As we don't have the concept of Window in VS Code, we are mapping these commands to switching between Grouped Editors.
:x:   | :sp {file}  | Split current window in two. VS Code doesn't support split Window horizontally.
   | :vsp {file}  | Split vertically current window in two.
:x:   | :new | Create a new window horizontally and start editing an empty file in it.
   | :vne[w] | Create a new window vertically and start editing an empty file in it.


## Tabs

Status | Command | Description
---|--------|------------------------------
:white_check_mark:   | :tabn[ext] :1234:	    | Go to next tab page or tab page {count}.  The first tab page has number one.
    | {count}<C-PageDown>, {count}gt | Same as above
:white_check_mark:   | :tabp[revious]	:1234:  | Go to the previous tab page.  Wraps around from the first one to the last one.
:white_check_mark:   | :tabN[ext]	:1234:  | Same as above
    | {count}<C-PageUp>, {count}gT | Same as above
:white_check_mark:   | :tabfir[st]	 | Go to the first tab page.
:white_check_mark:   | :tabl[ast]	 | Go to the last tab page.
:warning:   | :tabe[dit] {file} | Open a new tab page with an empty window, after the current tab page
    | :[count]tabe[dit], :[count]tabnew | Same as above
:warning:   | :tabnew {file}   | Open a new tab page with an empty window, after the current tab page
    | :[count]tab {cmd} | Execute {cmd} and when it opens a new window open a new tab page instead.
:warning:   | :tabc[lose][!] :1234: | Close current tab page or close tab page {count}.
:warning:   | :tabo[nly][!] | Close all other tab pages.
:white_check_mark:   | :tabm[ove] [N] | Move the current tab page to after tab page N.
:x:   | :tabs	 | List the tab pages and the windows they contain.
    | :tabd[o] {cmd} | Execute {cmd} in each tab page.

## options
### Commands
Status | Command | Description
---|--------|------------------------------
    | :se[t]              | show all modified options
    | :se[t] all		  | show all non-termcap options
    | :se[t] termcap      | show all termcap options
:white_check_mark: | :se[t] {option}	  | set boolean option (switch it on), show string or number option
:white_check_mark: | :se[t] no{option}	  | reset boolean option (switch it off)
    | :se[t] inv{option}  |invert boolean option
:white_check_mark: | :se[t] {option}={value} | set string/number option to {value}
    | :se[t] {option}+={value} | append {value} to string option, add {value} to number option
    | :se[t] {option}-={value} | remove {value} to string option, subtract {value} from number option
    | :se[t] {option}?	  | show value of {option}
    | :se[t] {option}&	  | reset {option} to its default value
    | :setl[ocal]		  | like ":set" but set the local value for options that have one
    | :setg[lobal]		  | like ":set" but set the global value of a local option
    | :fix[del]		      | set value of 't_kD' according to value of 't_kb'
    | :opt[ions]		  | open a new window to view and set options, grouped by functionality, a one line explanation and links to the help

### Option list
Since the list is too long, now we just put those already supported options here.

Status | Command | Default Value | Description
---|--------|-------|------------------------------
:white_check_mark:| tabstop (ts) | 4. we use Code's default value `tabSize` instead of Vim | number of spaces that <Tab> in file uses
:white_check_mark:| :white_check_mark:| hlsearch (hls) | false | When there is a previous search pattern, highlight all its matches.
:white_check_mark:| ignorecase (ic) | false | Ignore case in search patterns.
:white_check_mark:| smartcase (scs) | false | Override the 'ignorecase' option if the search pattern contains upper case characters.
:white_check_mark:| iskeyword (isk) | `@,48-57,_,128-167,224-235` | keywords contain alphanumeric characters and '_'. If there is no user setting for `iskeyword`, we use `editor.wordSeparators` properties.
:white_check_mark:| scroll (scr) | 20 | Number of lines to scroll with CTRL-U and CTRL-D commands.
>expandtab (et) | True. we use Code's default value `inserSpaces` instead of Vim | use spaces when <Tab> is inserted

## Folding
### Fold methods
The folding method can be set with the 'foldmethod' option. This is currently not possible as we are relying on Code's Fold logic.

### Fold commands

Status | Command | Description
---|--------|------------------------------
:x: | zf{motion} or {Visual}zf | Operator to create a fold.
:x: | zF | Create a fold for [count] lines.  Works like "zf".
:x: | zd | Delete one fold at the cursor.
:x: | zD | Delete folds recursively at the cursor.
:x: | zE | Eliminate all folds in the window.
:warning: :x: | zo | Open one fold under the cursor.When a count is given, that many folds deep will be opened.
:white_check_mark: | zO | Open all folds under the cursor recursively.
:warning: :x: | zc | Close one fold under the cursor.  When a count is given, that many folds deep are closed.
:white_check_mark:| zC | Close all folds under the cursor recursively.
:x: | za | When on a closed fold: open it. When on an open fold: close it and set 'foldenable'.
:x: | zA | When on a closed fold: open it recursively. When on an open fold: close it recursively and set 'foldenable'.
:x: | zv | View cursor line: Open just enough folds to make the line in which the cursor is located not folded.
:x: | zx | Update folds: Undo manually opened and closed folds: re-apply 'foldlevel', then do "zv": View cursor line.
:x: | zX | Undo manually opened and closed folds
:x: | zm | Fold more: Subtract one from 'foldlevel'.
:white_check_mark: | zM | Close all folds: set 'foldlevel' to 0. 'foldenable' will be set.
:x: | zr | Reduce folding: Add one to 'foldlevel'.
:white_check_mark: | zR | Open all folds.  This sets 'foldlevel' to highest fold level.
 | zn | Fold none: reset 'foldenable'.  All folds will be open.
 | zN | Fold normal: set 'foldenable'.  All folds will be as they were before.
 | zi | Invert 'foldenable'.
:x: | [z | Move to the start of the current open fold.
:x: | ]z | Move to the end of the current open fold.
:x: | zj | Move downwards to the start of the next fold.
:x: | zk | Move upwards to the end of the previous fold.

### Fold options

Status | Command | Description
---|--------|------------------------------
:x: | foldlevel | 'foldlevel' is a number option: The higher the more folded regions are open.
:x: | foldtext | 'foldtext' is a string option that specifies an expression. This expression is evaluated to obtain the text displayed for a closed fold.
:x: | foldcolumn | 'foldcolumn' is a number, which sets the width for a column on the side of the window to indicate folds.
    | foldenable fen | Open all folds while not set.
:x: | foldexpr fde | Expression used for "expr" folding.
:x: | foldignore fdi | Characters used for "indent" folding.
:x: | foldmarker fmr | Defined markers used for "marker" folding.
:x: | foldmethod fdm | Name of the current folding method.
:x: | foldminlines fml | Minimum number of screen lines for a fold to be displayed closed.
:x: | foldnestmax fdn | Maximum nesting for "indent" and "syntax" folding.
:x: | foldopen fdo | Which kinds of commands open closed folds.
:x: | foldclose fcl | When the folds not under the cursor are closed.
