import {ModeName} from '../mode/mode';
import {ModeMappings} from './mode_mapping';

interface BufferKeyMap {
	[index: string] : ModeMappings;
}

// stores ModeMappings by buffer
export class BufferMappings {
	// TODO: make an indexer interface.
	buffers : BufferKeyMap;

	constructor() {
		this.buffers = {};
	}

	get(bufferId : string, key : string, modeName : ModeName) : string {
		const bufferMappings = this.buffers[bufferId];
		
		if (bufferMappings) {
			return bufferMappings.get(key, modeName);
		}
		
		return '';
	}

	set(bufferId : string, key: string, mapping : string, modeName : ModeName) {
		var existingMappings = this.get(bufferId, key, modeName);
		
		if (existingMappings) {
			this.buffers[bufferId].set(key, mapping, modeName);
		} else {
			var bufferMappings = this.buffers[bufferId];
			
			if (!bufferMappings) {
				this.buffers[bufferId] = new ModeMappings();
				this.buffers[bufferId][modeName].set(key, mapping);
			} else {
				bufferMappings.set(key, mapping, modeName);
			}
		}
	}
}
