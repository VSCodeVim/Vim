import {ModeName, Mode} from './mode';

export default class VisualMode extends Mode {
    constructor() {
        super(ModeName.Visual);
    }

    ShouldBeActivated(key : string, currentMode : ModeName) : boolean {
        // TODO: improve this logic for "V".
        return (key === "v" || key === "V") && (currentMode === ModeName.Command);
    }
    
    HandleActivation(key : string) : void {
        // do nothing
    }
    
    HandleKeyEvent(key : string) : void {
        this.keyHistory.push(key);
    }
}