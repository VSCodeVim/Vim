export class CompositionState {
  isInComposition: boolean = false;
  insertedText: boolean = false;
  composingText: string = '';

  reset() {
    this.isInComposition = false;
    this.insertedText = false;
    this.composingText = '';
  }

  clone() {
    const cloned = new CompositionState();
    cloned.isInComposition = this.isInComposition;
    cloned.insertedText = this.insertedText;
    cloned.composingText = this.composingText;
    return cloned;
  }
}
