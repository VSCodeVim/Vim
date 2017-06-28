declare module "promised-neovim-client" {

  export interface Nvim extends NodeJS.EventEmitter {
    quit(): void;
    getVersion(): NvimVersion;
    bufLineCount(buffer: Buffer, notify?: boolean): Promise<number>;
    bufGetLines(buffer: Buffer, start: number, end: number, strict_indexing: boolean, notify?: boolean): Promise<Array<string>>;
    bufSetLines(buffer: Buffer, start: number, end: number, strict_indexing: boolean, replacement: Array<string>, notify?: boolean): Promise<void>;
    bufGetVar(buffer: Buffer, name: string, notify?: boolean): Promise<VimValue>;
    bufSetVar(buffer: Buffer, name: string, value: VimValue, notify?: boolean): Promise<VimValue>;
    bufDelVar(buffer: Buffer, name: string, notify?: boolean): Promise<VimValue>;
    bufGetOption(buffer: Buffer, name: string, notify?: boolean): Promise<VimValue>;
    bufSetOption(buffer: Buffer, name: string, value: VimValue, notify?: boolean): Promise<void>;
    bufGetNumber(buffer: Buffer, notify?: boolean): Promise<number>;
    bufGetName(buffer: Buffer, notify?: boolean): Promise<string>;
    bufSetName(buffer: Buffer, name: string, notify?: boolean): Promise<void>;
    bufIsValid(buffer: Buffer, notify?: boolean): Promise<boolean>;
    bufGetMark(buffer: Buffer, name: string, notify?: boolean): Promise<Array<number>>;
    bufAddHighlight(buffer: Buffer, src_id: number, hl_group: string, line: number, col_start: number, col_end: number, notify?: boolean): Promise<number>;
    bufClearHighlight(buffer: Buffer, src_id: number, line_start: number, line_end: number, notify?: boolean): Promise<void>;
    tabpageGetWindows(tabpage: Tabpage, notify?: boolean): Promise<Array<Window>>;
    tabpageGetVar(tabpage: Tabpage, name: string, notify?: boolean): Promise<VimValue>;
    tabpageSetVar(tabpage: Tabpage, name: string, value: VimValue, notify?: boolean): Promise<VimValue>;
    tabpageDelVar(tabpage: Tabpage, name: string, notify?: boolean): Promise<VimValue>;
    tabpageGetWindow(tabpage: Tabpage, notify?: boolean): Promise<Window>;
    tabpageIsValid(tabpage: Tabpage, notify?: boolean): Promise<boolean>;
    uiAttach(width: number, height: number, enable_rgb: boolean, notify?: boolean): Promise<void>;
    uiDetach(notify?: boolean): Promise<void>;
    uiTryResize(width: number, height: number, notify?: boolean): Promise<void>;
    uiSetOption(name: string, value: VimValue, notify?: boolean): Promise<void>;
    command(str: string, notify?: boolean): Promise<void>;
    feedkeys(keys: string, mode: string, escape_csi: boolean, notify?: boolean): Promise<void>;
    input(keys: string, notify?: boolean): Promise<number>;
    replaceTermcodes(str: string, from_part: boolean, do_lt: boolean, special: boolean, notify?: boolean): Promise<string>;
    commandOutput(str: string, notify?: boolean): Promise<string>;
    eval(str: string, notify?: boolean): Promise<VimValue>;
    callFunction(fname: string, args: Array<RPCValue>, notify?: boolean): Promise<VimValue>;
    strwidth(str: string, notify?: boolean): Promise<number>;
    listRuntimePaths(notify?: boolean): Promise<Array<string>>;
    changeDirectory(dir: string, notify?: boolean): Promise<void>;
    getCurrentLine(notify?: boolean): Promise<string>;
    setCurrentLine(line: string, notify?: boolean): Promise<void>;
    delCurrentLine(notify?: boolean): Promise<void>;
    getVar(name: string, notify?: boolean): Promise<VimValue>;
    setVar(name: string, value: VimValue, notify?: boolean): Promise<VimValue>;
    delVar(name: string, notify?: boolean): Promise<VimValue>;
    getVvar(name: string, notify?: boolean): Promise<VimValue>;
    getOption(name: string, notify?: boolean): Promise<VimValue>;
    setOption(name: string, value: VimValue, notify?: boolean): Promise<void>;
    outWrite(str: string, notify?: boolean): Promise<void>;
    errWrite(str: string, notify?: boolean): Promise<void>;
    reportError(str: string, notify?: boolean): Promise<void>;
    getBuffers(notify?: boolean): Promise<Array<Buffer>>;
    getCurrentBuf(notify?: boolean): Promise<Buffer>;
    setCurrentBuffer(buffer: Buffer, notify?: boolean): Promise<void>;
    getWindows(notify?: boolean): Promise<Array<Window>>;
    getCurrentWindow(notify?: boolean): Promise<Window>;
    setCurrentWindow(window: Window, notify?: boolean): Promise<void>;
    getTabpages(notify?: boolean): Promise<Array<Tabpage>>;
    getCurrentTabpage(notify?: boolean): Promise<Tabpage>;
    setCurrentTabpage(tabpage: Tabpage, notify?: boolean): Promise<void>;
    getMode(notify?: boolean): Promise<{[key: string]: RPCValue}>
    subscribe(event: string, notify?: boolean): Promise<void>;
    unsubscribe(event: string, notify?: boolean): Promise<void>;
    nameToColor(name: string, notify?: boolean): Promise<number>;
    getColorMap(notify?: boolean): Promise<{[key: string]: RPCValue}>;
    getApiInfo(notify?: boolean): Promise<Array<RPCValue>>;
    winGetBuffer(window: Window, notify?: boolean): Promise<Buffer>;
    winGetHeight(window: Window, notify?: boolean): Promise<number>;
    winSetHeight(window: Window, height: number, notify?: boolean): Promise<void>;
    winGetWidth(window: Window, notify?: boolean): Promise<number>;
    winSetWidth(window: Window, width: number, notify?: boolean): Promise<void>;
    winGetVar(window: Window, name: string, notify?: boolean): Promise<VimValue>;
    winSetVar(window: Window, name: string, value: VimValue, notify?: boolean): Promise<VimValue>;
    winDelVar(window: Window, name: string, notify?: boolean): Promise<VimValue>;
    winGetOption(window: Window, name: string, notify?: boolean): Promise<VimValue>;
    winSetOption(window: Window, name: string, value: VimValue, notify?: boolean): Promise<void>;
    winGetPosition(window: Window, notify?: boolean): Promise<Array<number>>;
    winGetTabpage(window: Window, notify?: boolean): Promise<Tabpage>;
    winIsValid(window: Window, notify?: boolean): Promise<boolean>;
    equals(rhs: Nvim): boolean;
  }
  export interface Buffer {
    getLine(index: number, notify?: boolean): Promise<string>;
    setLine(index: number, line: string, notify?: boolean): Promise<void>;
    delLine(index: number, notify?: boolean): Promise<void>;
    getLineSlice(start: number, end: number, include_start: boolean, include_end: boolean, notify?: boolean): Promise<Array<string>>;
    setLineSlice(start: number, end: number, include_start: boolean, include_end: boolean, replacement: Array<string>, notify?: boolean): Promise<void>;
    insert(lnum: number, lines: Array<string>, notify?: boolean): Promise<void>;
    lineCount(notify?: boolean): Promise<number>;
    getLines(start: number, end: number, strict_indexing: boolean, notify?: boolean): Promise<Array<string>>;
    setLines(start: number, end: number, strict_indexing: boolean, replacement: Array<string>, notify?: boolean): Promise<void>;
    getVar(name: string, notify?: boolean): Promise<VimValue>;
    setVar(name: string, value: VimValue, notify?: boolean): Promise<VimValue>;
    delVar(name: string, notify?: boolean): Promise<VimValue>;
    getOption(name: string, notify?: boolean): Promise<VimValue>;
    setOption(name: string, value: VimValue, notify?: boolean): Promise<void>;
    getNumber(notify?: boolean): Promise<number>;
    getName(notify?: boolean): Promise<string>;
    setName(name: string, notify?: boolean): Promise<void>;
    isValid(notify?: boolean): Promise<boolean>;
    getMark(name: string, notify?: boolean): Promise<Array<number>>;
    addHighlight(src_id: number, hl_group: string, line: number, col_start: number, col_end: number, notify?: boolean): Promise<number>;
    clearHighlight(src_id: number, line_start: number, line_end: number, notify?: boolean): Promise<void>;
    equals(rhs: Buffer): boolean;
  }
  export interface Window {
    getBuffer(notify?: boolean): Promise<Buffer>;
    getCursor(notify?: boolean): Promise<Array<number>>;
    setCursor(pos: Array<number>, notify?: boolean): Promise<void>;
    getHeight(notify?: boolean): Promise<number>;
    setHeight(height: number, notify?: boolean): Promise<void>;
    getWidth(notify?: boolean): Promise<number>;
    setWidth(width: number, notify?: boolean): Promise<void>;
    getVar(name: string, notify?: boolean): Promise<VimValue>;
    setVar(name: string, value: VimValue, notify?: boolean): Promise<VimValue>;
    delVar(name: string, notify?: boolean): Promise<VimValue>;
    getOption(name: string, notify?: boolean): Promise<VimValue>;
    setOption(name: string, value: VimValue, notify?: boolean): Promise<void>;
    getPosition(notify?: boolean): Promise<Array<number>>;
    getTabpage(notify?: boolean): Promise<Tabpage>;
    isValid(notify?: boolean): Promise<boolean>;
    equals(rhs: Window): boolean;
  }
  export interface Tabpage {
    getWindows(notify?: boolean): Promise<Array<Window>>;
    getVar(name: string, notify?: boolean): Promise<VimValue>;
    setVar(name: string, value: VimValue, notify?: boolean): Promise<VimValue>;
    delVar(name: string, notify?: boolean): Promise<VimValue>;
    getWindow(notify?: boolean): Promise<Window>;
    isValid(notify?: boolean): Promise<boolean>;
    equals(rhs: Tabpage): boolean;
  }
  export function attach(writer: NodeJS.WritableStream, reader: NodeJS.ReadableStream): Promise<Nvim>;

  export interface NvimVersion { major: number; minor: number; patch: number; rest: string; }
  export type RPCValue = Buffer | Window | Tabpage | number | boolean | string | any[] | {[key: string]: any};
  export type VimValue = number | boolean | string | any[] | {[key: string]: any} | null
}