export class CompositionState {
  isInComposition: boolean = false;
  composingText: string = '';

  reset() {
    this.isInComposition = false;
    this.composingText = '';
  }
}
