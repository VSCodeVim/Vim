import {TextEditor, Position, Selection, commands} from 'vscode';

export default class Caret {
	editor: TextEditor;

	constructor(editor: TextEditor) {
		this.editor = editor;
	}
	
	get currentPosition(): Position {
		return this.editor.selection.active;
	}

	moveTo(line: number, character: number) {
		if (character < 0) character = 0;
		if (line < 0) line = 0;
		
		var position = new Position(line, character);
		position = this.editor.document.validatePosition(position);
		var selection = new Selection(position, position);
		this.editor.selection = selection;
	}
	
	moveLeft(times = 1) {
		for (var index = 0; index < times; index++) {
			commands.executeCommand('cursorLeft');
		}
	}
	
	moveRight(times = 1) {
		for (var index = 0; index < times; index++) {
			commands.executeCommand('cursorRight');
		}
	}
	
	moveUp(times = 1) {
		for (var index = 0; index < times; index++) {
			commands.executeCommand('cursorUp');
		}
	}

	moveDown(times = 1) {
		for (var index = 0; index < times; index++) {
			commands.executeCommand('cursorDown');
		}
	}
}