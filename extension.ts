// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

import * as vscode from 'vscode';
import {showCmdLine} from './src/cmd_line/main';
import * as cc from './src/cmd_line/lexer';
import ModeHandler from "./src/mode/modeHandler";
import {ModeName} from "./src/mode/mode";

let modeHandler: ModeHandler;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    modeHandler = new ModeHandler();

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "vim" is now active!');

    var cmdLineDisposable = vscode.commands.registerCommand('extension.showCmdLine', () => {
        showCmdLine();
    });

    vscode.commands.registerCommand('extension.vim_esc', () => handleKeyEvent("esc"));
    vscode.commands.registerCommand('extension.vim_colon', () => handleKeyEvent(":"));
    vscode.commands.registerCommand('extension.vim_space', () => handleKeyEvent("space"));

    vscode.commands.registerCommand('extension.vim_a', () => handleKeyEvent("a"));
    vscode.commands.registerCommand('extension.vim_b', () => handleKeyEvent("b"));
    vscode.commands.registerCommand('extension.vim_c', () => handleKeyEvent("c"));
    vscode.commands.registerCommand('extension.vim_d', () => handleKeyEvent("d"));
    vscode.commands.registerCommand('extension.vim_e', () => handleKeyEvent("e"));
    vscode.commands.registerCommand('extension.vim_f', () => handleKeyEvent("f"));
    vscode.commands.registerCommand('extension.vim_g', () => handleKeyEvent("g"));
    vscode.commands.registerCommand('extension.vim_h', () => handleKeyEvent("h"));
    vscode.commands.registerCommand('extension.vim_i', () => handleKeyEvent("i"));
    vscode.commands.registerCommand('extension.vim_j', () => handleKeyEvent("j"));
    vscode.commands.registerCommand('extension.vim_k', () => handleKeyEvent("k"));
    vscode.commands.registerCommand('extension.vim_l', () => handleKeyEvent("l"));
    vscode.commands.registerCommand('extension.vim_m', () => handleKeyEvent("m"));
    vscode.commands.registerCommand('extension.vim_n', () => handleKeyEvent("n"));
    vscode.commands.registerCommand('extension.vim_o', () => handleKeyEvent("o"));
    vscode.commands.registerCommand('extension.vim_p', () => handleKeyEvent("p"));
    vscode.commands.registerCommand('extension.vim_q', () => handleKeyEvent("q"));
    vscode.commands.registerCommand('extension.vim_r', () => handleKeyEvent("r"));
    vscode.commands.registerCommand('extension.vim_s', () => handleKeyEvent("s"));
    vscode.commands.registerCommand('extension.vim_t', () => handleKeyEvent("t"));
    vscode.commands.registerCommand('extension.vim_u', () => handleKeyEvent("u"));
    vscode.commands.registerCommand('extension.vim_v', () => handleKeyEvent("v"));
    vscode.commands.registerCommand('extension.vim_w', () => handleKeyEvent("w"));
    vscode.commands.registerCommand('extension.vim_x', () => handleKeyEvent("x"));
    vscode.commands.registerCommand('extension.vim_y', () => handleKeyEvent("y"));
    vscode.commands.registerCommand('extension.vim_z', () => handleKeyEvent("z"));

    vscode.commands.registerCommand('extension.vim_A', () => handleKeyEvent("A"));
    vscode.commands.registerCommand('extension.vim_B', () => handleKeyEvent("B"));
    vscode.commands.registerCommand('extension.vim_C', () => handleKeyEvent("C"));
    vscode.commands.registerCommand('extension.vim_D', () => handleKeyEvent("D"));
    vscode.commands.registerCommand('extension.vim_E', () => handleKeyEvent("E"));
    vscode.commands.registerCommand('extension.vim_F', () => handleKeyEvent("F"));
    vscode.commands.registerCommand('extension.vim_G', () => handleKeyEvent("G"));
    vscode.commands.registerCommand('extension.vim_H', () => handleKeyEvent("H"));
    vscode.commands.registerCommand('extension.vim_I', () => handleKeyEvent("I"));
    vscode.commands.registerCommand('extension.vim_J', () => handleKeyEvent("J"));
    vscode.commands.registerCommand('extension.vim_K', () => handleKeyEvent("K"));
    vscode.commands.registerCommand('extension.vim_L', () => handleKeyEvent("L"));
    vscode.commands.registerCommand('extension.vim_M', () => handleKeyEvent("M"));
    vscode.commands.registerCommand('extension.vim_N', () => handleKeyEvent("N"));
    vscode.commands.registerCommand('extension.vim_O', () => handleKeyEvent("O"));
    vscode.commands.registerCommand('extension.vim_P', () => handleKeyEvent("P"));
    vscode.commands.registerCommand('extension.vim_Q', () => handleKeyEvent("Q"));
    vscode.commands.registerCommand('extension.vim_R', () => handleKeyEvent("R"));
    vscode.commands.registerCommand('extension.vim_S', () => handleKeyEvent("S"));
    vscode.commands.registerCommand('extension.vim_T', () => handleKeyEvent("T"));
    vscode.commands.registerCommand('extension.vim_U', () => handleKeyEvent("U"));
    vscode.commands.registerCommand('extension.vim_V', () => handleKeyEvent("V"));
    vscode.commands.registerCommand('extension.vim_W', () => handleKeyEvent("W"));
    vscode.commands.registerCommand('extension.vim_X', () => handleKeyEvent("X"));
    vscode.commands.registerCommand('extension.vim_Y', () => handleKeyEvent("Y"));
    vscode.commands.registerCommand('extension.vim_Z', () => handleKeyEvent("Z"));

    vscode.commands.registerCommand('extension.vim_0', () => handleKeyEvent("0"));
    vscode.commands.registerCommand('extension.vim_1', () => handleKeyEvent("1"));
    vscode.commands.registerCommand('extension.vim_2', () => handleKeyEvent("2"));
    vscode.commands.registerCommand('extension.vim_3', () => handleKeyEvent("3"));
    vscode.commands.registerCommand('extension.vim_4', () => handleKeyEvent("4"));
    vscode.commands.registerCommand('extension.vim_5', () => handleKeyEvent("5"));
    vscode.commands.registerCommand('extension.vim_6', () => handleKeyEvent("6"));
    vscode.commands.registerCommand('extension.vim_7', () => handleKeyEvent("7"));
    vscode.commands.registerCommand('extension.vim_8', () => handleKeyEvent("8"));
    vscode.commands.registerCommand('extension.vim_9', () => handleKeyEvent("9"));
    
    vscode.commands.registerCommand('extension.vim_ctrl_[', () => handleKeyEvent("ctrl+["));
    
    vscode.commands.registerCommand('extension.vim_<', () => handleKeyEvent("<"));
    vscode.commands.registerCommand('extension.vim_>', () => handleKeyEvent(">"));
    
    vscode.commands.registerCommand('extension.vim_$', () => handleKeyEvent("$"));
    
    registerCustomCommands();
    context.subscriptions.push(cmdLineDisposable);
}

function handleKeyEvent(key:string) {
    modeHandler.handleKeyEvent(key);
}

function registerCustomCommands() {
    // TODO: Not sure where to put this..
    // Will move cursor to EOL
    vscode.commands.registerCommand("cursorEndOfLine", () => {
        let cursorCharIndex = vscode.window.activeTextEditor.selection.active.character;
        let lineNumber = vscode.window.activeTextEditor.selection.active.line;
        
        let lineLength = vscode.window.activeTextEditor.document.lineAt(vscode.window.activeTextEditor.selection.active.line).text.length;
        let charDelta = lineLength - cursorCharIndex;
        
        let position = new vscode.Position(lineNumber, cursorCharIndex);
        let updatedPosition = position.translate(0, charDelta);
        
        let selection = new vscode.Selection(updatedPosition, updatedPosition);
        
        vscode.window.activeTextEditor.selection = selection;
        vscode.window.activeTextEditor.revealRange(selection, vscode.TextEditorRevealType.Default);
    });
}