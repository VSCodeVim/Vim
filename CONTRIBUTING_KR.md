# 기여 가이드
이 문서는 VSCodeVim에 기여하기위한 지침을 제공합니다. 이 기여 가이드는 규칙이 아니라 지침 일뿐입니다. 최선다해서 판단을하고 자유롭게이 문서의 변경을 제안하십시오. 도움이 필요하면 [슬랙](https://vscodevim.herokuapp.com/)에 들르십시오.

VSCodeVim을 개선하는 데 도움을 주셔서 감사합니다! 👏

## 문제 제출
[GitHub 이슈 트래커](https://github.com/VSCodeVim/Vim/issues)는 버그 및 개선 제안 추적에 선호되는 채널입니다. 
새로운 버그 리포트를 생성 할 때 :

- 다른 사람이 이미 문제를보고했거나 아이디어를 요청했는지 확인하려면 기존 문제를 검색하십시오.
- 이슈 템플릿을 작성하십시오.

# 풀 요청 제출
풀 요청은 훌륭합니다. 공개 된 이슈가없는 것에 대해 PR을 제기하려면 먼저 이슈를 생성하는 것을 고려하십시오.

PR을 제출할 때 PR이 열릴 때 GitHub에서 제공하는 템플릿을 작성하십시오.

## 최초 설정
1. 전제 조건 설치 :

    - 최신 [Visual Studio code](https://code.visualstudio.com/)
    - [Node.js](https://nodejs.org/) v8.0.0 이상
    - 선택 사항 : [Docker Community Edition](https://store.docker.com/search?type=edition&offering=community) 🐋


터미널에서 :
```bash

# 저장소를 포크하고 복제
git clone git@github.com : <YOUR-FORK> /Vim.git
CD Vim

# 종속성을 설치
npm 설치

# VSCode에서 열기
코드.

# VSCode 드롭 다운에서 "Build, Run Extension"을 선택하십시오.
# 디버그 탭에서 확장을 빌드하고 실행합니다.
# 또는 적절한 드롭 다운 옵션을 선택하여 테스트를 실행하십시오.

# 또는 gulp 및 npm 스크립트를 통해 테스트를 빌드하고 실행하십시오.
npx gulp build # 빌드
npm test # test (VSCode의 모든 인스턴스를 닫아야 함)

# Docker가 설치되어 실행중인 경우에만 사용 가능
npx gulp test # Docker 컨테이너 내에서 테스트 실행
npx gulp test --grep testSuite # 컨테이너 내부의 JS 정규식으로 필터링 된 테스트 / 스위트 만 실행
```

## 코드 구조
코드는 두 부분으로 나뉩니다.

- ModeHandler-Vim 상태 머신
- 동작-상태를 수정하는 '동작'

## 행위
액션은 현재 actions.ts에 채워져 있습니다 (죄송합니다). 다음과 같이 제공합니다. :

- `BaseAction`-모든 액션에서 파생 된 기본 액션 유형입니다.
- `BaseMovement`-이동 (예 : `w`, `h`, `{`등)은 커서 위치 만 업데이트하거나 시작 및 중지를 나타내는 `IMovement`를 반환합니다. 이것은 커서 이전에 실제로 시작될 수있는 `aw`와 같은 움직임에 사용됩니다.
- `BaseCommand`-단순한 움직임이 아닌 것은 Command입니다. 여기에는 `*`와 같은 방식으로 Vim의 상태를 업데이트하는 동작이 포함됩니다.
어느 시점에서 나는 action.ts가 완전히 순수하고 (부작용이 전혀 없음) 명령을 원했기 때문에 명령은 편집기에서 부작용을 나타내는 객체를 반환합니다. 이것은 ModeHandler에서 handleCommand의 거대한 스위치를 설명합니다. 나는 이것이 멍청한 생각이라고 생각하며 누군가 그것을 제거해야합니다.

### Vim 상태 머신
두 가지 데이터 구조로 구성됩니다.

- `VimState`-이것은 Vim의 상태입니다. 행동이 업데이트되는 것입니다.
- `RecordedState`-변경이 끝날 때 재설정되는 임시 상태입니다.
#### 작동 원리
1. `handleKeyEventHelper`는 가장 최근의 키 누름으로 호출됩니다.
2. `Actions.getRelevantAction`은 지금까지 누른 모든 키가 action.ts에서 동작을 고유하게 지정하는지 여부를 결정합니다. 그렇지 않은 경우 계속해서 키 누르기를 기다립니다.
3. `runAction`은 일치 된 조치를 실행합니다. 이동, 명령 및 연산자에는 모두 실행 방법을 지정하는 별도의 기능 (`executionMovement`, `handleCommand` 및 `executeOperator`)이 있습니다.
4. 이제 VimState를 업데이트 했으므로 새로운 VimState와 함께 `updateView`를 실행하여 VSCode를 새 상태로 "다시 그리기"합니다.


#### vscode.window.onDidChangeTextEditorSelection

이것은 클릭 이벤트 기반 API가없는 IDE에서 클릭 이벤트를 시뮬레이트하는 나의 핵입니다 (아직?). 방금 들어온 선택 항목을 확인하여 이전에 상태 시스템을 마지막으로 업데이트했을 때 선택 항목을 설정했다고 생각한 것과 같은지 확인합니다. 그렇지 않은 경우 사용자가 클릭했을 수 있습니다. (그러나 아마도 또한  탭을 완성 할 수도있었습니다!)

## 배포
릴리즈를 푸시하려면

```bash
npx gulp release --semver [SEMVER] --gitHubToken [토큰]
git push --follow-tags
위의 Gulp 명령은 다음과 같습니다.
```

1. 제공된 semver를 기반으로 패키지 버전을 범프하십시오. 지원되는 값 : patch, minor, major.
2. [github-changelog-generato](https://github.com/github-changelog-generator/github-changelog-generator)를 사용하여 변경 로그를 작성하십시오.
3. 위의 변경 사항으로 Git 커밋을 만듭니다.
4. 새 패키지 버전을 사용하여 Git 태그를 작성하십시오.

확장을 빌드하고 테스트하는 것 외에도, 커밋에 태그가 적용되면 CI 서버는 GitHub 릴리스를 생성하고 새 버전을 Visual Studio 마켓 플레이스에 게시합니다.

## 문제 해결

### Visual Studio 코드 속도 저하
VSCode를 통해 테스트를 실행하는 대신 속도 저하가 발생하고 과거에 `npm 테스트`를 실행 한 경우 VSCode가 지속적으로 색인을 생성하기 위해 CPU 사이클을 소비하는 `.vscode-test/` 폴더를 찾을 수 있습니다. 간단히 말해 VSCode의 속도를 높일 수 있습니다.

```bash
$ rm -rf .vscode-test /
```

## 스타일 가이드
[스타일 가이드 라인](https://github.com/VSCodeVim/Vim/blob/master/STYLE.md)을 준수하기 위해 최선을 다하십시오.