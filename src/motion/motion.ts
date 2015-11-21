import {TextEditor, window, Position, Selection} from 'vscode';
import Cursor from './cursor';

export default class Motion {
	constructor() {
	}

	get editor(): TextEditor {
		return window.activeTextEditor;
	}
	
	get cursor(): Cursor {
		return new Cursor(this.editor);
	}
	
	execute() {
		
	}
}

export class MotionMoveLeft extends Motion {
	constructor() {
		super();
	}
	
	execute() {
		this.cursor.moveLeft();
	}
}

export class MotionMoveRight extends Motion {
	constructor() {
		super();
	}
	
	execute() {
		this.cursor.moveRight();
	}
}

export class MotionMoveUp extends Motion {
	constructor() {
		super();
	}
	
	execute() {
		this.cursor.moveUp();
	}	
}

export class MotionMoveDown extends Motion {
	constructor() {
		super();
	}
	
	execute() {
		this.cursor.moveDown();
	}	
}

export class MotionMoveWordForward extends Motion {
	constructor() {
		super();
	}
	
	execute() {
        var currentPosition = this.editor.selection.active;
        var doc = this.editor.document;
        
        var wordRange = doc.getWordRangeAtPosition(currentPosition);
        console.log(wordRange);
        var nextPosition = new Position(wordRange.end.line, wordRange.end.character + 1);
        var selection = new Selection(nextPosition, nextPosition);
        this.editor.selection = selection;
	}
}