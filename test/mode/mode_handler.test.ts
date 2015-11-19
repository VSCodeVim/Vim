import * as assert from 'assert';
import {ModeName} from '../../src/mode/mode';
import ModeHandler from '../../src/mode/mode_handler';

suite("Mode Handler", () => {

    test("ctor", () => {
        var modeHandler = new ModeHandler();
        
        assert.equal(modeHandler.CurrentMode.Name, ModeName.Command);
        assert.equal(modeHandler.CurrentMode.IsActive, true);
    });
    
    test("can set current mode", () => {
        var modeHandler = new ModeHandler();

        modeHandler.SetCurrentModeByName(ModeName.Command);
        assert.equal(modeHandler.CurrentMode.Name, ModeName.Command);

        modeHandler.SetCurrentModeByName(ModeName.Insert);
        assert.equal(modeHandler.CurrentMode.Name, ModeName.Insert);

        modeHandler.SetCurrentModeByName(ModeName.Visual);
        assert.equal(modeHandler.CurrentMode.Name, ModeName.Visual);                    
    });
});
