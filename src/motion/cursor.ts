import * as vscode from 'vscode';

export default class Cursor {
	editor: vscode.TextEditor;

	constructor(editor: vscode.TextEditor) {
		this.editor = editor;
	}
	
	moveLeft(times = 1) {
		for (var index = 0; index < times; index++) {
			vscode.commands.executeCommand('cursorLeft');
		}
	}
	
	moveRight(times = 1) {
		for (var index = 0; index < times; index++) {
			vscode.commands.executeCommand('cursorRight');
		}
	}
	
	moveUp(times = 1) {
		for (var index = 0; index < times; index++) {
			vscode.commands.executeCommand('cursorUp');
		}
	}
	
	moveDown(times = 1) {
		for (var index = 0; index < times; index++) {
			vscode.commands.executeCommand('cursorDown');
		}
	}
}