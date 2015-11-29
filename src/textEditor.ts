import * as vscode from "vscode";

export default class TextEditor {
    private static mostRightCol : number = 0;
          
    static Insert(text: string, position: vscode.Position = null) : Thenable<boolean> {
        if (position === null) {
            position = vscode.window.activeTextEditor.selection.active;
        }
        
        return vscode.window.activeTextEditor.edit((editBuilder) => {
            editBuilder.insert(position, text);
        });
    }

    static Delete(range: vscode.Range) : Thenable<boolean> {
        return vscode.window.activeTextEditor.edit((editBuilder) => {
            editBuilder.delete(range);
        });
    }

    static Replace(range: vscode.Range, text: string) : Thenable<boolean> {
        return vscode.window.activeTextEditor.edit((editBuilder) => {
            editBuilder.replace(range, text);
        });
    }
    
    static ReadLine(lineNo: number = null): string {
        if (lineNo === null) {
            lineNo = vscode.window.activeTextEditor.selection.active.line;
        }
        
        if (vscode.window.activeTextEditor.document.lineCount < lineNo) {
            throw new RangeError();
        }
        
        return vscode.window.activeTextEditor.document.lineAt(lineNo).text;
    }
    
    static GetCurrentPosition(): vscode.Position {
        return vscode.window.activeTextEditor.selection.active;
    }
    
    static SetCurrentPosition(position: vscode.Position) {
        const newSelection = new vscode.Selection(position, position);
        vscode.window.activeTextEditor.selection = newSelection;
    }
    
    static GetEndOfLine(position: vscode.Position) : vscode.Position {
        const lineLength = vscode.window.activeTextEditor.document.lineAt(position.line).text.length;
        return new vscode.Position(position.line, lineLength);
    }

    static IsLastLine(): boolean {
        return (vscode.window.activeTextEditor.document.lineCount ===
            (this.GetCurrentPosition().line + 1));
    }
    
    static CursorLeft() {
        let editor : vscode.TextEditor = vscode.window.activeTextEditor;
        var pos : vscode.Position = editor.selection.active;
		if (pos.character > 0) {
			vscode.commands.executeCommand("cursorLeft");
			this.mostRightCol = pos.character - 2;                    
		} else {
			this.mostRightCol = -1;
		}
    }

	static CursorRight() {
        let editor : vscode.TextEditor = vscode.window.activeTextEditor;
        var pos : vscode.Position = editor.selection.active;
		if ((pos.character + 1) < editor.document.lineAt(pos.line).text.length) {
			vscode.commands.executeCommand("cursorRight");
			this.mostRightCol = pos.character;
		}
	}

	private static NewCol(line : number) : number {
        let editor : vscode.TextEditor = vscode.window.activeTextEditor;
		var length = editor.document.lineAt(line).text.length;
		var newCol = this.mostRightCol + 1;
		if (newCol >= length) {
			newCol = length - 1;
		}
		if (newCol < 0) {
			newCol = 0;
		}
		return newCol;	
	}

	static CursorDown() {
		if (TextEditor.IsLastLine()) {
            return;
		}
        
        let editor : vscode.TextEditor = vscode.window.activeTextEditor;
        var pos : vscode.Position = editor.selection.active;

		var newPos = pos.with(pos.line + 1, this.NewCol(pos.line + 1));
		this.SetCurrentPosition(newPos);
	}

	static CursorUp() {
		if (TextEditor.GetCurrentPosition().line === 0) {
            return;
		}

        let editor : vscode.TextEditor = vscode.window.activeTextEditor;
        var pos : vscode.Position = editor.selection.active;

		var newPos = pos.with(pos.line - 1, this.NewCol(pos.line - 1));
		this.SetCurrentPosition(newPos);
	}
}

