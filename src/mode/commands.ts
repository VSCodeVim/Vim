
// An enum of all bindable actions in Vim
// TODO: Split off commands into normal, insert, and visual catagories
export enum Command {
    // Enter insert mode
    InsertAtCursor = 1,
    InsertAtLineBegin,
    InsertAfterCursor,
    InsertAtLineEnd,
    InsertNewLineBelow,
    InsertNewLineAbove,

    // Movement
    MoveUp,
    MoveDown,
    MoveLeft,
    MoveRight,

    MoveLineBegin,
    MoveLineEnd,
    MoveWordBegin,
    MoveWordEnd,
    MoveFullWordBegin,
    MoveFullWordEnd,
    MoveLastWord,
    MoveLastFullWord,
    MoveLastWordEnd,
    MoveLastFullWordEnd,

    // MoveHalfPageUp,
    // MoveHalfPageDown,
    MoveFullPageUp,
    MoveFullPageDown,
    // MoveFirstLine,
    // MoveLastLine,

    MoveParagraphBegin,
    MoveParagraphEnd,

    MoveNonBlank,
    MoveNonBlankFirst,
    MoveNonBlankLast,
    MoveMatchingBracket,

    // Find
    Find,

    // Folding
    Fold,
    Unfold,
    FoldAll,
    UnfoldAll,

    // Text Modification
    Undo,
    Redo,
    Copy,
    Paste,

    ChangeWord,
    ChangeFullWord,
    ChangeCurrentWord,
    ChangeCurrentWordToNext,
    ChangeToLineEnd,

    DeleteLine,
    DeleteToNextWord,
    DeleteToFullNextWord,
    DeleteToWordEnd,
    DeleteToFullWordEnd,
    DeleteToWordBegin,
    DeleteToFullWordBegin,
    DeleteToLineEnd,

    DeleteChar,
    DeleteLastChar,

    Indent,
    Outdent,

    // Misc
    EnterVisualMode,
    EnterCommand,
    ExitMessages,
}

export function newDefaultNormalKeymap() : {[key: string]: Command} {
    return {
        "h": Command.MoveLeft,
        "j": Command.MoveDown,
        "k": Command.MoveUp,
        "l": Command.MoveRight,
        "0": Command.MoveLineBegin,
        "$": Command.MoveLineEnd,

        "^": Command.MoveNonBlank,
        "gg": Command.MoveNonBlankFirst,
        "G": Command.MoveNonBlankLast,

        "w": Command.MoveWordBegin,
        "W": Command.MoveFullWordBegin,
        "e": Command.MoveWordEnd,
        "E": Command.MoveLastFullWordEnd,
        "ge": Command.MoveLastWordEnd,
        "gE": Command.MoveLastFullWordEnd,
        "b": Command.MoveLastWord,
        "B": Command.MoveLastFullWord,

        "{": Command.MoveParagraphBegin,
        "}": Command.MoveParagraphEnd,
        "%": Command.MoveMatchingBracket,

        ">>": Command.Indent,
        "<<": Command.Outdent,

        "u": Command.Undo,
        "ctrl+r": Command.Redo,
        "y": Command.Copy,
        "p": Command.Paste,

        "cw": Command.ChangeWord,
        "cW": Command.ChangeFullWord,
        "ciw": Command.ChangeCurrentWord,
        "caw": Command.ChangeCurrentWordToNext,
        "C": Command.ChangeToLineEnd,

        "dd": Command.DeleteLine,
        "dw": Command.DeleteToNextWord,
        "dW": Command.DeleteToFullNextWord,
        "db": Command.DeleteToWordBegin,
        "dB": Command.DeleteToFullWordBegin,
        "de": Command.DeleteToWordEnd,
        "dE": Command.DeleteToFullWordEnd,
        "D" : Command.DeleteToLineEnd,

        "x": Command.DeleteChar,
        "X": Command.DeleteLastChar,

        "/": Command.Find,

        "zc": Command.Fold,
        "zo": Command.Unfold,
        "zC": Command.FoldAll,
        "zO": Command.UnfoldAll,

        ":": Command.EnterCommand,
        "v": Command.EnterVisualMode,
        "esc": Command.ExitMessages
    };
}

export function newDefaultInsertKeymap() : {[key: string]: Command} {
        return {
            "i": Command.InsertAtCursor,
            "I": Command.InsertAtLineBegin,
            "a": Command.InsertAfterCursor,
            "A": Command.InsertAtLineEnd,
            "o": Command.InsertNewLineBelow,
            "O": Command.InsertNewLineAbove,
        };
}

export function newDefaultVisualKeymap() : {[key: string]: Command} {
    return {
        "v": Command.EnterVisualMode
    };
}