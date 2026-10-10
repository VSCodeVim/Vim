export class CompositionState {
  isInComposition: boolean = false;
  insertedText: boolean = false;
  composingText: string = '';
  // VS Code composition offsets count UTF-16 code units, including prompt text
  // after the caret. The caret does not necessarily sit at the end of the text.
  cursorOffset: number = 0;

  update(text: string, replacePrevCharCnt = 0, replaceNextCharCnt = 0, positionDelta = 0) {
    const start = Math.max(0, this.cursorOffset - replacePrevCharCnt);
    const end = Math.min(this.composingText.length, this.cursorOffset + replaceNextCharCnt);
    this.composingText = this.composingText.slice(0, start) + text + this.composingText.slice(end);
    this.cursorOffset = Math.max(
      0,
      Math.min(this.composingText.length, start + text.length + positionDelta),
    );
  }

  reset() {
    this.isInComposition = false;
    this.insertedText = false;
    this.composingText = '';
    this.cursorOffset = 0;
  }
}
