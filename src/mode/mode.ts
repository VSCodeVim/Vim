export enum ModeName {
    All,
    Command,
    CommandLine,
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
        this.isActive = val;
    }
    
    public HandleDeactivation() : void {
        this.keyHistory = [];
    }

    abstract ShouldBeActivated(key : string, currentMode : ModeName) : boolean;

    abstract HandleActivation(key : string) : void;

    abstract HandleKeyEvent(key : string) : void;
}