import * as _ from 'lodash';
import * as vscode from 'vscode';
import {ModeName, Mode} from './mode';
import {showCmdLine} from './../cmd_line/main';
import {Caret, Operator, VimOperation, Cursor, RequestInput, Root, StopRequestingInput, ChangeMode} from './../motion/motion';
import {KeyState, KeyParser} from '../keyState';
import {WordLeft, WordRight, FindCharacter, Delete, SingleCharArgument, Pick, Motion, VimOp} from '../motion';

export default class CommandMode extends Mode {
    private caret : Caret = new Caret();
	private cursor : Cursor = new Cursor();
	private operator : Operator = new Operator();
	private normal : { [key: string] : VimOp } = {};
	private operatorPending : { [key: string] : Motion } = {};
	private ops : VimOp;

	constructor() {
		super(ModeName.Normal);
		
		this.operatorPending = {
			'w': new WordLeft(),
			'b': new WordRight(),
			'f': new FindCharacter().and(new SingleCharArgument())			
		}		
				
		this.normal = {
			'w': new WordLeft(),
			'b': new WordRight(),
			'f': new FindCharacter().and(new SingleCharArgument()),
			'd': new Delete().and(new Pick(this.operatorPending)),
		}		
	}	

	// receives keys
	handleKeys(state :KeyState) : void {
		const operation = this.normal[state.next()];
		if (this.ops) {
			this.ops.and(operation);
		} else {
			this.ops = operation;
		}
		this.eval(state);
	}
	
	// run a command if available
	private eval(state : KeyState) {
		if (this.ops) {
			this.ops.execute(state);
		}
		this.ops = null;
	}

	ShouldBeActivated(key : string, currentMode : ModeName) : boolean {
		return (key === 'esc' || key === 'ctrl+[');
	}
	
	private shouldRequestModeChange(key : string) : boolean {
		return (key === 'i' || key === 'I' || key === 'a' || key === 'A' || key === 'o' || key === 'O');
	}	

	HandleActivation(key : string) : Thenable<{}> {
		return Promise.resolve(this.caret.reset().left().move());
	}

	HandleKeyEvent(key : string) : Thenable<{}> {
		return null;
	}
}
