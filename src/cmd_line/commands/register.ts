import * as vscode from 'vscode';

// eslint-disable-next-line id-denylist
import { Parser, any, optWhitespace } from 'parsimmon';
import { Register, RegisterContent } from '../../register/register';
import { RecordedState } from '../../state/recordedState';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import { IPutCommandArguments, PutExCommand } from './put';

class RegisterDisplayItem implements vscode.QuickPickItem {
  public readonly label: string;
  public readonly description: string;
  public readonly buttons: readonly vscode.QuickInputButton[];

  public readonly key: string;
  public readonly content: RegisterContent | undefined;
  public readonly stringContent: string;

  constructor(registerKey: string, content: RegisterContent | undefined) {
    this.label = registerKey;
    this.key = registerKey;

    this.content = content;
    this.stringContent = '';
    this.description = '';
    this.buttons = [];

    if (typeof content === 'string') {
      this.stringContent = content;
      this.description = this.stringContent;
    } else if (content instanceof RecordedState) {
      this.description = content.actionsRun.map((x) => x.keysPressed.join('')).join('');
    }

    if (this.description.length > 100) {
      // maximum length of 100 characters for the description
      this.description = this.description.slice(0, 97) + '...';
    }

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

    this.registerKeys = Register.getKeysSorted().filter((r) => !Register.isBlackHoleRegister(r));

    if (registers.length > 0) {
      this.registerKeys = this.registerKeys.filter((r) => registers.includes(r));
    }
  }

  async execute(vimState: VimState): Promise<void> {
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

      RegisterCommand.showRegisterContent(vimState, items[0]);
      quickPick.dispose();
    });

    quickPick.onDidTriggerItemButton(async (event) => {
      void RegisterCommand.paste(vimState, event.item);
      quickPick.dispose();
    });

    quickPick.show();
  }

  private static showRegisterContent(vimState: VimState, item: RegisterDisplayItem) {
    const paste: vscode.MessageItem = {
      title: 'Paste',
      isCloseAffordance: false,
    };

    void vscode.window
      .showInformationMessage(`${item.label} ${item.stringContent}`, paste)
      .then((action) => {
        if (!action || action !== paste) {
          return;
        }

        void RegisterCommand.paste(vimState, item);
      });
  }

  private static async paste(vimState: VimState, item: RegisterDisplayItem) {
    // TODO: Can I reuse PutCommand here?

    const content = item.stringContent;
    if (content === '') {
      return;
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    vimState.recordedState.registerKey = item.key;

    editor.edit((builder) => {
      builder.insert(vimState.cursorStopPosition, content);
    });
  }
}
