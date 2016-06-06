import { ModeName } from './../mode/mode';
import { VimState } from './../mode/modeHandler';


/**
 * There are two different modes of copy/paste in Vim - copy by character
 * and copy by line. Copy by line typically happens in Visual Line mode, but
 * also shows up in some other actions that work over lines (most noteably dd,
 * yy, and cc).
 */
export enum RegisterMode {
    FigureItOutFromCurrentMode,
    CharacterWise,
    LineWise,
};

export interface IRegisterContent {
    text        : string;
    registerMode: RegisterMode;
}

export class Register {
    private static validRegisters = [
        '"'
    ];

    private static registers: { [key: string]: IRegisterContent } = {};

    /**
     * Puts content in a register. If none is specified, uses the default
     * register ".
     */
    public static put(content: string, vimState: VimState): void {
        const register = vimState.registerName;

        if (Register.validRegisters.indexOf(register) === -1) {
            throw new Error(`Invalid register ${register}`);
        }

        let registerMode: RegisterMode;

        if (vimState.currentRegisterMode === RegisterMode.FigureItOutFromCurrentMode) {
            if (vimState.currentMode === ModeName.VisualLine) {
                registerMode = RegisterMode.LineWise;
            } else {
                registerMode = RegisterMode.CharacterWise;
            }
        } else {
            registerMode = vimState.currentRegisterMode;
        }

        Register.registers[register] = {
            text        : content,
            registerMode: registerMode,
        };
    }

    /**
     * Gets content from a register. If none is specified, uses the default
     * register ".
     */
    public static get(vimState: VimState): IRegisterContent {
        const register = vimState.registerName;

        if (Register.validRegisters.indexOf(register) === -1) {
            throw new Error(`Invalid register ${register}`);
        }

        return Register.registers[register];
    }
}