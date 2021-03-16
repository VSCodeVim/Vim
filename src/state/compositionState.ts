export class CompositionState {
  isInComposition: boolean = false;
  insertedText: boolean = false;
  composingText: string = '';

  reset() {
    this.isInComposition = false;
    this.insertedText = false;
    this.composingText = '';
  }
}
