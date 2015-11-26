import * as vscode from "vscode";

export default class TextEditor {      
    static Insert(text: string, position: vscode.Position = null) {
        if (position === null) {
            position = vscode.window.activeTextEditor.selection.active;
        }
        
        vscode.window.activeTextEditor.edit((editBuilder) => {
            editBuilder.insert(position, text);
        });
    }

    static Delete(range: vscode.Range) {
        vscode.window.activeTextEditor.edit((editBuilder) => {
            editBuilder.delete(range);
        });
    }

    static Replace(range: vscode.Range, text: string) {
        vscode.window.activeTextEditor.edit((editBuilder) => {
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
        var newSelection = new vscode.Selection(position, position);
        vscode.window.activeTextEditor.selection = newSelection;
    }
}