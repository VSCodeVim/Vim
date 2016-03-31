interface ITextParser {
    string(match: string): IParser;
    anyChar: IParser;
    character(match: string): IParser;
    oneOf(match: string): IParser;
    digit: IParser;
}

interface IParser {
    always(input): IParser;
    bind(parser: IParser, callback: (result) => IParser): IParser;
    optional(def, parser: IParser): IParser;
    next(p: IParser, q: IParser): IParser;
    many(p: IParser): IParser;
    enumeration(...parsers: IParser[]): IStream;
    enumerationa(parsers: IParser[]): IParser;
    late(callback: () => IParser): IParser;
    choicea(parsers: IParser[]): IParser;
    either(p: IParser, q: IParser): IParser;
    attempt(p: IParser): IParser;

}

interface IParserState {
    done: boolean;
}

interface IIncrementalParser {
    provideString(input: string, state: IParserState): IParserState;
    finish(state: IParserState);
    runInc(p: IParser);
}

declare namespace bennu {
    const text: ITextParser;
    const parse: IParser;
    const incremental: IIncrementalParser;
}

declare module "bennu" {
    export = bennu;
}


interface IStream {
    forEach(callback: (value) => void, inStream: IStream);
    map(x);
}

declare namespace nustream {
    const stream: IStream;
}

declare module "nu-stream" {
    export = nustream;
}