import {ModeName, Mode} from './mode';
import {showCmdLine} from './../cmd_line/main';
import * as vscode from 'vscode';
import * as Motion from '../motion/motion';

export default class CommandMode extends Mode {
    motionMappings = [];
    
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
                var map = this.motionMappings[key];
                if (map != null) map.execute();
        }
    }
    
    registerMotionMappings() {
        this.motionMappings['h'] = new Motion.MotionMoveLeft(); 
        this.motionMappings['j'] = new Motion.MotionMoveDown(); 
        this.motionMappings['k'] = new Motion.MotionMoveUp(); 
        this.motionMappings['l'] = new Motion.MotionMoveRight();
        this.motionMappings['w'] = new Motion.MotionMoveWordForward();
    }
}