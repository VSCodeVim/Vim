"use strict";

import * as vscode from 'vscode';
import {TextEditor} from './../textEditor';
import {Motion} from './../motion/motion';

export class DeleteAction {
    public static async Character(motion : Motion): Promise<Motion> {
        let start = motion.position;
        let end   = start.translate(0, 1);
        let range = new vscode.Range(start, end);

        await TextEditor.delete(range);

        if (motion.position.isLineEnd()) {
            return motion.left().move();
        }
    }
}