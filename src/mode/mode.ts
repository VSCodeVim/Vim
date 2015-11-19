export enum ModeName {
    Normal,
    Insert,
    Visual,
}

export abstract class Mode {
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

    get IsActive() : boolean {
        return this.isActive;
    }

    set IsActive(val : boolean) {
        if (val !== this.isActive) {
            this.isActive = val;
            this.keyHistory = [];
        }
    }

    abstract HandleKeyEvent(key : string) : void;
}