import * as baseMode from './mode';

export default class InsertMode extends baseMode.Mode {
    constructor() {
        super(baseMode.ModeName.Normal);
    }

    HandleKeyEvent(key : string) : void {
        this.keyHistory.push(key);
    }
}