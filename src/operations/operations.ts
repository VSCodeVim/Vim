import {TextEditor, window, commands} from 'vscode';
import {Motion} from '../motions/motions';

export abstract class Operation {

	get editor(): TextEditor {
		return window.activeTextEditor;
	}
	
	abstract execute(motion?: Motion);
}

export class OperationDelete extends Operation {
	
	execute(motion?: Motion) {
		var selection = motion.select();

		this.editor.edit(builder => builder.delete(selection));
	}
}

export class OperationDeleteLine extends Operation {
	
	execute(motion?: Motion) {
		commands.executeCommand("editor.action.deleteLines");
	}
}