"use strict";

import * as node from "../node";
import { ModeHandler } from "../../mode/modeHandler";

export class NohlCommand extends node.CommandBase {
  protected _arguments: {};

  constructor(args: {}) {
    super();

    this._name = 'nohl';
    this._arguments = args;
  }

  get arguments(): {} {
    return this._arguments;
  }

  async execute(modeHandler : ModeHandler): Promise<void> {
    modeHandler.vimState.globalState.hl = false;
  }
}