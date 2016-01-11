// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

import * as vscode from 'vscode';
import {showCmdLine} from './src/cmd_line/main';
import * as cc from './src/cmd_line/lexer';
import ModeHandler from "./src/mode/modeHandler";
import {ModeName} from "./src/mode/mode";

var modeHandler : ModeHandler;
var extensionContext : vscode.ExtensionContext;

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "vim" is now active!');
    
    extensionContext = context;

    registerCommand(context, 'extension.showCmdLine', () => showCmdLine());

    registerCommand(context, 'extension.vim_esc', () => handleKeyEvent("esc"));
    registerCommand(context, 'extension.vim_colon', () => handleKeyEvent(":"));
    registerCommand(context, 'extension.vim_space', () => handleKeyEvent("space"));

    registerCommand(context, 'extension.vim_a', () => handleKeyEvent("a"));
    registerCommand(context, 'extension.vim_b', () => handleKeyEvent("b"));
    registerCommand(context, 'extension.vim_c', () => handleKeyEvent("c"));
    registerCommand(context, 'extension.vim_d', () => handleKeyEvent("d"));
    registerCommand(context, 'extension.vim_e', () => handleKeyEvent("e"));
    registerCommand(context, 'extension.vim_f', () => handleKeyEvent("f"));
    registerCommand(context, 'extension.vim_g', () => handleKeyEvent("g"));
    registerCommand(context, 'extension.vim_h', () => handleKeyEvent("h"));
    registerCommand(context, 'extension.vim_i', () => handleKeyEvent("i"));
    registerCommand(context, 'extension.vim_j', () => handleKeyEvent("j"));
    registerCommand(context, 'extension.vim_k', () => handleKeyEvent("k"));
    registerCommand(context, 'extension.vim_l', () => handleKeyEvent("l"));
    registerCommand(context, 'extension.vim_m', () => handleKeyEvent("m"));
    registerCommand(context, 'extension.vim_n', () => handleKeyEvent("n"));
    registerCommand(context, 'extension.vim_o', () => handleKeyEvent("o"));
    registerCommand(context, 'extension.vim_p', () => handleKeyEvent("p"));
    registerCommand(context, 'extension.vim_q', () => handleKeyEvent("q"));
    registerCommand(context, 'extension.vim_r', () => handleKeyEvent("r"));
    registerCommand(context, 'extension.vim_s', () => handleKeyEvent("s"));
    registerCommand(context, 'extension.vim_t', () => handleKeyEvent("t"));
    registerCommand(context, 'extension.vim_u', () => handleKeyEvent("u"));
    registerCommand(context, 'extension.vim_v', () => handleKeyEvent("v"));
    registerCommand(context, 'extension.vim_w', () => handleKeyEvent("w"));
    registerCommand(context, 'extension.vim_x', () => handleKeyEvent("x"));
    registerCommand(context, 'extension.vim_y', () => handleKeyEvent("y"));
    registerCommand(context, 'extension.vim_z', () => handleKeyEvent("z"));

    registerCommand(context, 'extension.vim_A', () => handleKeyEvent("A"));
    registerCommand(context, 'extension.vim_B', () => handleKeyEvent("B"));
    registerCommand(context, 'extension.vim_C', () => handleKeyEvent("C"));
    registerCommand(context, 'extension.vim_D', () => handleKeyEvent("D"));
    registerCommand(context, 'extension.vim_E', () => handleKeyEvent("E"));
    registerCommand(context, 'extension.vim_F', () => handleKeyEvent("F"));
    registerCommand(context, 'extension.vim_G', () => handleKeyEvent("G"));
    registerCommand(context, 'extension.vim_H', () => handleKeyEvent("H"));
    registerCommand(context, 'extension.vim_I', () => handleKeyEvent("I"));
    registerCommand(context, 'extension.vim_J', () => handleKeyEvent("J"));
    registerCommand(context, 'extension.vim_K', () => handleKeyEvent("K"));
    registerCommand(context, 'extension.vim_L', () => handleKeyEvent("L"));
    registerCommand(context, 'extension.vim_M', () => handleKeyEvent("M"));
    registerCommand(context, 'extension.vim_N', () => handleKeyEvent("N"));
    registerCommand(context, 'extension.vim_O', () => handleKeyEvent("O"));
    registerCommand(context, 'extension.vim_P', () => handleKeyEvent("P"));
    registerCommand(context, 'extension.vim_Q', () => handleKeyEvent("Q"));
    registerCommand(context, 'extension.vim_R', () => handleKeyEvent("R"));
    registerCommand(context, 'extension.vim_S', () => handleKeyEvent("S"));
    registerCommand(context, 'extension.vim_T', () => handleKeyEvent("T"));
    registerCommand(context, 'extension.vim_U', () => handleKeyEvent("U"));
    registerCommand(context, 'extension.vim_V', () => handleKeyEvent("V"));
    registerCommand(context, 'extension.vim_W', () => handleKeyEvent("W"));
    registerCommand(context, 'extension.vim_X', () => handleKeyEvent("X"));
    registerCommand(context, 'extension.vim_Y', () => handleKeyEvent("Y"));
    registerCommand(context, 'extension.vim_Z', () => handleKeyEvent("Z"));

    registerCommand(context, 'extension.vim_0', () => handleKeyEvent("0"));
    registerCommand(context, 'extension.vim_1', () => handleKeyEvent("1"));
    registerCommand(context, 'extension.vim_2', () => handleKeyEvent("2"));
    registerCommand(context, 'extension.vim_3', () => handleKeyEvent("3"));
    registerCommand(context, 'extension.vim_4', () => handleKeyEvent("4"));
    registerCommand(context, 'extension.vim_5', () => handleKeyEvent("5"));
    registerCommand(context, 'extension.vim_6', () => handleKeyEvent("6"));
    registerCommand(context, 'extension.vim_7', () => handleKeyEvent("7"));
    registerCommand(context, 'extension.vim_8', () => handleKeyEvent("8"));
    registerCommand(context, 'extension.vim_9', () => handleKeyEvent("9"));   

    registerCommand(context, 'extension.vim_$', () => handleKeyEvent("$"));
    registerCommand(context, 'extension.vim_^', () => handleKeyEvent("^"));

    registerCommand(context, 'extension.vim_ctrl_r', () => handleKeyEvent("ctrl+r"));
    registerCommand(context, 'extension.vim_ctrl_[', () => handleKeyEvent("ctrl+["));
    
    registerCommand(context, 'extension.vim_<', () => handleKeyEvent("<"));
    registerCommand(context, 'extension.vim_>', () => handleKeyEvent(">"));
    
    registerCommand(context, 'extension.vim_backslash', () => handleKeyEvent("\\"));
    
    registerCommand(context, 'extension.vim_oem_102', () => handleKeyEvent("oem_102"));
    registerCommand(context, 'extension.vim_shift_oem_102', () => handleKeyEvent("shift+oem_102"));
    
    context.subscriptions.push(modeHandler); 
}

function registerCommand(context: vscode.ExtensionContext, command: string, callback: (...args: any[]) => any) {
    let disposable =  vscode.commands.registerCommand(command, callback);
    context.subscriptions.push(disposable);
}

function handleKeyEvent(key:string) {
    if (!modeHandler) {
        modeHandler = new ModeHandler();
        extensionContext.subscriptions.push(modeHandler);   
    }
    
    modeHandler.handleKeyEvent(key);
}
