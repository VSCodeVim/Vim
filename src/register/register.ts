export class Register {
    private static validRegisters = [
        '"'
    ];

    private static registers: {[key: string]: string } = {};

    /**
     * Puts content in a register. If none is specified, uses the default
     * register ".
     */
    public static put(content: string, register: string = '"'): void {
        if (Register.validRegisters.indexOf(register) === -1) {
            throw new Error(`Invalid register ${register}`);
        }

        Register.registers[register] = content;
    }

    /**
     * Gets content from a register. If none is specified, uses the default
     * register ".
     */
    public static get(register: string = '"'): string {
        if (Register.validRegisters.indexOf(register) === -1) {
            throw new Error(`Invalid register ${register}`);
        }

        return Register.registers[register];
    }
}