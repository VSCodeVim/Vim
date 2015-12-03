import Cursor from './../cursor';
import * as vscode from 'vscode';

export abstract class Motion {
	execute(): void {
		this.moveCursor();
	}
	
	abstract moveCursor(): void;
	
	select(): vscode.Range {
		var pos = Cursor.currentPosition();
		this.moveCursor();
		var end = Cursor.currentPosition();
		return new vscode.Range(pos, end);
	};
}

export class Left extends Motion {
	moveCursor() {
		Cursor.move(Cursor.left());
	}
}

export class Right extends Motion {
	moveCursor() {
		Cursor.move(Cursor.right());
	}
} 

export class Down extends Motion {
	moveCursor() {
		Cursor.move(Cursor.down());
	}
}

export class Up extends Motion {
	moveCursor() {
		Cursor.move(Cursor.up());
	}
}

export class WordRight extends Motion {
	moveCursor() {
		Cursor.move(Cursor.wordRight());
	}
}

export class WordLeft extends Motion {
	moveCursor() {
		Cursor.move(Cursor.wordLeft());
	}
}

export class MoveToRelativeLine extends Motion {
	moveCursor() {
		var pos = Cursor.currentPosition();
		Cursor.move(Cursor.down());
		Cursor.move(Cursor.lineBegin());
	}
	
	select(): vscode.Range {
		let start = Cursor.lineBegin();
		let end = start.translate(1, 0);
		return new vscode.Range(start, end);
	}
}