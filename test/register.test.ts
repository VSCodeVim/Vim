import {Register, TextAction} from '../src/register';
import * as assert from 'assert';

suite("Register", () => {

	test("should set unnamed register on text copy action", () => {
		Register.set(TextAction.Copy, "abc");
		assert.equal("abc", Register.getUnnamed());
	});

	test("should set unnamed register on text delete action", () => {
		Register.set(TextAction.Delete, "123");
		assert.equal("123", Register.getUnnamed());
	});
});