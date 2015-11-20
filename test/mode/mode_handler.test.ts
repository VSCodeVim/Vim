import * as assert from 'assert';
import {ModeName} from '../../src/mode/mode';
import ModeHandler from '../../src/mode/mode_handler';

suite("Mode Handler", () => {

    test("ctor", () => {
        var modeHandler = new ModeHandler();
        
        assert.equal(modeHandler.currentMode.Name, ModeName.Command);
        assert.equal(modeHandler.currentMode.IsActive, true);
    });
    
    test("can set current mode", () => {
        var modeHandler = new ModeHandler();

        modeHandler.setCurrentModeByName(ModeName.Command);
        assert.equal(modeHandler.currentMode.Name, ModeName.Command);

        modeHandler.setCurrentModeByName(ModeName.Insert);
        assert.equal(modeHandler.currentMode.Name, ModeName.Insert);

        modeHandler.setCurrentModeByName(ModeName.Visual);
        assert.equal(modeHandler.currentMode.Name, ModeName.Visual);                    
    });
});
