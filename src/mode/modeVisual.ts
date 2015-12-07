import {ModeName, Mode} from './mode';
import {KeyState} from '../keyState';

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

    handleKeys(state : KeyState) : void {
    }

    HandleKeyEvent(key : string) : Thenable<{}> {
        this.keyHistory.push(key);
        return Promise.resolve({});
    }
}