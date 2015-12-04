import {ModeName, Mode} from './mode';

export default class VisualMode extends Mode {
    constructor() {
        super(ModeName.Visual);
    }

    ShouldBeActivated(key : string, currentMode : ModeName) : boolean {
        // TODO: improve this logic for "V".
        return (key === "v" || key === "V") && (currentMode === ModeName.Normal);
    }

    HandleActivation(key : string) : Thenable<{}> {
        return Promise.resolve({});
    }

    HandleKeyEvent(key : string) : Thenable<{}> {
        this.keyHistory.push(key);
        return Promise.resolve({});
    }
}