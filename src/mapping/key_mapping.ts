interface KeyMap {
	[index: string] : string;
}

// stores mappings of a key to one or more keys
export class KeyMappings {
	private mappings : KeyMap = {};

	get(key : string) : string {
		return this.mappings[key] || '';
	}

	set(key : string, mapping : string) : void {
		this.mappings[key] = mapping;
	}
}