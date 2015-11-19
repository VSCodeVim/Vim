import {ModeName, Mode} from './mode';

export default class VisualMode extends Mode {
    constructor() {
        super(ModeName.Visual);
    }

    ShouldBeActivated(key : string, currentMode : ModeName) : boolean {
        return (key === "v" || key === "V");
    }
    
    HandleActivation(key : string) : void {
        // do nothing
    }
    
    HandleKeyEvent(key : string) : void {
        this.keyHistory.push(key);
    }
}