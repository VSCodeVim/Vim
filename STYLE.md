## Style Guide

In addition, to VS Code's [coding guidelines](https://github.com/Microsoft/vscode/wiki/Coding-Guidelines), please adhere to the following:

- Use `for ... of` whenever possible

  **Rationale:** `for ... of` is awesome. It's more readable than any other variant.

- Don't use `any` as much as possible

  **Rationale:** The language is called *Type*Script, not *Untyped*Script. :wink: Static typing is wonderful. It catches bugs and improves readability. We should strive to use it as much as possible.

- Use `const` wherever possible.

  **Rationale:** Instead of reading `const` as "constant value," read it as "single assignment." Yes, it means "constant value" in other programming languages, but it's a little different in JavaScript.

- When we can't use `const`, use `let`; never `var`

  **Rationale:** `var` trips up programmers in a number of cases - hoisting and closure capture are two big ones. Consider the difference between

  ```
  for (var j = 0; j < 5; j++) { setTimeout(() => console.log(j), 5) }
  ```

  and

  ```
  for (let j = 0; j < 5; j++) { setTimeout(() => console.log(j), 5) }
  ```

  Even if you're not capturing the variable, who knows if someone else might later?
