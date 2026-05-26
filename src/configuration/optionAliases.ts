/**
 * Most options supported by Vim have a short alias. They are provided here.
 * Please keep this list up to date and sorted alphabetically.
 */
export const optionAliases: ReadonlyMap<string, string> = new Map<string, string>([
  ['ai', 'autoindent'],
  ['et', 'expandtab'],
  ['gd', 'gdefault'],
  ['hi', 'history'],
  ['hls', 'hlsearch'],
  ['ic', 'ignorecase'],
  ['icm', 'inccommand'],
  ['is', 'incsearch'],
  ['isk', 'iskeyword'],
  ['js', 'joinspaces'],
  ['mmd', 'maxmapdepth'],
  ['mps', 'matchpairs'],
  ['nu', 'number'],
  ['rnu', 'relativenumber'],
  ['sc', 'showcmd'],
  ['scr', 'scroll'],
  ['so', 'scrolloff'],
  ['scs', 'smartcase'],
  ['smd', 'showmode'],
  ['sol', 'startofline'],
  ['to', 'timeout'],
  ['ts', 'tabstop'],
  ['tw', 'textwidth'],
  ['ws', 'wrapscan'],
  ['ww', 'whichwrap'],
]);
