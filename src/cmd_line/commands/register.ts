import * as vscode from 'vscode';

// eslint-disable-next-line id-denylist
import { Parser, any, optWhitespace } from 'parsimmon';
import { Register, RegisterContent } from '../../register/register';
import { RecordedState } from '../../state/recordedState';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';

class RegisterDisplayItem implements vscode.QuickPickItem {
  public readonly label: string;
  public readonly description: string;

  public readonly content: RegisterContent | undefined;
  public readonly stringContent: string;

  public readonly buttons: readonly vscode.QuickInputButton[];

  constructor(registerKey: string, content: RegisterContent | undefined) {
    this.label = registerKey;
    this.content = content;
    this.stringContent = '';
    this.description = '';
    this.buttons = [];

    if (typeof content === 'string') {
      this.stringContent = content;
      this.description = this.stringContent;
    } else if (content instanceof Array) {
      this.stringContent = content.join('\n');
      this.description = this.stringContent;
    } else if (content instanceof RecordedState) {
      this.description = content.actionsRun.map((x) => x.keysPressed.join('')).join('');
    }

    // maximum length of 100 characters for the description
    this.description = this.description.slice(0, 100);

    if (this.stringContent !== '') {
      this.buttons = [
        {
          tooltip: 'Paste',
          iconPath: new vscode.ThemeIcon('clippy'),
        },
      ];
    }
  }
}

export class RegisterCommand extends ExCommand {
  public override isRepeatableWithDot: boolean = false;
  private readonly registerKeys: string[];

  public static readonly argParser: Parser<RegisterCommand> = optWhitespace.then(
    // eslint-disable-next-line id-denylist
    any.sepBy(optWhitespace).map((registers) => new RegisterCommand(registers)),
  );

  constructor(registers: string[]) {
    super();
    this.registerKeys = Register.getKeys()
      .filter((reg) => reg !== '_' && (registers.length === 0 || registers.includes(reg)))
      .sort((reg1: string, reg2: string) => this.regSortOrder(reg1) - this.regSortOrder(reg2));
  }

  private regSortOrder(register: string): number {
    const specials = ['-', '*', '+', '.', ':', '%', '#', '/', '='];
    if (register === '"') {
      return 0;
    } else if (register >= '0' && register <= '9') {
      return 10 + parseInt(register, 10);
    } else if (register >= 'a' && register <= 'z') {
      return 100 + (register.charCodeAt(0) - 'a'.charCodeAt(0));
    } else if (specials.includes(register)) {
      return 1000 + specials.indexOf(register);
    } else {
      throw new Error(`Unexpected register ${register}`);
    }
  }

  async execute(_: VimState): Promise<void> {
    const quickPick = vscode.window.createQuickPick<RegisterDisplayItem>();

    quickPick.items = await Promise.all(
      this.registerKeys.map(async (r) => {
        const register = await Register.get(r);
        return new RegisterDisplayItem(r, register?.text);
      }),
    );

    quickPick.onDidChangeSelection((items) => {
      if (items.length === 0) {
        return;
      }
      const item = items[0];

      vscode.window.showInformationMessage(`${item.label} ${item.stringContent}`);
      quickPick.dispose();
    });

    quickPick.onDidTriggerItemButton((event) => {
      const content = event.item.stringContent;

      if (content !== '') {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          editor.edit((editBuilder) => {
            editBuilder.insert(editor.selection.end, content);
          });
        }
      }

      quickPick.dispose();
    });

    quickPick.show();
  }
}
