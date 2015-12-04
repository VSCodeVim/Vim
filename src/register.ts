export enum TextAction {
	Copy,
	Delete,
	Search
}

export class Register {
	private static unnamed: string;

	static set(action: TextAction, text: string): void {
		// TODO: hanlde delete, search actions
		// TODO: handle named, numbered and other registers
		switch (action) {
			case TextAction.Copy:
			case TextAction.Delete:
				Register.unnamed = text;
				break;
			case TextAction.Search:
				break;
		}
	}

	static getUnnamed(): string {
		return Register.unnamed;
	}
}