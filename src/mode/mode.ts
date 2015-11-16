export enum ModeName {
    Normal,
    Insert,
    Visual,
}

export abstract class Mode {
    private _isActive : boolean;
    private _name : ModeName;
    
    constructor(name: ModeName, isActive: boolean) {
        this._name = name;        
        this._isActive = isActive || false;
    }
    
    get Name(): ModeName {
        return this._name;
    } 
    
    get IsActive():boolean {
        return this._isActive;
    }
    
    set IsActive(val:boolean) {
        this._isActive = val;
    }
    
    abstract HandleKeyEvent(key:string) : void;
}