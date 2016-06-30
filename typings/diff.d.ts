declare module 'diff' {
    interface ChangeObject {
        value: string;
        added: boolean;
        removed: boolean;
    }

    interface Option {
        ignoreWhitespace: boolean;
        newlineIsToken: boolean;
    }

    function diffChars(oldStr: string, newStr: string, options?: Option): ChangeObject[];
}