import {KeyState} from './keyState';

export interface VimOp {
	execute(state : KeyState) : void;
	and(op : any) : VimOp;
}

interface ArgumentProvider<T> extends VimOp {
	value : T;
}

abstract class Operation implements VimOp {
	protected argumentProvider : ArgumentProvider<string>;
	protected motion : Motion;
	protected operation : (m : string, arg: string) => void;
		
	constructor(operation : (m, arg) => void) {
		this.operation = operation;
	}
	
	execute(state : KeyState) : void {
		if (this.argumentProvider) {
			this.argumentProvider.execute(state);
			if (state.requestInput) {
				return;
			}
			const m = this.motion.select(state);
			if (state.requestInput) {
				return;
			}
			this.operation(m, this.argumentProvider.value);
		} else {
			const m = this.motion.select(state);
			if (state.requestInput) {
				return;
			}			
			this.operation(m, null);
		}
	}
	
	and(motion : Motion) : Operation  {
		this.motion = motion;
		return this;
	}	
}

export abstract class Motion implements VimOp {
	protected argumentProvider : ArgumentProvider<string>;
	protected operation : (x : string) => string;
	
	constructor(operation : (arg) => string) {
		this.operation = operation;
	}
	
	execute(state : KeyState) : void {
		if (this.argumentProvider) {
			this.argumentProvider.execute(state);
			if (state.requestInput) {
				return;
			}
			console.warn(this.operation(this.argumentProvider.value));
		} else {
			console.warn(this.operation(null));
		}
	}
	
	select(state : KeyState) : string {
		if (this.argumentProvider) {
			this.argumentProvider.execute(state);
			if (state.requestInput) {
				return;
			}
			return this.operation(this.argumentProvider.value);
		} else {
			return this.operation(null);
		}
	}
	
	and(provider : ArgumentProvider<string>) : Motion  {
		this.argumentProvider = provider;
		return this;
	}
}

export class WordLeft extends Motion {
	constructor() {
		super((_) => "word left");
	}
}

export class WordRight extends Motion {
	constructor() {
		super((_) => "word right");
	}
}

export class FindCharacter extends Motion {
	constructor() {
		super((arg) => "find char " + arg);
	}
}

export class Delete extends Operation {
	constructor() {
		super((m, arg) => console.warn("delete(" + m + ")"));
	}
}

export class SingleCharArgument implements ArgumentProvider<string> {
	value : string;
	
	execute(state : KeyState) : void {
		if (state.isAtEof) {
			state.requestInput = true;
			return;
		}
		this.value = state.next();
	}
	
	and(other : VimOp) : VimOp {
		throw new Error("invalid operation");
		return this;
	}
}


export class Pick extends Motion {
	private options : { [key : string] : Motion }
	
	constructor(options : { [key : string]: Motion }) {
		super(() => "");
		this.options = options;
	}
	
	execute(state : KeyState) : void {
		if (state.isAtEof) {
			state.requestInput = true;
			return;
		}
		const c = state.next();
		const m = this.options[c];
		if (!m) {
			throw new Error("invalid motion");
		}
		m.execute(state);
	}

	select(state : KeyState) : string {
		if (state.isAtEof) {
			state.requestInput = true;
			return;
		}
		const c = state.next();
		const m = this.options[c];
		if (!m) {
			throw new Error("invalid motion");
		}
		return m.select(state);
	}	
	
	and(op : ArgumentProvider<string>) : Motion {
		throw new Error("invalid operation");
	}
}