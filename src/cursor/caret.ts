import Cursor from "./cursor";

export default class Caret extends Cursor {

	protected static maxLineLength(line: number) : number {
		let len = super.maxLineLength(line) - 1;
		if (len < 0) {
			len = 0;
		}
		return len;
	}
}