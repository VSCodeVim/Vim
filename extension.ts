// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

import * as vscode from 'vscode';
import {showCmdLine} from './src/cmd_line/main';
import * as cc from './src/cmd_line/lexer';
import ModeHandler from "./src/mode/mode_handler";
import {ModeName} from "./src/mode/mode";

var modeHandler;

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

    vscode.commands.registerCommand('extension.vimMode_esc', () => handleKeyEvent("esc"));
    vscode.commands.registerCommand('extension.vimMode_colon', () => handleKeyEvent(":"));
    vscode.commands.registerCommand('extension.vimMode_i', () => handleKeyEvent("i"));
    vscode.commands.registerCommand('extension.vimMode_I', () => handleKeyEvent("I"));
    vscode.commands.registerCommand('extension.vimMode_h', () => handleKeyEvent("h"));
    vscode.commands.registerCommand('extension.vimMode_j', () => handleKeyEvent("j"));
    vscode.commands.registerCommand('extension.vimMode_k', () => handleKeyEvent("k"));
    vscode.commands.registerCommand('extension.vimMode_l', () => handleKeyEvent("l"));
    
    vscode.commands.registerCommand('extension.vimMode_a', () => handleKeyEvent("a"));
    vscode.commands.registerCommand('extension.vimMode_b', () => handleKeyEvent("b"));
    vscode.commands.registerCommand('extension.vimMode_c', () => handleKeyEvent("c"));
    vscode.commands.registerCommand('extension.vimMode_d', () => handleKeyEvent("d"));
    vscode.commands.registerCommand('extension.vimMode_e', () => handleKeyEvent("e"));
    vscode.commands.registerCommand('extension.vimMode_f', () => handleKeyEvent("f"));
    vscode.commands.registerCommand('extension.vimMode_g', () => handleKeyEvent("g"));
    vscode.commands.registerCommand('extension.vimMode_m', () => handleKeyEvent("m"));
    vscode.commands.registerCommand('extension.vimMode_n', () => handleKeyEvent("n"));
    vscode.commands.registerCommand('extension.vimMode_o', () => handleKeyEvent("o"));
    vscode.commands.registerCommand('extension.vimMode_p', () => handleKeyEvent("p"));
    vscode.commands.registerCommand('extension.vimMode_q', () => handleKeyEvent("q"));
    vscode.commands.registerCommand('extension.vimMode_r', () => handleKeyEvent("r"));
    vscode.commands.registerCommand('extension.vimMode_s', () => handleKeyEvent("s"));
    vscode.commands.registerCommand('extension.vimMode_t', () => handleKeyEvent("t"));
    vscode.commands.registerCommand('extension.vimMode_u', () => handleKeyEvent("u"));
    vscode.commands.registerCommand('extension.vimMode_v', () => handleKeyEvent("v"));
    vscode.commands.registerCommand('extension.vimMode_w', () => handleKeyEvent("w"));
    vscode.commands.registerCommand('extension.vimMode_x', () => handleKeyEvent("x"));
    vscode.commands.registerCommand('extension.vimMode_y', () => handleKeyEvent("y"));
    vscode.commands.registerCommand('extension.vimMode_z', () => handleKeyEvent("z"));    
    vscode.commands.registerCommand('extension.vimMode_space', () => handleKeyEvent("space"));
    
    vscode.commands.registerCommand('extension.vimMode_0', () => handleKeyEvent("0"));
    vscode.commands.registerCommand('extension.vimMode_1', () => handleKeyEvent("1"));
    vscode.commands.registerCommand('extension.vimMode_2', () => handleKeyEvent("2"));
    vscode.commands.registerCommand('extension.vimMode_3', () => handleKeyEvent("3"));
    vscode.commands.registerCommand('extension.vimMode_4', () => handleKeyEvent("4"));
    vscode.commands.registerCommand('extension.vimMode_5', () => handleKeyEvent("5"));
    vscode.commands.registerCommand('extension.vimMode_6', () => handleKeyEvent("6"));
    vscode.commands.registerCommand('extension.vimMode_7', () => handleKeyEvent("7"));
    vscode.commands.registerCommand('extension.vimMode_8', () => handleKeyEvent("8"));
    vscode.commands.registerCommand('extension.vimMode_9', () => handleKeyEvent("9"));

    context.subscriptions.push(cmdLineDisposable);
}

function handleKeyEvent(key:string) {
    modeHandler.HandleKeyEvent(key);
}
