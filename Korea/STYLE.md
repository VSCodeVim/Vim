## 스타일 가이드

게다가, VS Code의 코딩 지침에 따라 다음을 준수하십시오:

- 가능할 때마다 `for ... of` 를 이용하십시오.

  **이론적 근거:** `for ... of` 는 대단합니다. 다른 variant보다 더 읽기 쉽습니다.

- `any`를 가능한 많이 사용하지 마십시오.

  **이론적 근거:** 이 언어는*Untyped*Script가 아니라 *Type*Script라고 합니다. :wink: Static typing은 훌륭합니다. 버그를 포착하고 가독성을 향상 시킵니다. 우리는 최대한 많이 사용하도록 노력해야합니다.

- 가능하면 `const` 를 사용하십시오.

  **이론적 근거:** `const`를 "constant value,"로 읽는대신 "single assignment."으로 읽습니다. 다른 프로그래밍 언어에서는 “constant value”을 의미하지만, JavaScript에서는 약간 다릅니다.

- `const`를 사용할 수 없다면, `let`을 사용하십시오; 절대 `var`은 안됩니다.

  **이론적 근거:** `var`은 많은 경우 프로그래머를 trips합니다 - hoisting and closure capture는 두 가지 큰 요소입니다.
차이점을 고려하십시오.

  ```
  for (var j = 0; j < 5; j++) { setTimeout(() => console.log(j), 5) }
  ```

  그리고

  ```
  for (let j = 0; j < 5; j++) { setTimeout(() => console.log(j), 5) }
  ```

  변수를 capturing 하지 않더라도 나중에 다른 사람이 있을지 누가 알겠습니까?
