import * as _ from 'lodash';
import {Mode, ModeName} from './mode/mode';

export interface TopHandler {
	currentMode : Mode;
	modes : Mode[];
	setCurrentModeByName(modeName : ModeName);
	handleModeChange(key : string);
}

export interface ConcreteModeHandler {
	handleKeys(state : KeyState) : void;
}

export interface KeyParser {
	(state : KeyState) : KeyParser;
}

export class KeyState {
	private keys : Array<string>;
	private index : number;
	private start : number;
	requestInput : boolean;
	errors : Array<string>;
	nextMode : string;

	addKey(key : string) {
		this.keys.push(key);
	}

	constructor() {
		this.requestInput = false;
		this.index = 0;
		this.start = 0;
		this.keys = [];
		this.errors = [];
	}

	handle(topHandler : TopHandler) {
        while (!this.isAtEof) {		
			topHandler.currentMode.handleKeys(this);
            if (this.nextMode) {
				topHandler.handleModeChange(this.nextMode);
			}
        }
		
		if (this.errors.length > 0) {			
			console.warn(this.errors[this.errors.length - 1]);
			this.clear();
			return;
		}

        if (this.requestInput || !this.isAtEof) {
            this.reset();
        } else {
			this.clear();
		}
	}

	clear() : void  {
		this.keys = [];
		this.errors = [];
		this.reset();
	}

	backup() : void {
		if (--this.index < this.start) {
			this.ignore();
		}
	}

	next() : string {
		if (this.isAtEof) {
			return "";
		}
		return this.keys[this.index++];
		// let val = _.slice(this.keys, this.start, this.index).join("");
		// return val;
	}

	cumulative() : string {
		let val = _.slice(this.keys, this.start, this.index).join("");
		return val;
	}	

	ignore() : void {
		this.start = this.index;
	}

	get isAtEof() {
		return this.index >= this.keys.length;
	}

	reset() {
		this.index = 0;
		this.start = 0;
		this.nextMode = '';
		this.requestInput = false;
	}
}
