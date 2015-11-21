import {TextEditor, window, Position, Selection, Range} from 'vscode';
import Caret from './caret';

export default class Motion {
	constructor() {
	}

	get editor(): TextEditor {
		return window.activeTextEditor;
	}
	
	get caret(): Caret {
		return new Caret(this.editor);
	}
	
	execute() {
		
	}
}

export class MotionMoveLeft extends Motion {
	constructor() {
		super();
	}
	
	execute() {
		this.caret.moveLeft();
	}
}

export class MotionMoveRight extends Motion {
	constructor() {
		super();
	}
	
	execute() {
		this.caret.moveRight();
	}
}

export class MotionMoveUp extends Motion {
	constructor() {
		super();
	}
	
	execute() {
		this.caret.moveUp();
	}	
}

export class MotionMoveDown extends Motion {
	constructor() {
		super();
	}
	
	execute() {
		this.caret.moveDown();
	}	
}

class MotionWord extends Motion {
	private wordRegexp = /\w+/g;

	constructor() {
		super();
	}
	
	getWords(text: string): number[] {
		var words = text.match(this.wordRegexp);
		var items = [];
		var pos = 0;
		
		words.forEach(element => {
			var index = text.indexOf(element, pos);
			items.push(index);
			pos = index + element.length;
		});

		return items;
	}
}

export class MotionMoveWordForward extends MotionWord {

	constructor() {
		super();
	}
	
	execute() {
		var pos = this.getNextWordPosition();
		this.caret.moveTo(pos.line, pos.character);
	}
	
	getNextWordPosition(): Position {
		var position = this.caret.currentPosition;
		var document = this.editor.document;
		
		var line = document.lineAt(position);
		var wordIndexes = this.getWords(line.text);
		
		var nextWordIndex = wordIndexes.find(value => position.character < value);
		
		if (nextWordIndex == undefined) return line.range.end;
		
		var newPosition = document.validatePosition(new Position(line.lineNumber, nextWordIndex));
		
		return newPosition;
	}
}

export class MotionMoveWordBackward extends MotionWord {
	constructor() {
		super();
	}
	
	execute() {
		var position = this.caret.currentPosition;
		var document = this.editor.document;
		var line = document.lineAt(position);
		var wordIndexes = this.getWords(line.text);
		
		var prevWordIndex = wordIndexes.reverse().find(value => position.character > value);
		
		if (prevWordIndex == undefined) {
			this.caret.moveTo(line.lineNumber, line.firstNonWhitespaceCharacterIndex);
		} else {
			this.caret.moveTo(line.lineNumber, prevWordIndex);
		}
	}
}