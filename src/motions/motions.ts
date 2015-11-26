import {TextEditor, window, Position, Selection} from 'vscode';
import Caret from '../caret';

export abstract class Motion {
	
	get editor(): TextEditor {
		return window.activeTextEditor;
	}
	
	get caret(): Caret {
		return new Caret(this.editor);
	}
	
	abstract execute();
	
	public select(): Selection {
		return null;
	}
}

export class MoveLeft extends Motion {
	
	execute() {
		this.caret.moveLeft();
	}
	
	select(): Selection {
		var position = this.caret.currentPosition;
		
		return new Selection(position, position.translate(0, -1));
	}
}

export class MoveRight extends Motion {
	
	execute() {
		this.caret.moveRight();
	}
	
	select(): Selection {
		var position = this.caret.currentPosition;
	
		return new Selection(position, position.translate(0, 1));
	}
}

export class MoveUp extends Motion {
	
	execute() {
		this.caret.moveUp();
	}

	select(): Selection {
		var position = this.caret.currentPosition;
		
		return new Selection(position, position.translate(-1, 0));
	}
}

export class MoveDown extends Motion {
	
	execute() {
		this.caret.moveDown();
	}
	
	select(): Selection {
		var position = this.caret.currentPosition;
		
		return new Selection(position, position.translate(1, 0));
	}
}

abstract class MoveWord extends Motion {
	private wordRegexp = /\w+/g;

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

export class MoveWordRight extends MoveWord {
	
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
		
		if (nextWordIndex === undefined) {
			return line.range.end;
		}
		
		var newPosition = document.validatePosition(new Position(line.lineNumber, nextWordIndex));
		
		return newPosition;
	}
	
	select(): Selection {
		var position = this.caret.currentPosition;
		var nextWordPosition = this.getNextWordPosition();
		
		return new Selection(position, nextWordPosition);
	}
}

export class MoveWordLeft extends MoveWord {
	
	execute() {
		var position = this.caret.currentPosition;
		var document = this.editor.document;
		var line = document.lineAt(position);
		var wordIndexes = this.getWords(line.text);
		
		var prevWordIndex = wordIndexes.reverse().find(value => position.character > value);
		
		if (prevWordIndex === undefined) {
			this.caret.moveTo(line.lineNumber, line.firstNonWhitespaceCharacterIndex);
		} else {
			this.caret.moveTo(line.lineNumber, prevWordIndex);
		}
	}
}