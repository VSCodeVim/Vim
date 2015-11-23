import {ModeName} from '../mode/mode';
import {KeyMappings} from './key_mapping';

interface ModeKeyMap {
	[index: number] : KeyMappings;
}

// stores KeyMappings by mode
export class ModeMappings {
	modes : ModeKeyMap;

	constructor() {
		this.modes = {};
		this.modes[ModeName.Command] = new KeyMappings();
		this.modes[ModeName.Insert] = new KeyMappings();
		this.modes[ModeName.Visual] = new KeyMappings();
		this.modes[ModeName.All] = new KeyMappings();
	}

	get(key : string, modeName : ModeName) : string {
		var mappings = this.modes[modeName].get(key)
		
		// Check for global mappings if no mode-specific mappings were found.
		if (!mappings) {
			mappings = this.modes[ModeName.All].get(key);
		}
		
		return mappings || '';
	}

	set(key : string, mapping : string, modeName : ModeName) {
		this.modes[modeName].set(key, mapping);
	}
}
