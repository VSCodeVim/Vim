import * as vscode from 'vscode';
import {
  ConfigurationBase,
  IHandleKeys,
  IModeSpecificStrings,
  IKeyBinding,
} from '../src/configuration/configurationBase';

class TestConfiguration extends ConfigurationBase {
  reload(): void {
    return;
  }
}

export let Configuration = new TestConfiguration();
