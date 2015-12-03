import * as _ from 'lodash';
import {Mode, ModeName} from './mode/mode';

export interface TopHandler {
	currentMode : Mode;
	modes : Mode[];
	setCurrentModeByName(modeName : ModeName);
}

export interface ConcreteModeHandler {
}

export class KeyState {
	private keys : Array<string>;
	private index : number;
	private start : number;
	mustChangeMode : boolean;
	requestMoreUserInput : boolean;

	addKey(key : string) {
		this.keys.push(key);
	}

	constructor() {
		this.mustChangeMode = false;
		this.requestMoreUserInput = false;
		this.index = 0;
		this.start = 0;
		this.keys = [];
	}

	handleInMode(handler : ConcreteModeHandler) {
		// reacts to the handling done by the mode;
	}

	handle(topHandler : TopHandler) {
        while (!this.isAtEof) {
			topHandler.currentMode.handle(this);
			// this.handleInMode(topHandler.currentMode); // eventually maybe use this instead

            if (this.mustChangeMode) {
                var key = this.next();

                var currentModeName = topHandler.currentMode.Name;
                var nextMode : Mode;
                var inactiveModes = _.filter(topHandler.modes, (m) => !m.IsActive);

                _.forEach(inactiveModes, (m, i) => {
                    if (m.ShouldBeActivated(key, currentModeName)) {
                        nextMode = m;
                    }
                });

                if (nextMode) {
                    topHandler.currentMode.HandleDeactivation();

                    nextMode.HandleActivation(key);
                    topHandler.setCurrentModeByName(nextMode.Name);
                }
            }
        }

        if (this.requestMoreUserInput) {
            this.reset();
            return;
        }

        if (this.isAtEof) {
			this.clear();
		}
		
		this.reset();
	}

	clear() : void  {
		this.keys = [];
		this.mustChangeMode = false;
		this.requestMoreUserInput = false;
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
		this.index++;
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
	}
}