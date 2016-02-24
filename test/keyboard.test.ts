"use strict";

// The module 'assert' provides assertion methods from node
import * as assert from 'assert';
import {KeyboardLayout, IKeyMapper} from '../src/keyboard';

suite("KeyboardLayout", () => {

    test("ctor", () => {
        const layout = new KeyboardLayout();
        assert.equal(layout.name, "en-US (QWERTY)");
    });

    test("lets keys through if using default layout", () => {
        const layout = new KeyboardLayout();
        assert.equal(layout.translate('>'), '>');
        assert.equal(layout.translate(':'), ':');
        assert.equal(layout.translate('.'), '.');
    });

    test("can use custom mapper", () => {
        class FakeMapper implements IKeyMapper {
            get name() : string {
                return "fake mapper";
            }

            get(key : string) : string {
                return "fake key";
            }
        }

        const layout = new KeyboardLayout(new FakeMapper());
        assert.equal(layout.name, "fake mapper");
        assert.equal(layout.translate('>'), 'fake key');
        assert.equal(layout.translate(':'), 'fake key');
        assert.equal(layout.translate('.'), 'fake key');
    });
});

suite("KeyMapperEsEsQwerty", () => {
    // TODO: cannot set settings from api?
});
