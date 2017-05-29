# [v0.8.4 Deleted Durian](https://github.com/VSCodeVim/Vim/releases/tag/v0.8.4)  (May 29, 2017)
* Fixed commands like <code>d2d</code> not working
* Fixed gq bug with deleting spaces
* Fixed bug with backspace deleting more than one tab stop
* Includes attempt at fixing Chinese input bug
* Fixes named registers being overwritten if you paste over something in visual mode.
# [v0.8.3 Earnest Emmet](https://github.com/VSCodeVim/Vim/releases/tag/v0.8.3)  (May 26, 2017)
* Fixes Emmet integration being broken
* Fixes <code>}</code> not handling visual ranges correctly
* Fixes line move not working correctly without neovim support.
# [v0.8.2 Keylime Kombucha](https://github.com/VSCodeVim/Vim/releases/tag/v0.8.2)  (May 26, 2017)
* Added several patches for functionality broken by new release.
* Stopped VSCodeVim from completely crashing when it can't connect to Neovim.
* Added gq functionality for JSDoc comments <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="231444998" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1750" href="https://github.com/VSCodeVim/Vim/issues/1750">#1750</a>
# [v0.8.1 Tabbed Turtle](https://github.com/VSCodeVim/Vim/releases/tag/v0.8.1)  (May 26, 2017)

Fixed autocomplete issues with previous release.
# [v0.8.0 Neovim Nutty](https://github.com/VSCodeVim/Vim/releases/tag/v0.8.0)  (May 25, 2017)

Lots of work has gone into this release, and lots of cool features to talk about this time.
## Neovim Integration (for Ex commands)

One of the most highly <g-emoji alias="+1" fallback-src="https://assets-cdn.github.com/images/icons/emoji/unicode/1f44d.png" ios-version="6.0">👍</g-emoji>'ed issues in VsCodeVim's history is now officially underway. The first thing we've done is enable you to offload all Ex-commands to neovim.

Enable this by setting <code>vim.enableNeovim</code> to true, and setting <code>vim.neovimPath</code>. This feature is still somewhat experimental, so report any issues you find!

Fixes <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="175862365" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/737" href="https://github.com/VSCodeVim/Vim/issues/737">#737</a>, <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="180815000" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/828" href="https://github.com/VSCodeVim/Vim/issues/828">#828</a>, <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="185409828" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/991" href="https://github.com/VSCodeVim/Vim/issues/991">#991</a>, <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="187191451" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1032" href="https://github.com/VSCodeVim/Vim/issues/1032">#1032</a>, <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="202401866" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1237" href="https://github.com/VSCodeVim/Vim/issues/1237">#1237</a>, <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="215015238" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1401" href="https://github.com/VSCodeVim/Vim/issues/1401">#1401</a>, <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="215304269" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1412" href="https://github.com/VSCodeVim/Vim/issues/1412">#1412</a>, <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="221999680" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1517" href="https://github.com/VSCodeVim/Vim/issues/1517">#1517</a>, <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="222320973" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1524" href="https://github.com/VSCodeVim/Vim/issues/1524">#1524</a>, <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="222461133" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1525" href="https://github.com/VSCodeVim/Vim/issues/1525">#1525</a>, <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="224822063" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1589" href="https://github.com/VSCodeVim/Vim/issues/1589">#1589</a>, <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="225295330" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1611" href="https://github.com/VSCodeVim/Vim/issues/1611">#1611</a>, <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="228565183" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1698" href="https://github.com/VSCodeVim/Vim/issues/1698">#1698</a>, <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="229913432" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1723" href="https://github.com/VSCodeVim/Vim/issues/1723">#1723</a>, and <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="230213090" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1732" href="https://github.com/VSCodeVim/Vim/issues/1732">#1732</a>.

<a class="user-mention" href="https://github.com/chillee">@Chillee</a>
## Foldfix

The most highly <g-emoji alias="+1" fallback-src="https://assets-cdn.github.com/images/icons/emoji/unicode/1f44d.png" ios-version="6.0">👍</g-emoji>'ed issue in VsCodeVim history now has a (hopefully temporary) fix. Enable <code>vim.foldfix</code>, and move over folds freely!

Fixes <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="185771093" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1004" href="https://github.com/VSCodeVim/Vim/issues/1004">#1004</a>, kinda.
## Other features
* Selecting range before Ex-commands no longer highlights the initial text <a class="user-mention" href="https://github.com/chillee">@Chillee</a> <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="178287912" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/792" href="https://github.com/VSCodeVim/Vim/issues/792">#792</a>
* Adds <code>&lt;del&gt;</code> functionality <a class="user-mention" href="https://github.com/chillee">@Chillee</a> <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="203850404" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1256" href="https://github.com/VSCodeVim/Vim/issues/1256">#1256</a> <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="163790338" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/394" href="https://github.com/VSCodeVim/Vim/issues/394">#394</a>
* Adds support for complex tags in surround <a class="user-mention" href="https://github.com/admosity">@admosity</a>
* Adds <code>[range]o/O</code> <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="222819989" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1531" href="https://github.com/VSCodeVim/Vim/issues/1531">#1531</a>
* Adds support for gf with line numbers <a class="user-mention" href="https://github.com/chillee">@Chillee</a> <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="226565103" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1655" href="https://github.com/VSCodeVim/Vim/issues/1655">#1655</a>
* Adds support for search in the visual modes <a class="user-mention" href="https://github.com/chillee">@Chillee</a> <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="222600744" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1529" href="https://github.com/VSCodeVim/Vim/pull/1529">#1529</a>
* Adds support for pasting with multiple cursors <a class="user-mention" href="https://github.com/chillee">@Chillee</a> <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="229781606" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1715" href="https://github.com/VSCodeVim/Vim/issues/1715">#1715</a>
* Made <code>&lt;esc&gt;</code> close find all references pop up even if it's empty <a class="user-mention" href="https://github.com/chillee">@Chillee</a> <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="217277678" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1436" href="https://github.com/VSCodeVim/Vim/issues/1436">#1436</a>
* Refactored repeating operators (like <code>dd</code> or <code>yy</code>), adding support for <code>gqq</code>, <code>yss</code> (surround), and fixed <code>gcc</code> <a class="user-mention" href="https://github.com/chillee">@Chillee</a> <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="222958680" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1534" href="https://github.com/VSCodeVim/Vim/issues/1534">#1534</a> <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="222010316" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1518" href="https://github.com/VSCodeVim/Vim/issues/1518">#1518</a> <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="229793884" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1716" href="https://github.com/VSCodeVim/Vim/issues/1716">#1716</a> <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="225372763" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1618" href="https://github.com/VSCodeVim/Vim/issues/1618">#1618</a> <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="218248771" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1450" href="https://github.com/VSCodeVim/Vim/issues/1450">#1450</a><br/>
One thing to note: This fix actually introduces a breaking change. <code>gb</code> is now <code>Add next occurence</code>, and <code>gc</code> is now the comment operator. If you want to switch them back, paste

into your settings.json. The reason we decided to make this change was that <code>gbb</code> was a fundamentally unsound action. There's 2 ways it can always be interpreted, as <code>gbb</code> the repeated comment operator, or as <code>gb b</code>, the comment operator applied over the movement <code>b</code>.
* Made the README even better!!! <a class="user-mention" href="https://github.com/cobbweb">@cobbweb</a>
* Added an automatic changelog generating script. Check it out <a href="https://github.com/VSCodeVim/Vim/blob/master/scripts/CHANGELOG.md">here!</a> <a class="user-mention" href="https://github.com/chillee">@Chillee</a>
## Bug Fixes
* Fixes visual block mode respect keybindings <a class="user-mention" href="https://github.com/chillee">@Chillee</a> <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="229392844" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1709" href="https://github.com/VSCodeVim/Vim/pull/1709">#1709</a>
* Fixes gq spacing issues once and for all (hopefully) <a class="user-mention" href="https://github.com/chillee">@Chillee</a> <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="227776317" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1684" href="https://github.com/VSCodeVim/Vim/issues/1684">#1684</a>
* Fixes <code>&lt;c-a/z&gt;</code> not working properly on words with more than 1 number <a class="user-mention" href="https://github.com/chillee">@Chillee</a> <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="212972154" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1376" href="https://github.com/VSCodeVim/Vim/issues/1376">#1376</a>
* Fixes <code>X</code>, <code>C</code>, <code>R</code>, and <code>p</code> in visual mode <a class="user-mention" href="https://github.com/xlaech">@xlaech</a> <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="207917383" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1304" href="https://github.com/VSCodeVim/Vim/issues/1304">#1304</a> <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="207918108" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1305" href="https://github.com/VSCodeVim/Vim/issues/1305">#1305</a> <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="207921173" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1307" href="https://github.com/VSCodeVim/Vim/issues/1307">#1307</a> <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="207923515" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1308" href="https://github.com/VSCodeVim/Vim/issues/1308">#1308</a>
* Fixes self closing tags not being properly handled <a class="user-mention" href="https://github.com/chillee">@Chillee</a> <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="226929786" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1668" href="https://github.com/VSCodeVim/Vim/issues/1668">#1668</a>
* Fixes issues relating to whitespace not being performed correctly in macros/visual block while refactoring visual block mode. <a class="user-mention" href="https://github.com/chillee">@Chillee</a> <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="214945690" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1400" href="https://github.com/VSCodeVim/Vim/issues/1400">#1400</a> <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="171214240" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/612" href="https://github.com/VSCodeVim/Vim/issues/612">#612</a> <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="218754587" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1458" href="https://github.com/VSCodeVim/Vim/issues/1458">#1458</a> <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="225886083" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1634" href="https://github.com/VSCodeVim/Vim/issues/1634">#1634</a> <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="177321187" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/776" href="https://github.com/VSCodeVim/Vim/issues/776">#776</a>
* Fixes <code>d}</code> and <code>y}</code> issues with how much it deleted <a class="user-mention" href="https://github.com/chillee">@Chillee</a> <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="197757927" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1196" href="https://github.com/VSCodeVim/Vim/issues/1196">#1196</a> <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="197759830" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1197" href="https://github.com/VSCodeVim/Vim/issues/1197">#1197</a>
* Removed UTF-8 clipboard hack for system clipboard <a class="user-mention" href="https://github.com/xconverge">@xconverge</a>
* Fixes off by one cursor issue when dot repeating with characters that auto close <a class="user-mention" href="https://github.com/chillee">@Chillee</a> <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="227108363" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1674" href="https://github.com/VSCodeVim/Vim/issues/1674">#1674</a>
* Fixes <code>&lt;D-d&gt;/gb</code> not adding cursors properly when the word to be matched is a substring <a class="user-mention" href="https://github.com/chillee">@Chillee</a> <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="231250631" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1749" href="https://github.com/VSCodeVim/Vim/issues/1749">#1749</a>
# [v0.7.1 Quizzing Quotient](https://github.com/VSCodeVim/Vim/releases/tag/v0.7.1)  (May 10, 2017)
* <a class="user-mention" href="https://github.com/mspaulding06">@mspaulding06</a>: Add :close support based on :quit
* <a class="user-mention" href="https://github.com/chillee">@Chillee</a>: Added <code>&lt;C-w&gt; j</code> and <code>&lt;C-w&gt; k</code>
* <a class="user-mention" href="https://github.com/rebornix">@rebornix</a> Fixes <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="226610555" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1657" href="https://github.com/VSCodeVim/Vim/issues/1657">#1657</a>
* <a class="user-mention" href="https://github.com/chillee">@Chillee</a> Fixes <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="205896923" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1280" href="https://github.com/VSCodeVim/Vim/issues/1280">#1280</a>
* <a class="user-mention" href="https://github.com/chillee">@Chillee</a> Fixes  keybindings
* <a class="user-mention" href="https://github.com/vinicio">@vinicio</a> Changes tabs to navigate inside the same split
* <a class="user-mention" href="https://github.com/chillee">@Chillee</a> Fixes <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="222962716" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1535" href="https://github.com/VSCodeVim/Vim/issues/1535">#1535</a>, <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="219287670" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1467" href="https://github.com/VSCodeVim/Vim/issues/1467">#1467</a>, <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="208663798" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1311" href="https://github.com/VSCodeVim/Vim/issues/1311">#1311</a>: D-d doesn't work in insert mode
# [v0.7.0 Procrastinating Potato](https://github.com/VSCodeVim/Vim/releases/tag/v0.7.0)  (May 5, 2017)

A major release! Wow! Lots of new features and bug fixes this iteration.

Huge props especially to <a class="user-mention" href="https://github.com/chillee">@Chillee</a> this time, who fixed a huge number of outstanding issues and bugs. He also wrote these entire release notes - except this line praising him, because that would have been awkward (that was me, <a class="user-mention" href="https://github.com/johnfn">@johnfn</a>).
## New Features:
* Tag matching across multiple lines. Thanks <a class="user-mention" href="https://github.com/jrenton">@jrenton</a> for implementing it and <a class="user-mention" href="https://github.com/chillee">@Chillee</a> for fixing the remaining bugs. <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="184674529" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/971" href="https://github.com/VSCodeVim/Vim/issues/971">#971</a> <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="193353918" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1108" href="https://github.com/VSCodeVim/Vim/issues/1108">#1108</a> <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="201772243" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1232" href="https://github.com/VSCodeVim/Vim/issues/1232">#1232</a> <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="207684650" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1300" href="https://github.com/VSCodeVim/Vim/issues/1300">#1300</a>
* Toggle Vim on and off.
* <a href="https://github.com/bronson/vim-visual-star-search">VisualStar</a> plugin implemented. Thanks <a class="user-mention" href="https://github.com/mikew">@mikew</a>!
* <a href="https://github.com/michaeljsmith/vim-indent-object">Indent-Object</a> plugins implemented. Thanks <a class="user-mention" href="https://github.com/mikew">@mikew</a>!
* Added support for multiline searching.  <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="224207479" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1575" href="https://github.com/VSCodeVim/Vim/issues/1575">#1575</a> Thanks <a class="user-mention" href="https://github.com/chillee">@Chillee</a>!
* Navigate between different VSCode panes with ctrl+w h/j/k/l. <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="212964705" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1375" href="https://github.com/VSCodeVim/Vim/issues/1375">#1375</a> Thanks <a class="user-mention" href="https://github.com/lyup">@lyup</a>!
* z- and z keybindings added. <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="226062439" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1637" href="https://github.com/VSCodeVim/Vim/issues/1637">#1637</a> <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="226062866" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1638" href="https://github.com/VSCodeVim/Vim/issues/1638">#1638</a> Thanks <a class="user-mention" href="https://github.com/chillee">@Chillee</a>!
* Added new remapping options to remap any key. <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="223231025" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1543" href="https://github.com/VSCodeVim/Vim/issues/1543">#1543</a> As an example, this functionality can cover <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="221470964" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1505" href="https://github.com/VSCodeVim/Vim/issues/1505">#1505</a> and <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="218334608" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1452" href="https://github.com/VSCodeVim/Vim/issues/1452">#1452</a>.
## Bugfixes/enhancements
* Fixed history being dropped when switching tabs. <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="221456093" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1503" href="https://github.com/VSCodeVim/Vim/issues/1503">#1503</a> Thanks <a class="user-mention" href="https://github.com/chillee">@Chillee</a>!
* Fixed lots of wonky gj/gk visual behavior. <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="182359278" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/890" href="https://github.com/VSCodeVim/Vim/issues/890">#890</a> <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="213368644" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1377" href="https://github.com/VSCodeVim/Vim/issues/1377">#1377</a> Thanks <a class="user-mention" href="https://github.com/chillee">@Chillee</a>!
* Fixed Ctrl-c dropping a character when selecting from right to left in insert mode. <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="217469633" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1441" href="https://github.com/VSCodeVim/Vim/issues/1441">#1441</a> <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="211657261" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1355" href="https://github.com/VSCodeVim/Vim/issues/1355">#1355</a> Thanks <a class="user-mention" href="https://github.com/chillee">@Chillee</a>!
* Fixed Ctrl-w in insert mode deleting through whitespace at the beginning of the line. <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="194141316" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1137" href="https://github.com/VSCodeVim/Vim/issues/1137">#1137</a> Thanks <a class="user-mention" href="https://github.com/chillee">@Chillee</a>!
* Fixed Ctrl-a breaking in certain circumstances. <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="224721925" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1588" href="https://github.com/VSCodeVim/Vim/issues/1588">#1588</a> Thanks <a class="user-mention" href="https://github.com/chillee">@Chillee</a>!
* Fixed gd not setting the desired column properly. <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="222836014" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1532" href="https://github.com/VSCodeVim/Vim/issues/1532">#1532</a> Thanks <a class="user-mention" href="https://github.com/chillee">@Chillee</a>!
* Fixed gq adding an extra space to beginning of selection. <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="203602695" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1251" href="https://github.com/VSCodeVim/Vim/issues/1251">#1251</a> Thanks <a class="user-mention" href="https://github.com/chillee">@Chillee</a>!
* Fixed dot command not working in macros. <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="224961832" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1595" href="https://github.com/VSCodeVim/Vim/pull/1595">#1595</a> Thanks <a class="user-mention" href="https://github.com/chillee">@Chillee</a>!
* Fixed Ctrl-c dropping top and bottom lines when selecting in visual line from the bottom up. <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="224958235" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1594" href="https://github.com/VSCodeVim/Vim/issues/1594">#1594</a> Thanks <a class="user-mention" href="https://github.com/chillee">@Chillee</a>!
* Updated workbench theming for new release of VSCode. Thanks <a class="user-mention" href="https://github.com/zelphir">@zelphir</a>!
* Enabled Easymotion to work for larger files. <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="225699826" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1627" href="https://github.com/VSCodeVim/Vim/issues/1627">#1627</a>
* Made <code>statusBarColors</code> modify user <code>settings.json</code> instead of workspace. <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="223975304" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1565" href="https://github.com/VSCodeVim/Vim/issues/1565">#1565</a>
* Enabled ranges for :sort. <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="224943340" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1592" href="https://github.com/VSCodeVim/Vim/issues/1592">#1592</a>
* Made the command line persistent when switching windows. Thanks <a class="user-mention" href="https://github.com/chillee">@Chillee</a>!

...and we finally split up actions.ts into separate files! Get at us, contributors! <g-emoji alias="heart" fallback-src="https://assets-cdn.github.com/images/icons/emoji/unicode/2764.png" ios-version="6.0">❤️</g-emoji>
# [v0.6.20 Careful Carrot](https://github.com/VSCodeVim/Vim/releases/tag/v0.6.20)  (Apr 26, 2017)
* Fix issue with gq reflow cursor position from previous release
# [v0.6.19 Blushing Beet](https://github.com/VSCodeVim/Vim/releases/tag/v0.6.19)  (Apr 26, 2017)
* Fixes insert mode backspace at first character causing no op <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="224065305" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1573" href="https://github.com/VSCodeVim/Vim/issues/1573">#1573</a> Thanks <a class="user-mention" href="https://github.com/chillee">@Chillee</a>
* Fixes gq incorrectly handles triple-slash doc-comments <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="218248499" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1449" href="https://github.com/VSCodeVim/Vim/issues/1449">#1449</a> Thanks <a class="user-mention" href="https://github.com/azngeoffdog">@azngeoffdog</a>!
* Surround doing weird things <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="224030517" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1570" href="https://github.com/VSCodeVim/Vim/issues/1570">#1570</a> <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="223862659" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1562" href="https://github.com/VSCodeVim/Vim/issues/1562">#1562</a> <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="223862659" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1562" href="https://github.com/VSCodeVim/Vim/issues/1562">#1562</a>
* Fixes Va{ not working <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="202096140" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1235" href="https://github.com/VSCodeVim/Vim/issues/1235">#1235</a>
* Reformatting long lines with "gq" now resets horizontal scroll <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="203649923" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1252" href="https://github.com/VSCodeVim/Vim/issues/1252">#1252</a>
* :x (write and close), :xa, :wqa implemented <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="220416757" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1486" href="https://github.com/VSCodeVim/Vim/issues/1486">#1486</a>
* Added support for _ register (blackhole) <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="211839473" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1357" href="https://github.com/VSCodeVim/Vim/issues/1357">#1357</a>
# [v0.6.18 Chillen Chives](https://github.com/VSCodeVim/Vim/releases/tag/v0.6.18)  (Apr 24, 2017)
* Fixes to "reg" command <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="223003597" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1539" href="https://github.com/VSCodeVim/Vim/issues/1539">#1539</a> Thanks <a class="user-mention" href="https://github.com/chillee">@Chillee</a>
* Fixes to <code>aw</code> and <code>aW</code> motions <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="211480213" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1350" href="https://github.com/VSCodeVim/Vim/issues/1350">#1350</a> <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="197471209" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1193" href="https://github.com/VSCodeVim/Vim/issues/1193">#1193</a> <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="223650498" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1553" href="https://github.com/VSCodeVim/Vim/issues/1553">#1553</a> <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="223666315" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1554" href="https://github.com/VSCodeVim/Vim/issues/1554">#1554</a> Thanks <a class="user-mention" href="https://github.com/chillee">@Chillee</a>
* Fixes to ctrl+c <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="222879228" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1533" href="https://github.com/VSCodeVim/Vim/issues/1533">#1533</a> Thanks <a class="user-mention" href="https://github.com/chillee">@Chillee</a>
* <a class="user-mention" href="https://github.com/cobbweb">@cobbweb</a> Refactored the entire README! Thanks!
* Updated clipboard library for UTF-8 windows fixes. <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="206172223" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1284" href="https://github.com/VSCodeVim/Vim/issues/1284">#1284</a>, <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="207550289" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1299" href="https://github.com/VSCodeVim/Vim/issues/1299">#1299</a>, <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="193724617" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1125" href="https://github.com/VSCodeVim/Vim/issues/1125">#1125</a>
# [v0.6.17 Color Consortium](https://github.com/VSCodeVim/Vim/releases/tag/v0.6.17)  (Apr 20, 2017)
* Fix repeated insert <code>5i=</code> impacting <code>5s</code> <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="222258306" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1519" href="https://github.com/VSCodeVim/Vim/issues/1519">#1519</a>
* Change <a href="https://github.com/VSCodeVim/Vim/blob/master/README.md#statusbarcolorcontrol">status bar color based on mode</a> similar to lightline plugin <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="188922632" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1056" href="https://github.com/VSCodeVim/Vim/issues/1056">#1056</a>
* Fix UTF-8 character copy/paste for macOS and Linux <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="213577613" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1392" href="https://github.com/VSCodeVim/Vim/issues/1392">#1392</a>
* Make surround repeatable with dot <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="202866037" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1244" href="https://github.com/VSCodeVim/Vim/issues/1244">#1244</a>
# [v0.6.16 Rugged Raspberries](https://github.com/VSCodeVim/Vim/releases/tag/v0.6.16)  (Apr 16, 2017)
* <a href="https://github.com/VSCodeVim/Vim#how-to-use-commentary">Commentary plugin functionality</a> (Thanks <a class="user-mention" href="https://github.com/fiedler">@fiedler</a>)
* Customize <a href="https://github.com/VSCodeVim/Vim#how-to-use-easymotion">easymotion</a> decorations (Thanks <a class="user-mention" href="https://github.com/edasaki">@edasaki</a>)
* Repeat insert char eg. 5i= <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="193640833" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1122" href="https://github.com/VSCodeVim/Vim/issues/1122">#1122</a>
* Easymotion j/k motions fixed <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="218202603" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1448" href="https://github.com/VSCodeVim/Vim/issues/1448">#1448</a>
* Allow user to remap : commands like :nohl <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="195942892" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1166" href="https://github.com/VSCodeVim/Vim/issues/1166">#1166</a>
* Fix case sensitivity in remapping arrow keys <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="221709335" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1507" href="https://github.com/VSCodeVim/Vim/issues/1507">#1507</a>
* Added <code>z.</code> <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="219791649" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1475" href="https://github.com/VSCodeVim/Vim/issues/1475">#1475</a>
* Fixes double clicking word with mouse not displaying correct selection
# [0.6.15 0.6.15 Multi Madness](https://github.com/VSCodeVim/Vim/releases/tag/0.6.15)  (May 24, 2017)

Fix for gc and Cmd-D multicursor not working correctly
# [0.6.14 Bingo Blocky](https://github.com/VSCodeVim/Vim/releases/tag/0.6.14)  (Apr 8, 2017)
* Fix for visual block mode
* Fix type suggestion for handleKeys object <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="219235769" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1465" href="https://github.com/VSCodeVim/Vim/pull/1465">#1465</a> (thanks <a class="user-mention" href="https://github.com/abhiranjankumar00">@abhiranjankumar00</a>)
# [v0.6.13 Fixy Fish](https://github.com/VSCodeVim/Vim/releases/tag/v0.6.13)  (Apr 4, 2017)

The previous release had a bug with <code>.</code>.
# [0.6.12 Rabid Rhinoceros](https://github.com/VSCodeVim/Vim/releases/tag/0.6.12)  (Apr 4, 2017)
* Multicursor improvements, alt click to add cursor, etc
* "vim.easymotionChangeBackgroundColor": true uses searchHighlightColor for easymotion decorations
* guu and GUU added
* Allow users to specify their own cursor style ("editor.cursorStyle") so that underline, line-thin, etc can be used
* Added setting to delegate ctrl keys back to vscode natively<br/>
<a href="https://github.com/VSCodeVim/Vim#handlekeys">https://github.com/VSCodeVim/Vim#handlekeys</a>
* <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="217026370" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1432" href="https://github.com/VSCodeVim/Vim/issues/1432">#1432</a>, <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="208665986" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1312" href="https://github.com/VSCodeVim/Vim/issues/1312">#1312</a>, <code>&lt;space&gt;</code> as leader, multiple other bugs fixed
# [v0.6.11 Fixy Frankfurter](https://github.com/VSCodeVim/Vim/releases/tag/v0.6.11)  (Mar 19, 2017)

Fixes a number of issues with remappings: <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="215140612" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1405" href="https://github.com/VSCodeVim/Vim/issues/1405">#1405</a> <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="215229819" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1410" href="https://github.com/VSCodeVim/Vim/issues/1410">#1410</a> <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="213917068" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1397" href="https://github.com/VSCodeVim/Vim/issues/1397">#1397</a>

Makes remappings work with counts.
# [v0.6.10 Jumpy Jalapeño](https://github.com/VSCodeVim/Vim/releases/tag/v0.6.10)  (Mar 18, 2017)

Add Ctrl-o and Ctrl-i to go forward and back between the places you've changed.
# [v0.6.9 Linear Lime](https://github.com/VSCodeVim/Vim/releases/tag/v0.6.9)  (Mar 18, 2017)

Extends the previous <code>af</code> command to work in Visual Line mode.

Reminder what <code>af</code> is:

Press af in Visual Mode to select ever-increasing blocks of text.

e.g. if you had "blah (foo [bar 'ba|z'])" then it would select 'baz' first. If you pressed az again, it'd then select [bar 'baz'], and if you did it a third time it would select "(foo [bar 'baz'])".
# [v0.6.8 Blocky Banana](https://github.com/VSCodeVim/Vim/releases/tag/v0.6.8)  (Mar 18, 2017)

Adds a custom keymapping that I (<a class="user-mention" href="https://github.com/johnfn">@johnfn</a>) have always wanted. Press <code>af</code> in Visual Mode to select ever-increasing blocks of text.

e.g. if you had "blah (foo [bar 'ba|z'])" then it would select 'baz' first. If you pressed az again, it'd then select [bar 'baz'], and if you did it a third time it would select "(foo [bar 'baz'])".
# [v0.6.7 Fixy Frosted Flakes](https://github.com/VSCodeVim/Vim/releases/tag/v0.6.7)  (Mar 18, 2017)

Fixes a bug with the previous bug fix.

This bugfix I removed was actually a bug fix to fix a bug in VSCode. That bug had been removed in VSCode Insiders, hence why I didn't notice it while testing! I've now reverted to using VSCode all the time. :)
# [v0.6.6 Peeky Pumpkin](https://github.com/VSCodeVim/Vim/releases/tag/v0.6.6)  (Mar 17, 2017)

Fixes a bug with the peek definition functionality of vscode (which, by the way, is monumentally useful and everyone should use it).
# [v0.6.5 Fixy Flank Steak](https://github.com/VSCodeVim/Vim/releases/tag/v0.6.5)  (Mar 12, 2017)

The last release had a little bug. This fixes that bug.
# [v0.6.4 Macroeconomic Mushrooms](https://github.com/VSCodeVim/Vim/releases/tag/v0.6.4)  (Mar 12, 2017)

I admit it. I sneaked this release out just because I wanted to use less buggy macros.

Macro stuff:
* 
<p><a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="213499873" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1382" href="https://github.com/VSCodeVim/Vim/issues/1382">#1382</a> - macros made too many history steps - thanks <a class="user-mention" href="https://github.com/xconverge">@xconverge</a></p>


<a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="213499873" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1382" href="https://github.com/VSCodeVim/Vim/issues/1382">#1382</a> - macros made too many history steps - thanks <a class="user-mention" href="https://github.com/xconverge">@xconverge</a>
* 
<p><a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="213575205" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1388" href="https://github.com/VSCodeVim/Vim/issues/1388">#1388</a> - macros wouldn't play back indentation removal in some cases</p>


<a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="213575205" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1388" href="https://github.com/VSCodeVim/Vim/issues/1388">#1388</a> - macros wouldn't play back indentation removal in some cases
* 
<p><a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="213576111" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1389" href="https://github.com/VSCodeVim/Vim/issues/1389">#1389</a> - macros weren't adjusting character position correctly in some cases</p>


<a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="213576111" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1389" href="https://github.com/VSCodeVim/Vim/issues/1389">#1389</a> - macros weren't adjusting character position correctly in some cases
* 
<p><a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="213514740" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1385" href="https://github.com/VSCodeVim/Vim/issues/1385">#1385</a> - thanks <a class="user-mention" href="https://github.com/xconverge">@xconverge</a></p>


<a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="213514740" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1385" href="https://github.com/VSCodeVim/Vim/issues/1385">#1385</a> - thanks <a class="user-mention" href="https://github.com/xconverge">@xconverge</a>
# [v0.6.3 Hot Hotcakes](https://github.com/VSCodeVim/Vim/releases/tag/v0.6.3)  (Mar 11, 2017)
* Hot config reloading! Now you don't have to reload VSCode in order to see the vim-related changes you made to your settings. Thanks <a class="user-mention" href="https://github.com/xconverge">@xconverge</a>!
* Lots of fixes to macros. They are much more usable now! This was a tri-effort by <a class="user-mention" href="https://github.com/johnfn">@johnfn</a>, <a class="user-mention" href="https://github.com/rebornix">@rebornix</a> and <a class="user-mention" href="https://github.com/xconverge">@xconverge</a>!

Bug fixes:
* <a class="user-mention" href="https://github.com/xconverge">@xconverge</a> fixed lots of stuff, like normal.
# [v0.6.0 Cupcake Copier](https://github.com/VSCodeVim/Vim/releases/tag/v0.6.0)  (Mar 3, 2017)

Lots of stuff in this release. Most notably:
* <code>gd</code> is now totally stable and the cursor won't jump. <em>EVER</em>
* Copying works correctly and does not elide the final character.
* Improve performance when editing inside quotes or brackets.
* The cursor doesn't jump when editing two files with the same name. <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="189261580" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1057" href="https://github.com/VSCodeVim/Vim/issues/1057">#1057</a>

Also a bunch of other bug fixes:
* Fix <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="207736577" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1302" href="https://github.com/VSCodeVim/Vim/issues/1302">#1302</a> - thanks <a class="user-mention" href="https://github.com/xlaech">@xlaech</a>
* Fix <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="207434444" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1298" href="https://github.com/VSCodeVim/Vim/issues/1298">#1298</a> - thanks <a class="user-mention" href="https://github.com/xconverge">@xconverge</a>
* Fix <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="207402202" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1296" href="https://github.com/VSCodeVim/Vim/pull/1296">#1296</a> - thanks <a class="user-mention" href="https://github.com/xlaech">@xlaech</a>
* Fix <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="207104159" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1291" href="https://github.com/VSCodeVim/Vim/pull/1291">#1291</a> - thanks <a class="user-mention" href="https://github.com/xlaech">@xlaech</a>
* Fix a bunch of surround.vim issues - thanks <a class="user-mention" href="https://github.com/xconverge">@xconverge</a>
* Make gg go to first character rather than (0, 0) - thanks <a class="user-mention" href="https://github.com/xconverge">@xconverge</a> (<a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="209284371" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1320" href="https://github.com/VSCodeVim/Vim/issues/1320">#1320</a>)
* Fix <code>r&lt;tab&gt;</code>
# [v0.5.3 Communal Cheesecake](https://github.com/VSCodeVim/Vim/releases/tag/v0.5.3)  (Feb 12, 2017)

This version was entirely done by the community while I've been traveling.

Shout outs to:
* <a class="user-mention" href="https://github.com/xconverge">@xconverge</a>
* <a class="user-mention" href="https://github.com/rufusroflpunch">@rufusroflpunch</a>
* <a class="user-mention" href="https://github.com/inejge">@inejge</a>
* <a class="user-mention" href="https://github.com/rhys-vdw">@rhys-vdw</a>

<g-emoji alias="heart" fallback-src="https://assets-cdn.github.com/images/icons/emoji/unicode/2764.png" ios-version="6.0">❤️</g-emoji>
# [v0.5.1 Fixy French Toast](https://github.com/VSCodeVim/Vim/releases/tag/v0.5.1)  (Jan 24, 2017)

Fix a bug introduced by surround.vim: <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="202582997" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1239" href="https://github.com/VSCodeVim/Vim/issues/1239">#1239</a>
# [v0.5.0 Surroundy Squash](https://github.com/VSCodeVim/Vim/releases/tag/v0.5.0)  (Jan 24, 2017)

Add surround.vim!
# [v0.4.8 Jittery Jalapeño](https://github.com/VSCodeVim/Vim/releases/tag/v0.4.8)  (Dec 5, 2016)

Bug fixes:
* Fix a bug where holding down hjkl would be jittery. Been tracking this one for ages.
* Fix a recent regression with command remapping.
* Fix a very old (but minor) bug where VSCodeVim would ignore the first character you pressed.
# [v0.4.7 Dangerous Doughnut](https://github.com/VSCodeVim/Vim/releases/tag/v0.4.7)  (Dec 5, 2016)

I went on a bug killing spree.

Bug Fixes:
* Use native block cursor for solid cursor setting
* Fix command remapping incorrectly being triggered in the middle of commands
* Fix some leader bugs (thanks <a class="user-mention" href="https://github.com/xconverge">@xconverge</a>!)
* Add <code>nohl</code> aliases and untrigger it in some locations (thanks <a class="user-mention" href="https://github.com/xconverge">@xconverge</a>!)
* Fix a bug with remapping long commands.
* Fix backspacing indents
* Fix <code>dit</code> for empty tags.
* Fix deleting to marks.
* Fix a bug with <code>&lt;C-a&gt;</code> and <code>&lt;C-x&gt;</code> incrementing/decrementing the wrong number.
* Fix <code>#&lt;k</code> in some situations.

Features:
* Add <code>:nohl</code>
* Allow search highlight color to be customized
* Add <code>&lt;CR&gt;</code> as a synonym for <code>\n</code>.
* Add showcmd configuration setting, defaulting to on.
* Recognize and use <code>&lt;leader&gt;</code>
* Allow remapping directly to VSCode commands.
* Add <code>&lt;space&gt;</code> as a synonym for <code></code>.
# [v0.4.6 v0.4.6](https://github.com/VSCodeVim/Vim/releases/tag/v0.4.6)  (Dec 4, 2016)

Features:
* Add <code>gq</code> - word wrap a visual chunk of text, formatting comments correctly.
* Add <code>gf</code> - go to file - thanks <a class="user-mention" href="https://github.com/jamirvin">@jamirvin</a>!
* Add home key and cmd-left support - thanks <a class="user-mention" href="https://github.com/xconverge">@xconverge</a>!
* Add startInInsertMode configuration setting.

Bug Fixes:
* Fix a really obscure bug with word boundaries.
* Fix an annoying bug where the view would jump to the top of the file when searching with /.
# [0.4.5 0.4.5](https://github.com/VSCodeVim/Vim/releases/tag/0.4.5)  (Dec 4, 2016)

Pretend you don't see this.
# [v0.4.4 v0.4.4](https://github.com/VSCodeVim/Vim/releases/tag/v0.4.4)  (Nov 29, 2016)

Features:
* Add <code>&lt;C-n&gt;</code> and <code>&lt;C-p&gt;</code> for navigating autocompletetion popups.
* Add <code>&lt;C-o&gt;</code> - thanks <a class="user-mention" href="https://github.com/xconverge">@xconverge</a>!
* Add <code>g &lt;up&gt;</code> and <code>g &lt;down&gt;</code> - thanks <a class="user-mention" href="https://github.com/xconverge">@xconverge</a>!

Bugs fixed:
* Fix <code>&lt;D-d&gt;</code> for multi-cursor support.
* Fix visual incremental search.
* Fix <code>J</code>
* Fix <code>va{</code> - thanks <a class="user-mention" href="https://github.com/xconverge">@xconverge</a>!
* Fix <code>vsp</code> to open current document in new panel by default - thanks <a class="user-mention" href="https://github.com/xconverge">@xconverge</a>!
# [v0.4.2 Jolly James](https://github.com/VSCodeVim/Vim/releases/tag/v0.4.2)  (Nov 17, 2016)
* <a href="https://github.com/easymotion/vim-easymotion">EasyMotion</a> bindings. Thanks <a class="user-mention" href="https://github.com/metamist">@Metamist</a>
* A variety of bug fixes by <a class="user-mention" href="https://github.com/rebornix">@rebornix</a>
* Fixes for <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="185769774" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1003" href="https://github.com/VSCodeVim/Vim/issues/1003">#1003</a> and <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="187666004" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/1043" href="https://github.com/VSCodeVim/Vim/issues/1043">#1043</a> by <a class="user-mention" href="https://github.com/xconverge">@xconverge</a>
# [v0.4.0 Handsome Hen](https://github.com/VSCodeVim/Vim/releases/tag/v0.4.0)  (Oct 24, 2016)

<a class="commit-link" href="https://github.com/VSCodeVim/Vim/compare/v0.3.8...v0.4.0"><tt>v0.3.8...v0.4.0</tt></a>
# [v0.3.8 Gorging Grouse](https://github.com/VSCodeVim/Vim/releases/tag/v0.3.8)  (Oct 18, 2016)
* Improved Performance (Thanks <a class="user-mention" href="https://github.com/johnfn">@johnfn</a>)
* Display register contents on <code>:reg</code> command (Thanks <a class="user-mention" href="https://github.com/platzer">@Platzer</a>)
* Draw multicursor correctly in Visual Mode (Thanks <a class="user-mention" href="https://github.com/platzer">@Platzer</a>)
* Fixes <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="173267479" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/652" href="https://github.com/VSCodeVim/Vim/issues/652">#652</a> and <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="182543360" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/905" href="https://github.com/VSCodeVim/Vim/issues/905">#905</a> (Thanks <a class="user-mention" href="https://github.com/xconverge">@xconverge</a>)
* An assortment of fixes with the cursor (Thanks <a class="user-mention" href="https://github.com/rebornix">@rebornix</a>)
* Fixed auto-build/test/release pipeline
# [0.3.7 Fixy French Fries](https://github.com/VSCodeVim/Vim/releases/tag/0.3.7)  (Oct 12, 2016)

This includes the one-line fix <a class="commit-link" href="https://github.com/VSCodeVim/Vim/commit/c845e04b7319cb5b235f726783a0d127cdb16ae4"><tt>c845e04</tt></a>, which fix an astounding number of bugs, including:
* <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="182140368" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/872" href="https://github.com/VSCodeVim/Vim/issues/872">#872</a>
* <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="182380179" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/892" href="https://github.com/VSCodeVim/Vim/issues/892">#892</a>
* <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="182418926" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/896" href="https://github.com/VSCodeVim/Vim/issues/896">#896</a>
* <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="181686503" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/856" href="https://github.com/VSCodeVim/Vim/issues/856">#856</a>
* <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="182431935" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/901" href="https://github.com/VSCodeVim/Vim/issues/901">#901</a>
* <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="182418786" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/895" href="https://github.com/VSCodeVim/Vim/issues/895">#895</a>

Yes, it really fixed that many issues. It probably even fixed more that we haven't found yet!
# [0.3.6 Fixy Fondue ](https://github.com/VSCodeVim/Vim/releases/tag/0.3.6)  (Oct 12, 2016)

More bug fixes. The 0.3.x series is just going to be a bunch of bug fixes that stabilize the refactors introduced in 0.3.0 and 0.3.1.

Bugs fixed:
* Search scrolling was incorrect.
* Code snippets were broken.
* <code>d</code> and <code>x</code> were not working in Visual Block Mode. (Thanks <a class="user-mention" href="https://github.com/xconverge">@xconverge</a>!)
* <code>C-c</code> and <code>C-[</code> were not working in Insert Mode.
* Don't require double <code>&lt;esc&gt;</code> to get to normal mode when the autocomplete window is open in insert mode.
* We were incorrectly reporting the users were in normal mode when they weren't in some cases.
* Editing in split editors was broken in some cases.
# [0.3.5 Buggier Brocolli](https://github.com/VSCodeVim/Vim/releases/tag/0.3.5)  (Oct 11, 2016)

Backspace was broken in insert mode.

(Generally I wouldn't release so often, but I wanted to have the extension in relatively good shape for the burst of traffic for 1.6.0)
# [0.3.4 Buggy Brocolli](https://github.com/VSCodeVim/Vim/releases/tag/0.3.4)  (Oct 10, 2016)

Fixes a large number of bugs that all stemmed from the same issue.
# [0.3.3 Speedy Salmon](https://github.com/VSCodeVim/Vim/releases/tag/0.3.3)  (Oct 8, 2016)

Hotfix for a bug introduced in 0.3.1 (and 0.3.2) that made it impossible to enter insert mode in some cases.
# [0.3.2 Dumb Dumbo](https://github.com/VSCodeVim/Vim/releases/tag/0.3.2)  (Oct 8, 2016)

Let's not talk about this one...
# [v0.3.1 Gaudy Gengar](https://github.com/VSCodeVim/Vim/releases/tag/v0.3.1)  (Oct 8, 2016)

Features
* Multi-Cursor support can now run multiple deletes/changes/etc on a single line.
* Multi-Cursor support now works better with Windows.

Bug bash!
* <a class="user-mention" href="https://github.com/johnfn">@johnfn</a> squashed a crap ton of bugs. Too many to list so I won't try.
* <a class="user-mention" href="https://github.com/xconverge">@xconverge</a> Thanks for helping fix <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="180971395" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/832" href="https://github.com/VSCodeVim/Vim/issues/832">#832</a>, <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="181081813" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/841" href="https://github.com/VSCodeVim/Vim/issues/841">#841</a>, <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="177730398" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/784" href="https://github.com/VSCodeVim/Vim/issues/784">#784</a>, <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="181308717" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/846" href="https://github.com/VSCodeVim/Vim/issues/846">#846</a>, and a couple of other fixes that weren't tracked by GH issues.
* Thanks <a class="user-mention" href="https://github.com/kevincoleman">@kevincoleman</a>. We have a new logo and it looks purrrty.
# [v0.3.0 Furious Feline](https://github.com/VSCodeVim/Vim/releases/tag/v0.3.0)  (Oct 4, 2016)

Multi-cursor support by <a class="user-mention" href="https://github.com/johnfn">@johnfn</a>! If you have any feedback on this, please share it on <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="180737052" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/824" href="https://github.com/VSCodeVim/Vim/issues/824">#824</a>

Special thanks to:
* <a class="user-mention" href="https://github.com/bdchauvette">@bdchauvette</a> for adding support for the system clipboard register a la <code>"+</code> (<a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="177625002" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/780" href="https://github.com/VSCodeVim/Vim/issues/780">#780</a>)
* <a class="user-mention" href="https://github.com/srenatus">@srenatus</a> for helping update some of our documentation
* <a class="user-mention" href="https://github.com/xconverge">@xconverge</a> fixing a galore of issues including <code>cw</code> (<a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="175901051" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/739" href="https://github.com/VSCodeVim/Vim/issues/739">#739</a>) and other bugs like <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="180492221" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/817" href="https://github.com/VSCodeVim/Vim/issues/817">#817</a>, <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="170982644" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/603" href="https://github.com/VSCodeVim/Vim/issues/603">#603</a> , <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="179840039" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/809" href="https://github.com/VSCodeVim/Vim/issues/809">#809</a> , <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="180797785" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/827" href="https://github.com/VSCodeVim/Vim/pull/827">#827</a>
* <a class="user-mention" href="https://github.com/rebornix">@rebornix</a> also fixing a series of issues <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="178697474" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/795" href="https://github.com/VSCodeVim/Vim/issues/795">#795</a>, <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="179346573" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/804" href="https://github.com/VSCodeVim/Vim/issues/804">#804</a>
# [v0.2.0 Eccentric Ewok](https://github.com/VSCodeVim/Vim/releases/tag/v0.2.0)  (Sep 21, 2016)
* Add <code>vim.autoindent</code> setting (Thanks <a class="user-mention" href="https://github.com/octref">@octref</a>)
* Support <code>:wa[ll]</code> (Thanks <a class="user-mention" href="https://github.com/mleech">@mleech</a>)
* Support <code>&lt;C-r&gt;</code>, <code>&lt;C-e&gt;</code>, <code>&lt;C-d&gt;</code>, <code>&lt;C-y&gt;</code>, <code>&lt;C-h&gt;</code>, <code>&lt;C-u&gt;</code> (Thanks <a class="user-mention" href="https://github.com/rebornix">@rebornix</a>)
* Support <code>:r</code> (Thanks <a class="user-mention" href="https://github.com/dominic31">@dominic31</a>)
* Support substitution marks (Thanks <a class="user-mention" href="https://github.com/rebornix">@rebornix</a>)
* A variety of bug fixes <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="176173549" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/750" href="https://github.com/VSCodeVim/Vim/issues/750">#750</a>, <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="176532342" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/759" href="https://github.com/VSCodeVim/Vim/issues/759">#759</a>, <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="175901226" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/740" href="https://github.com/VSCodeVim/Vim/issues/740">#740</a>, <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="176037315" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/743" href="https://github.com/VSCodeVim/Vim/issues/743">#743</a>, <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="174013625" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/677" href="https://github.com/VSCodeVim/Vim/issues/677">#677</a>, <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="177021544" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/772" href="https://github.com/VSCodeVim/Vim/issues/772">#772</a>, <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="177148917" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/773" href="https://github.com/VSCodeVim/Vim/issues/773">#773</a>, <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="176840649" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/769" href="https://github.com/VSCodeVim/Vim/issues/769">#769</a>, <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="176210016" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/753" href="https://github.com/VSCodeVim/Vim/issues/753">#753</a>, <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="177743200" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/785" href="https://github.com/VSCodeVim/Vim/issues/785">#785</a>, <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="170058738" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/581" href="https://github.com/VSCodeVim/Vim/issues/581">#581</a>, <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="176163854" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/747" href="https://github.com/VSCodeVim/Vim/issues/747">#747</a>, <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="176705129" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/762" href="https://github.com/VSCodeVim/Vim/issues/762">#762</a>, <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="174834807" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/701" href="https://github.com/VSCodeVim/Vim/issues/701">#701</a>, <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="176136951" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/746" href="https://github.com/VSCodeVim/Vim/issues/746">#746</a>  (Thanks <a class="user-mention" href="https://github.com/rebornix">@rebornix</a>, <a class="user-mention" href="https://github.com/jgoz">@jgoz</a>, <a class="user-mention" href="https://github.com/xconverge">@xconverge</a>)
# [v0.1.10 Dithering Dork](https://github.com/VSCodeVim/Vim/releases/tag/v0.1.10)  (Sep 6, 2016)

Bug fixes (thanks <a class="user-mention" href="https://github.com/xconverge">@xconverge</a>):
* <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="174438740" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/690" href="https://github.com/VSCodeVim/Vim/issues/690">#690</a>, <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="174665714" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/696" href="https://github.com/VSCodeVim/Vim/issues/696">#696</a>, <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="175156445" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/718" href="https://github.com/VSCodeVim/Vim/issues/718">#718</a>, <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="175151096" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/716" href="https://github.com/VSCodeVim/Vim/issues/716">#716</a>
# [v0.1.9 Compunctious Canary](https://github.com/VSCodeVim/Vim/releases/tag/v0.1.9)  (Sep 5, 2016)
* Hotfix for <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="174942877" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/706" href="https://github.com/VSCodeVim/Vim/issues/706">#706</a>
# [v0.1.8 Buggy Baloney ](https://github.com/VSCodeVim/Vim/releases/tag/v0.1.8)  (Sep 4, 2016)

Fixes TONS of bugs. I can't even list them all. There are so many!

Thanks to
* <a class="user-mention" href="https://github.com/sectioneight">@sectioneight</a>
* <a class="user-mention" href="https://github.com/xconverge">@xconverge</a>
* <a class="user-mention" href="https://github.com/antonaderum">@AntonAderum</a>
* <a class="user-mention" href="https://github.com/platzer">@Platzer</a>
* <a class="user-mention" href="https://github.com/aminroosta">@aminroosta</a>
* <a class="user-mention" href="https://github.com/octref">@octref</a>

For their open-source contributions!
# [v0.1.7 Settings Sandwich](https://github.com/VSCodeVim/Vim/releases/tag/v0.1.7)  (Aug 14, 2016)

This release includes <a class="user-mention" href="https://github.com/rebornix">@rebornix</a>'s excellent work on Vim Settings. Now instead of janky keys that I put in to settings.json at random, we actually mirror Vim's strategy to turn settings on and off!
## Features
* Settings
* <code>smartcase</code> search
* Add Y in visual mode (thanks <a class="user-mention" href="https://github.com/shotaakasaka">@shotaAkasaka</a>!)
## Bug Fixes
* Fix crashes when making large (100+ line) changes. This has been a gnarly one, glad to finally fix it!
* Fix cc and C on empty lines (thanks <a class="user-mention" href="https://github.com/shotaakasaka">@shotaAkasaka</a>!)
* Default to not having Visual Block Mode active.
* Fix jj leaving behind a stray j.
# [v0.1.6 Blocky Banana](https://github.com/VSCodeVim/Vim/releases/tag/v0.1.6)  (Aug 9, 2016)

This was intended to be a hot-fix for <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="170147798" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/583" href="https://github.com/VSCodeVim/Vim/issues/583">#583</a>; as an apology, it also includes Visual Block mode, one of our most requested features. (And also because I just happened to finish it right after I released 0.1.5) <g-emoji alias="wink" fallback-src="https://assets-cdn.github.com/images/icons/emoji/unicode/1f609.png" ios-version="6.0">😉</g-emoji>
# [0.1.5 Replacement Raisin](https://github.com/VSCodeVim/Vim/releases/tag/0.1.5)  (Aug 9, 2016)

Another awesome release!
## New features
* Replace mode! This is a big one (thanks <a class="user-mention" href="https://github.com/rebornix">@rebornix</a>!)
* <code>s/foo/bar</code> with an optional visual mode range (thanks <a class="user-mention" href="https://github.com/rebornix">@rebornix</a>!)
* <code>gd</code> (thanks <a class="user-mention" href="https://github.com/jordanlewis">@jordanlewis</a>!)
* S (thanks <a class="user-mention" href="https://github.com/glibsm">@glibsm</a>!)
* Add * register (thanks <a class="user-mention" href="https://github.com/aminroosta">@aminroosta</a>!)
* Add correct fold behavior (thanks <a class="user-mention" href="https://github.com/rebornix">@rebornix</a>!)
* Add motions by screen lines (thanks <a class="user-mention" href="https://github.com/rebornix">@rebornix</a>!)
* Add o in visual mode (thanks <a class="user-mention" href="https://github.com/platzer">@Platzer</a>!)
* Add section motions ]], [[, ][ and [](thanks <a class="user-mention" href="https://github.com/rebornix">@rebornix</a>!)
* Add ^e and ^y
* Make  repeatable in normal mode (thanks <a class="user-mention" href="https://github.com/octref">@octref</a>!)
## Bug-fixes
* Fix an off-by-one error with T and F (thanks <a class="user-mention" href="https://github.com/xconverge">@xconverge</a>!)
* Improve key-repeat suggestion in README (thanks <a class="user-mention" href="https://github.com/jimray">@jimray</a>!)
* Fix ctrl key issues (thanks <a class="user-mention" href="https://github.com/rebornix">@rebornix</a>!)
* Fix gt and gT (thanks <a class="user-mention" href="https://github.com/rebornix">@rebornix</a>!)
* Fix the cursor location in some cases when deleting a line break in insert mode (thanks <a class="user-mention" href="https://github.com/thomasboyt">@thomasboyt</a>!)
* Fix remapping in modes that don't want remapping to happen
* Fix a bug making marks inconsistent
* Fix V in visual mode
# [v0.1.4 Awesome Applepie](https://github.com/VSCodeVim/Vim/releases/tag/v0.1.4)  (Jul 28, 2016)

I'm especially excited about this version of VSCodeVim! There were a large number of contributions that really improved the quality of the extension. As usual, thanks to all contributors!

New features:
* Implement quoted text objects - thanks <a class="user-mention" href="https://github.com/sectioneight">@sectioneight</a>
* Finish off aw and iw - thanks <a class="user-mention" href="https://github.com/rebornix">@rebornix</a>
* Add gt and gT - thanks <a class="user-mention" href="https://github.com/arussellk">@arussellk</a>
* Add ctrl-a and ctrl-x - thanks <a class="user-mention" href="https://github.com/sectioneight">@sectioneight</a>

Bug fixes and improvements:
* Improve performance of / and ? - thanks <a class="user-mention" href="https://github.com/roblourens">@roblourens</a>
* Improve performance of u and c-r - thanks <a class="user-mention" href="https://github.com/infogulch">@infogulch</a>
* Fix CJK completely - thanks <a class="user-mention" href="https://github.com/rebornix">@rebornix</a>
* Fix scrolling behavior when you have two panes of the same file open - thanks <a class="user-mention" href="https://github.com/rebornix">@rebornix</a>
# [v0.1.3 Inner Icepop ](https://github.com/VSCodeVim/Vim/releases/tag/v0.1.3)  (Jul 19, 2016)
* Add indentation-related <code>p</code> commands (thanks <a class="user-mention" href="https://github.com/rebornix">@rebornix</a>!)
* Add <code>ctrl-c</code> (with <code>useCtrlKeys</code>)
* Make <code>ctrl-f</code> use default search behavior, by popular demand, even though <code>/</code> is objectively better and you should never use <code>ctrl-f</code> <g-emoji alias="wink" fallback-src="https://assets-cdn.github.com/images/icons/emoji/unicode/1f609.png" ios-version="6.0">😉</g-emoji>
* Add <code>ctrl-f</code> in insert mode (thanks <a class="user-mention" href="https://github.com/sectioneight">@sectioneight</a>!)
* Add every inner-object and a-object command, e.g. <code>a[</code> <code>i(</code>, etc. (thanks <a class="user-mention" href="https://github.com/sectioneight">@sectioneight</a>! this is a big one!)
# [v0.1.2 Communal Crossaint](https://github.com/VSCodeVim/Vim/releases/tag/v0.1.2)  (Jul 13, 2016)

So named because I think the community did more work than me this time. VSCodeVim has legs! <g-emoji alias="wink" fallback-src="https://assets-cdn.github.com/images/icons/emoji/unicode/1f609.png" ios-version="6.0">😉</g-emoji>

Changes:
* Fix db (thanks <a class="user-mention" href="https://github.com/rebornix">@rebornix</a>!)
* Fix ctrl+f, ctrl+b
* Display search in statusbar
* Fix <code>dw</code> on end of line (thanks <a class="user-mention" href="https://github.com/rebornix">@rebornix</a>!)
* Add <code>s</code> in visual/visual line mode.
* Add <code>p</code> and <code>P</code> in visual/visual line mode.
* Fix an issue with backspace and .
# [v0.1.1 Suggestive Sandwich](https://github.com/VSCodeVim/Vim/releases/tag/v0.1.1)  (Jul 8, 2016)
* Fix a bug with auto-complete (thanks <a class="user-mention" href="https://github.com/rebornix">@rebornix</a>!)
# [v0.1 Massive Marshmallow](https://github.com/VSCodeVim/Vim/releases/tag/v0.1)  (Jul 8, 2016)

Lots of stuff in this release!
* Command remapping
* Correct Undo/Redo history
* Marks
* :wq (thanks <a class="user-mention" href="https://github.com/srepollock">@srepollock</a>!)
* Incremental search now wraps document and shows all results
* Add space
* Add configuration option for nonblinking block cursor
* Sentence motions (thanks <a class="user-mention" href="https://github.com/rebornix">@rebornix</a>!)
* Numeric prefix to C (thanks <a class="user-mention" href="https://github.com/rebornix">@rebornix</a>!)
* :tabnext, :tabprevious, :tabfirst, :tablast (thanks <a class="user-mention" href="https://github.com/rebornix">@rebornix</a>!)
* Arrow keys (thanks <a class="user-mention" href="https://github.com/rebornix">@rebornix</a>!)
# [v0.0.28 Incremental Icecream](https://github.com/VSCodeVim/Vim/releases/tag/v0.0.28)  (Jun 24, 2016)

Lots of features this time! Barely any bugfixes because there aren't any bugs left. <g-emoji alias="wink" fallback-src="https://assets-cdn.github.com/images/icons/emoji/unicode/1f609.png" ios-version="6.0">😉</g-emoji>
* Implement <code>gJ</code>
* Allow numeric prefixes for <code>J</code>
* Implement <code>gI</code>
* Implement <code>&lt;count&gt;dd</code>
* Implement <code>&lt;count&gt;yy</code> (thanks <a class="user-mention" href="https://github.com/rebornix">@rebornix</a>)
* Implement <code>=</code> (thanks <a class="user-mention" href="https://github.com/rebornix">@rebornix</a>)
* Implement <code>U</code> (thanks <a class="user-mention" href="https://github.com/rebornix">@rebornix</a>)
* Implement <code>+</code>
* Implement <code>-</code>
* Implement <code>_</code>
* Fix <code>I</code>
# [v0.0.27 Danish Documentary](https://github.com/VSCodeVim/Vim/releases/tag/v0.0.27)  (Jun 23, 2016)

I'd watch a documentary about danishes - wouldn't you?

Anyways, this was a rather small release because I spent my night working on documentation (as the title implies). I did fix 2 important bugs, though:
* J was broken in some cases
* Backspace didn't work over newlines.
# [0.0.26 Savory Starfruit](https://github.com/VSCodeVim/Vim/releases/tag/0.0.26)  (Jun 22, 2016)
* Add * and #
* Add ~ and enter in Normal Mode - thanks <a class="user-mention" href="https://github.com/markrendle">@markrendle</a>
* Fix a wide assortment of bugs and edge cases.
# [0.0.25 Repetitive Radish](https://github.com/VSCodeVim/Vim/releases/tag/0.0.25)  (Jun 20, 2016)

Adds number repeats for movements.<br/>
Fixes a bad bug with the cursor.
# [0.0.24 Foolish Felafel](https://github.com/VSCodeVim/Vim/releases/tag/0.0.24)  (Jun 19, 2016)
* Fixes a bug that completely broke search. Sorry about that!
# [0.0.23 Jealous Jellyroll](https://github.com/VSCodeVim/Vim/releases/tag/0.0.23)  (Jun 19, 2016)
* Adds %
* Fixes a number of small bugs
* Adds a new testing style
# [v0.0.22 v0.0.22](https://github.com/VSCodeVim/Vim/releases/tag/v0.0.22)  (Jun 18, 2016)

Hopefully fix <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="160724486" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/306" href="https://github.com/VSCodeVim/Vim/issues/306">#306</a>.
# [v0.0.20 v0.0.20](https://github.com/VSCodeVim/Vim/releases/tag/v0.0.20)  (Jun 13, 2016)

<a class="user-mention" href="https://github.com/johnfn">@johnfn</a> is a freaking code machine. <a class="commit-link" href="https://github.com/VSCodeVim/Vim/compare/v0.0.19...v0.0.20"><tt>v0.0.19...v0.0.20</tt></a>
# [v0.0.19 v0.0.19](https://github.com/VSCodeVim/Vim/releases/tag/v0.0.19)  (Jun 7, 2016)

This was all <a class="user-mention" href="https://github.com/johnfn">@johnfn</a>:
* Implemented f, F, t, T, cc, yy, dd, s
* Visual Line mode
# [v0.0.18 v0.0.18](https://github.com/VSCodeVim/Vim/releases/tag/v0.0.18)  (May 19, 2016)
* Update to vscode extension api v0.10.12
* Fixes <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="135377995" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/157" href="https://github.com/VSCodeVim/Vim/issues/157">#157</a>, <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="125256001" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/126" href="https://github.com/VSCodeVim/Vim/issues/126">#126</a>, <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="141428064" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/188" href="https://github.com/VSCodeVim/Vim/issues/188">#188</a>
# [v0.0.17 v0.0.17](https://github.com/VSCodeVim/Vim/releases/tag/v0.0.17)  (May 17, 2016)
* Add folding commands
* bug fixes
# [v0.0.16 v0.0.16](https://github.com/VSCodeVim/Vim/releases/tag/v0.0.16)  (May 4, 2016)
* copy-paste
* bug fixes
# [v0.0.15 v0.0.15](https://github.com/VSCodeVim/Vim/releases/tag/v0.0.15)  (Mar 22, 2016)
* Fixes <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="125297272" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/127" href="https://github.com/VSCodeVim/Vim/issues/127">#127</a>
* Fix highlighting of cursor block when changing position via cursor
# [v0.0.14 v0.0.14](https://github.com/VSCodeVim/Vim/releases/tag/v0.0.14)  (Mar 21, 2016)
* Implement <code>/</code> =&gt; Search
* Bug fixes around delete
# [v0.0.13 v0.0.13](https://github.com/VSCodeVim/Vim/releases/tag/v0.0.13)  (Mar 18, 2016)
* support d{motion}, c, ge commands
* bug fixes
# [v0.0.12 v0.0.12](https://github.com/VSCodeVim/Vim/releases/tag/v0.0.12)  (Mar 4, 2016)
* Add Visual Mode
* Add <code>E</code>, <code>e</code>
* Various bug fixes
# [v0.0.11 v0.0.11](https://github.com/VSCodeVim/Vim/releases/tag/v0.0.11)  (Feb 18, 2016)
* Add Ctrl+C, Add support for ctrl+f/ctrl+b
* Implement X in normal mode, W/B WORD movements
* Fixes: word, back-word motions, x motion at EOL
# [v0.0.10 v0.0.10](https://github.com/VSCodeVim/Vim/releases/tag/v0.0.10)  (Feb 1, 2016)
* Add Swedish Keyboard (compliments of <a class="user-mention" href="https://github.com/antonaderum">@AntonAderum</a>)
* Add Paragraph motion (compliments of <a class="user-mention" href="https://github.com/johnfn">@johnfn</a>)
# [v0.0.9 v0.0.9](https://github.com/VSCodeVim/Vim/releases/tag/v0.0.9)  (Feb 1, 2016)
* Support Danish da-DK keyboard (compliments of <a class="user-mention" href="https://github.com/kedde">@kedde</a>)
* Implement x command.
# [v0.0.8 v0.0.8](https://github.com/VSCodeVim/Vim/releases/tag/v0.0.8)  (Jan 3, 2016)
* Bug Fix:
<ul>
<li>Better handling when position changed via mouse click</li>
</ul>

* Better handling when position changed via mouse click
# [v0.0.7 v0.0.7](https://github.com/VSCodeVim/Vim/releases/tag/v0.0.7)  (Jan 3, 2016)
* Block Cursor in Normal Mode (Thank you <a class="user-mention" href="https://github.com/andersenj">@AndersenJ</a> and <a class="user-mention" href="https://github.com/markrendle">@markrendle</a>).
* Bug Fixes
# [v0.0.6 v0.0.6](https://github.com/VSCodeVim/Vim/releases/tag/v0.0.6)  (Dec 30, 2015)
* Implement motions: 0, e
* Various motion bug fixes
# [v0.0.5 v0.0.5](https://github.com/VSCodeVim/Vim/releases/tag/v0.0.5)  (Dec 9, 2015)
* Fixes bad release of v0.0.3 namely issue <a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="120505159" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/93" href="https://github.com/VSCodeVim/Vim/issues/93">#93</a>
# [v0.0.3 v0.0.3](https://github.com/VSCodeVim/Vim/releases/tag/v0.0.3)  (Dec 4, 2015)

<g-emoji alias="warning" fallback-src="https://assets-cdn.github.com/images/icons/emoji/unicode/26a0.png" ios-version="6.0">⚠️</g-emoji> Bad Release (<a class="issue-link js-issue-link" data-error-text="Failed to load issue title" data-id="120505159" data-permission-text="Issue title is private" data-url="https://github.com/VSCodeVim/Vim/issues/93" href="https://github.com/VSCodeVim/Vim/issues/93">#93</a>). Immediately re-published v0.0.2 as v0.0.4 into the VS Code Marketplace.
* Features:
<ul>
<li>Support <code>w</code>, <code>b</code>, <code>db</code>, <code>$</code>, <code>^</code></li>
</ul>

* Support <code>w</code>, <code>b</code>, <code>db</code>, <code>$</code>, <code>^</code>
* Bug Fixes:
<ul>
<li>Trigger suggest following every insert</li>
<li>Differentiate cursor (insert mode) and caret (normal mode) behaviour</li>
</ul>

* Trigger suggest following every insert
* Differentiate cursor (insert mode) and caret (normal mode) behaviour
# [v0.0.2 v0.0.2](https://github.com/VSCodeVim/Vim/releases/tag/v0.0.2)  (Dec 1, 2015)
* Bug Fixes:
<ul>
<li>Fix cursor position entering command mode</li>
<li>Actually implement <code>shift+a</code> to insert end of line</li>
</ul>

* Fix cursor position entering command mode
* Actually implement <code>shift+a</code> to insert end of line
# [v0.0.1 First!](https://github.com/VSCodeVim/Vim/releases/tag/v0.0.1)  (Nov 29, 2015)

Initial release to the <a href="https://marketplace.visualstudio.com/items/vscodevim.vim">Visual Studio Marketplace</a>
