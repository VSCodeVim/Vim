## 스타일 가이드

게다가, VS Code의 코딩 지침에 따라 다음을 준수하십시오:

- 가능할 때마다 `for ... of` 를 이용하십시오.

  **이론적 근거:** `for ... of` 는 대단합니다. 다른 variant보다 더 읽기 쉽습니다.

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

  변수를 capturing 하지 않더라도 나중에 다른 사람이 있을지 누가 알겠습니까?
