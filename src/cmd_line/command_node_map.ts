import vscode = require('vscode');

import node = require('./node');
import util = require('../util');
import mapping = require('../mapping/main');
import mode = require('../mode/mode');

export interface MapCommandArguments {
	lhs? : string;
	rhs? : string;
}

//
//  Implements :write
//  http://vimdoc.sourceforge.net/htmldoc/map.html#:map
//
export class MapCommand implements node.CommandBase {
	name : string;
	shortName : string;
	args : MapCommandArguments;

	constructor(args : MapCommandArguments = {}) {
		this.name = 'map';
		this.shortName = null;
		this.args = args;
	}

	runOn(textEditor : vscode.TextEditor, mappings : mapping.Mappings) : void {
		mappings.setModeMapping(this.args.lhs, this.args.rhs, mode.ModeName.All);
	}
}
