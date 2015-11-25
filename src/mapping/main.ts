import * as vscode from 'vscode';

import {ModeName} from '../mode/mode';
import {KeyMappings} from './key_mapping';
import {ModeMappings} from './mode_mapping';
import {BufferMappings} from './buffer_mapping';

interface SeenKeys  {
	[index: string] : string[];
}

// Mappings that are active in a Vim session.
export class Mappings {
	private modeMappings : ModeMappings;
	private bufferMappings : BufferMappings;

	constructor() {
		this.modeMappings = new ModeMappings();
		this.bufferMappings = new BufferMappings();
	}

	resolve(key : string, mode : ModeName) : string[] {
		var seen : SeenKeys = {}; // Maps a key to the all the keys it has been expanded to so far.
		var final : string[] = []; // The final sequence of key presses.

		this.recursiveResolve(key, final, seen, mode);

		return final;
	}
	
	setModeMapping(key : string, mapping : string, modeName : ModeName) : void {
		this.modeMappings.set(key, mapping, modeName);
	}
	
	setBufferMapping(key : string, mapping: string, modeName : ModeName, bufferId : string) {
		this.bufferMappings.set(bufferId, key, mapping, modeName);
	}

	private recursiveResolve(key : string, final : string[], seen : SeenKeys, currentMode : ModeName) : void {
		var mapped : string = this.bufferMappings.get(vscode.window.activeTextEditor.document.fileName, key, currentMode);

		if (!mapped) {
			mapped = this.modeMappings.get(key, currentMode);
		}

		// Literal key press; no mapping defined for it.
		if (!mapped) {
			final.push(key);
			return;
		}

		let mappedAsArray = mapped.split('');

		var allMapped = (seen[key] || []);
		allMapped.push(...mappedAsArray);
		seen[key] = allMapped;
		
		// Are there cycles while expanding this key?		
		if (this.checkIfHasCycles(key, mappedAsArray, seen)) {
			throw new Error("recursive mapping");
		}

		for (var i = 0; i < mappedAsArray.length; i++) {
			this.recursiveResolve(mappedAsArray[i], final, seen, currentMode);
		}
	}

	private checkIfHasCycles(key : string, expandedKeys : string[], seen : SeenKeys) {
		for (var i = 0; i < expandedKeys.length; i++) {
			const expandedKey = expandedKeys[i];
			if(seen[expandedKey] && seen[expandedKey].some(k => k === key)) {
				return true;
			}
		}

		return false;
	}
}