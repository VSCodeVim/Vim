import {TextEditor, window} from 'vscode';
import {Motion} from '../motion/motion';

export class Operation {

	get editor(): TextEditor {
		return window.activeTextEditor;
	}
	
	execute(motion: Motion) {
		//do nothing
	}
}

export class OperationChange extends Operation {
	
	execute(motion: Motion) {
		
	}
	
}

export class OperationDelete extends Operation {
	
	execute(motion: Motion) {
		var selection = motion.select();

		this.editor.edit(builder => builder.delete(selection));
	}
}