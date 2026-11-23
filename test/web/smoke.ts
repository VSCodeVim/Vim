import * as vscode from 'vscode';

/**
 * Sends keys the way VS Code does when the user types. VSCodeVim queues each key and handles it
 * asynchronously, so use `waitForText` to see the result.
 */
async function sendKeys(...keys: string[]): Promise<void> {
  for (const key of keys) {
    // `<Esc>` and friends are single keys; anything else is typed one character at a time
    for (const text of key.startsWith('<') ? [key] : [...key]) {
      await vscode.commands.executeCommand('type', { text });
    }
  }
}

async function waitForText(document: vscode.TextDocument, expected: string): Promise<void> {
  // New documents use the host OS's line endings
  const getText = () => document.getText().replace(/\r\n/g, '\n');
  const deadline = Date.now() + 5000;
  while (getText() !== expected) {
    if (Date.now() > deadline) {
      throw new Error(
        `Expected document text ${JSON.stringify(expected)}, got ${JSON.stringify(getText())}`,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

async function openEditor(content: string): Promise<vscode.TextDocument> {
  const document = await vscode.workspace.openTextDocument({ content });
  await vscode.window.showTextDocument(document);
  return document;
}

suite('Web extension smoke tests', () => {
  suiteSetup(async () => {
    const extension = vscode.extensions.getExtension('vscodevim.vim');
    if (extension === undefined) {
      throw new Error('VSCodeVim is not installed in the web extension host');
    }
    await extension.activate();
  });

  teardown(async () => {
    await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor');
  });

  test('Insert mode', async () => {
    const document = await openEditor('');
    await sendKeys('ihello world', '<Esc>');
    await waitForText(document, 'hello world');
  });

  test('Operator, motion, and undo', async () => {
    const document = await openEditor('hello world');
    await sendKeys('dw');
    await waitForText(document, 'world');
    await sendKeys('u');
    await waitForText(document, 'hello world');
  });

  test('Yank and put', async () => {
    const document = await openEditor('hello');
    await sendKeys('yyp');
    await waitForText(document, 'hello\nhello');
  });

  test('Ex command', async () => {
    const document = await openEditor('hello world');
    await sendKeys(':s/world/vim/\n');
    await waitForText(document, 'hello vim');
  });
});
