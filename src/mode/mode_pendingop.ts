import {Mode, ModeName} from './mode';
import * as Operations from '../operations/operation';
import * as Motion from '../motion/motion';

export default class PendingOperationMode extends Mode {
	operationHandlerMap = [];
	motionHandlerMap = [];
	
	private pendingOp: Operations.Operation;
	
	constructor() {
		super(ModeName.PendingOperation);
		this.registerOperations();
	}
	
	ShouldBeActivated(key: string, currentMode: ModeName): boolean {
		if (currentMode == ModeName.Insert) return false;
		return this.operationHandlerMap[key] !== undefined;
	}
	
	HandleActivation(key: string): void {
		var opHandler = this.operationHandlerMap[key];
		if (opHandler != null) {
			this.pendingOp = opHandler;
		} else {
			// need to switch back to command mode
		}
	}
	
	HandleKeyEvent(key: string): void {
		
		var motion = this.motionHandlerMap[key];
		if (motion != null) {
			this.pendingOp.execute(motion);
			// switch back to command mode
		} else {
			// switch back to command mode
		}
	}
	
	registerOperations() {
		this.operationHandlerMap['d'] = new Operations.OperationDelete;
		this.motionHandlerMap['l'] = new Motion.MotionMoveRight();
		this.motionHandlerMap['j'] = new Motion.MotionMoveDown();
		this.motionHandlerMap['w'] = new Motion.MotionMoveWordForward();
	}
} 