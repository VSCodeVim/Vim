import { RegisterCommand } from '../commands/register';
import { Scanner } from '../scanner';

export function parseRegisterCommandArgs(args: string): RegisterCommand {
  if (!args || !args.trim()) {
    return new RegisterCommand({
      registers: [],
    });
  }

  const scanner = new Scanner(args);
  const regs: string[] = [];
  let reg = scanner.nextWord();
  while (reg !== Scanner.EOF) {
    regs.push(reg);
    reg = scanner.nextWord();
  }

  return new RegisterCommand({
    registers: regs,
  });
}
