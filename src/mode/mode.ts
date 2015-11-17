export enum ModeName {
    Normal,
    Insert,
    Visual,
}

export abstract class Mode {
    private _isActive : boolean;
    private _name : ModeName;
    protected _keyHistory: string[];

    constructor(name: ModeName) {
        this._name = name;
        this._isActive = false;
        this._keyHistory = [];
    }

    get Name(): ModeName {
        return this._name;
    }

    get IsActive() : boolean {
        return this._isActive;
    }

    set IsActive(val : boolean) {
        if (val !== this._isActive) {
            this._isActive = val;
            this._keyHistory = [];
        }
    }

    abstract HandleKeyEvent(key : string) : void;
}