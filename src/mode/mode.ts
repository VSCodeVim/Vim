import {Motion} from './../motion/motion';

export enum ModeName {
    Normal,
    Insert,
    Visual,
}

export abstract class Mode {
    private _isActive : boolean;
    private _name : ModeName;
    private _motion : Motion;
    protected keyHistory : string[];

    constructor(name: ModeName, motion : Motion) {
        this._name = name;
        this._motion = motion;
        this._isActive = false;
        this.keyHistory = [];
    }

    get Name(): ModeName {
        return this._name;
    }

    get Motion() : Motion {
        return this._motion;
    }

    set Motion(val : Motion) {
        this._motion = val;
    }

    get IsActive() : boolean {
        return this._isActive;
    }

    set IsActive(val : boolean) {
        this._isActive = val;
    }

    public HandleDeactivation() : void {
        this.keyHistory = [];
    }

    abstract ShouldBeActivated(key : string, currentMode : ModeName) : boolean;

    abstract HandleActivation(key : string) : Thenable<{}>;

    abstract HandleKeyEvent(key : string) : Thenable<{}>;
}