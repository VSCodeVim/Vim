import {Motion} from './../motions/commonMotions';
import TextEditor from './../textEditor';

export abstract class Operator {
	protected motion: Motion;
	public isComposed: boolean = false;
	
	canComposeWith(motion: Motion): boolean {
		return typeof motion.select === "function";
	}

	compose(motion: Motion): void {
		this.motion = motion;
		this.isComposed = true;
	};
	
	
	abstract execute(): void;
}


export class Delete extends Operator {
	execute() {
		TextEditor.delete(this.motion.select());
	}
}