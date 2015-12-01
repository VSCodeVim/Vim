export default class Repeat {
	private static count: number = 0;
	
	static get(): number {
		var n = this.count;
		this.count = 0;
		return (n > 0) ? n : 1;
	}
	
	static add(n: number): boolean {
		if ((n === 0) && (this.count === 0)) {
			return false;
		}
		this.count = this.count * 10 + n;
		return true;	
	}
	
	static reset() {
		this.count = 0;
	}
}