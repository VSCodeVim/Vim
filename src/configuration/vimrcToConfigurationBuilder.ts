import { SetCommand } from "../cmd_line/commands/set";

class VimrcSetOptionBuilder {
  public buildSetAction(line: string): (() => void) | undefined {
    line = line.trim();

    if (!line.startsWith("se")) {
      return undefined;
    }

    const result = SetCommand.argParser.parse(line.replace(/set?/, ""));
    if (result.status) {
      const action = result.value;
      return () => action.execute(null);
    } else {
      return undefined;
    }
  }
}

export const vimrcSetOptionBuilder = new VimrcSetOptionBuilder();
