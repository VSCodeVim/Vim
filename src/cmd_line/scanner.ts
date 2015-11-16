
// Provides state and behavior to scan an input string character by character.
export class Scanner {
    static EOF : string = "__EOF__";
    start : number = 0;
    pos : number = 0;
    input : string;

    constructor(input : string) {
        this.input = input;
    }

    // Returns the next character in the input, or EOF.
    next() : string {
        if (this.isAtEof) {
            this.pos = this.input.length;
            return Scanner.EOF;
        }
        let c = this.input[this.pos];
        this.pos++;
        return c;
    }

    // Returns whether we've reached EOF.
    get isAtEof() : boolean {
        return this.pos >= this.input.length;
    }

    // Ignores the span of text between the current start and the current position.
    ignore() : void {
        this.start = this.pos;
    }

    // Returns the span of text between the current start and the current position.
    emit() : string {
        let s = this.input.substring(this.start, this.pos);
        this.ignore();
        return s;
    }

    backup(): void {
        this.pos--;
    }

    // skips over c and ignores the text span
    skip(c : string) : void {
        var s = this.next();
        while (!this.isAtEof) {
            if (s !== c) {
                break;
            }
            s = this.next();
        }
        this.backup();
        this.ignore();
    }

    // skips text while any of chars matches and ignores the text span
    skipRun(...chars : string[]) : void {
        while(!this.isAtEof) {
            var c = this.next();
            if (chars.indexOf(c) == -1) {
                break;
            }
        }
        this.backup();
        this.ignore();
    }

    // skips over whitespace (tab, space) and ignores the text span
    skipWhiteSpace(): void {
        while (true) {
            var c = this.next();
            if (c == " " || c == "\t") {
                continue;
            }
            break;
        }
        this.backup();
        this.ignore();
    }
}
