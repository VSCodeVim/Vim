import * as _ from 'lodash';
import * as vscode from 'vscode';
import {ModeName, Mode} from './mode';
import {showCmdLine} from './../cmd_line/main';
import Cursor from './../cursor';
import TextEditor from './../textEditor';
import * as Motions from './../motions/commonMotions';
import * as Operators from './../operations/commonOperations';

export default class CommandMode extends Mode {
	private operations: { [key: string]: () => any;} = {};
	private opStack: any[] = [];
	
	constructor() {
		super(ModeName.Normal);
		
		this.operations = {
			"d": () => this.lineWiseOperator(Operators.Delete),
			"h": () => new Motions.Left(),
			"l": () => new Motions.Right(),
			"j": () => new Motions.Down(),
			"k": () => new Motions.Up(),
			"w": () => new Motions.WordRight(),
			"b": () => new Motions.WordLeft(),
			"x": () => [new Operators.Delete(), new Motions.Right()],
			"X": () => [new Operators.Delete(), new Motions.Left()]
		}
	}
	
	private lineWiseOperator(constructor) {
		if (this.topOperation instanceof constructor) {
			return new Motions.MoveToRelativeLine();
		} else {
			return new constructor();
		}
	}
	
	ShouldBeActivated(key : string, currentMode : ModeName) : boolean {
		if (key === 'esc' || key === 'ctrl+[') {
			Cursor.move(Cursor.left());
			return true;
		}
	}

	HandleActivation(key : string) : void {
		// do nothing
	}

	HandleKeyEvent(key : string) : void {

		if (this.operations[key] != undefined) {
			let ops = this.operations[key]();
			ops = _.isArray(ops) ? ops : [ops];

			for (var operation of ops) {
				if (this.topOperation != null && typeof this.topOperation.canComposeWith === "function" && !this.topOperation.canComposeWith(operation)) {
					console.log("could not compose");
					//reset to normal mode
					this.keyHistory = [];
					this.opStack = [];
					return;
				}
				
				this.opStack.push(operation);
			}
			
			this.processStack();
		}

	}

	private get topOperation(): any {
		return _.last(this.opStack);
	}
	
	private processStack() {
		if (this.opStack.length === 0) {
			return;
		}
		
		if (this.topOperation instanceof Operators.Operator && !this.topOperation.isComposed) {
			//setup pending operator mode here
			return;
		}
		
		var operation = this.opStack.pop();
		if (this.opStack.length) {
			this.topOperation.compose(operation);
			this.processStack();
		} else {
			operation.execute();
		}
	}
}
