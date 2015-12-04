import {ConcreteModeHandler, KeyState} from '../keyState';

export enum ModeName {
    Normal,
    Insert,
    Visual,
}

export abstract class Mode implements ConcreteModeHandler {
    private isActive : boolean;
    private name : ModeName;
    protected keyHistory : string[];

    constructor(name: ModeName) {
        this.name = name;
        this.isActive = false;
        this.keyHistory = [];
    }

    get Name(): ModeName {
        return this.name;
    }

    abstract handleKeys(state: KeyState) : void;

    get IsActive() : boolean {
        return this.isActive;
    }

    set IsActive(val : boolean) {
        this.isActive = val;
    }

    public HandleDeactivation() : void {
        this.keyHistory = [];
    }

    abstract ShouldBeActivated(key : string, currentMode : ModeName) : boolean;

    abstract HandleActivation(key : string) : Thenable<{}>;

    abstract HandleKeyEvent(key : string) : Thenable<{}>;
}