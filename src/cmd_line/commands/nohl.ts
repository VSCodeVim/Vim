"use strict";

import * as vscode from "vscode";
import * as node from "../node";
import { Configuration } from './../../configuration/configuration';

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

  async execute(): Promise<void> {
    Configuration.getInstance().hl = false;
  }
}