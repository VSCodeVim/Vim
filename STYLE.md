# Style Guide

In addition, to VS Code's [coding guidelines](https://github.com/Microsoft/vscode/wiki/Coding-Guidelines), please adhere
to the following:

- Use `for ... of` whenever possible

  **Rationale:** `for ... of` is awesome. It's more readable than any other variant.

- Do not use `any` except when necessary

  **Rationale:** The language is called *Type*Script, not *Untyped*Script. :wink: Static typing is wonderful.
  It catches bugs and improves readability. We should strive to use it as much as possible.

- Use `const` wherever possible.

  **Rationale:** Instead of reading `const` as "constant value," read it as "single assignment."
  Yes, it means "constant value" in other programming languages, but it's a little different in JavaScript.
