import { Mode, ModeName } from './mode';
import { VSCodeVimCursorType } from './mode';

export class SearchInProgressMode extends Mode {
  public text = 'Search In Progress';
  public cursorType = VSCodeVimCursorType.Block;

  constructor() {
    super(ModeName.SearchInProgressMode);
  }
}
