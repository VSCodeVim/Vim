import {ModeName, Mode} from './mode';
import {showCmdLine} from './../cmd_line/main';
import * as vscode from 'vscode';
import * as Motion from '../motion/motion';

export default class CommandMode extends Mode {
    motionHandlerMap = [];
    
    constructor() {
        super(ModeName.Command);
        this.registerMotionMappings();
    }

    ShouldBeActivated(key : string, currentMode : ModeName) : boolean {
        return (key === 'esc');
    }

    HandleActivation(key : string) : void {
        // do nothing
    }    

    HandleKeyEvent(key : string) : void {
        this.keyHistory.push(key);

                
        switch (key) {
            case ':':
                showCmdLine();
                break;
            default:
                var handler = this.motionHandlerMap[key];
                if (handler != null) handler.execute();
        }
    }
    
    registerMotionMappings() {
        this.motionHandlerMap['h'] = new Motion.MotionMoveLeft(); 
        this.motionHandlerMap['j'] = new Motion.MotionMoveDown(); 
        this.motionHandlerMap['k'] = new Motion.MotionMoveUp(); 
        this.motionHandlerMap['l'] = new Motion.MotionMoveRight();
        this.motionHandlerMap['w'] = new Motion.MotionMoveWordForward();
        this.motionHandlerMap['b'] = new Motion.MotionMoveWordBackward();
    }
}