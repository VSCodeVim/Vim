import * as vscode from 'vscode';
import TextEditor from './../textEditor';
import {Motion} from './../motion/motion';

export class DeleteAction {
    public static Character(motion : Motion) : Thenable<Motion> {
        let start = motion.position;
        let end = start.translate(0, 1);
        let range = new vscode.Range(start, end);

        return TextEditor.delete(range).then(() => {
            if (motion.position.isLineEnd()) {
                return motion.left().move();
            }
        });
    }
}