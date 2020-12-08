import { IKeyRemapping } from '../configuration/iconfiguration';

/**
 * State related to key remapping. Held by ModeHandler.
 */
export class RemapState {
  /**
   * For timing out remapped keys like jj to esc.
   */
  public lastKeyPressedTimestamp = 0;

  /**
   * Used to indicate that a non-recursive remap is being handled.
   * This is used to prevent non-recursive remappings from looping.
   */
  public isCurrentlyPerformingNonRecursiveRemapping = false;

  /**
   * Used to indicate that a recursive remap is being handled. This is used to prevent recursive remappings
   * from looping farther then maxMapDepth and to stop recursive remappings when an action fails.
   */
  public isCurrentlyPerformingRecursiveRemapping = false;

  /**
   * Used to indicate that a remap is being handled and the keys sent to modeHandler were not typed
   * by the user.
   */
  public get isCurrentlyPerformingRemapping() {
    return (
      this.isCurrentlyPerformingNonRecursiveRemapping ||
      this.isCurrentlyPerformingRecursiveRemapping
    );
  }

  /**
   * When performing a recursive remapping that has no parent remappings and that finishes while
   * still waiting for timeout or another key to come we store that remapping here. This is used
   * to be able to handle those buffered keys and any other key that the user might press to brake
   * the timeout seperatly. Because if an error happens in the middle of a remap, the remaining
   * remap keys shouldn't be handled but the user pressed ones should, but if an error happens on
   * a user typed key, the following typed keys will still be handled.
   *
   * Example: having the following remapings:
   * * `nmap <leader>lf Lfill`
   * * `nmap Lfillc 4I<space><esc>`
   * * `nmap Lfillp 2I<space><esc>`
   * When user presses `<leader>lf` it remaps that to `Lfill` but because that is an ambiguous remap
   * it creates the timeout and returns from remapper setting the performing remapping flag to false.
   * This allows the user to then press `c` or `p` and the corresponding remap would run. But if the
   * user presses another key or the timeout finishes we need to handle the `Lfill` keys and they
   * need to know they were sent by a remap and not by the user so that in case the find 'i' in
   * `Lfill` fails the last two `l` shouldn't be executed and any keys typed by the user after the
   * remap that brake the timeout need to be handled seperatly from `Lfill`.
   * (Check the tests for this example to understand better).
   *
   * To prevent this, we stored the remapping that finished waiting for timeout so that, if the
   * timeout finishes or the user presses some keys that brake the potential remap, we will know
   * what was the remapping waiting for timeout. So in case the timeout finishes we set the
   * currently performing recursive remapping flag to true manually, send the <TimeoutFinished> key
   * and in the end we set the flag back to false again and clear the stored remapping. In case
   * the user presses one or more keys that brake the potential timeout we set the flag to true
   * manually, handle the keys from the remapping and then set the flag back to false, clear the
   * stored remapping and handle the keys pressed by the user seperatly.
   * We do this because any VimError or ForceStopRemappingError are thrown only when performing a
   * remapping.
   */
  public wasPerformingRemapThatFinishedWaitingForTimeout: IKeyRemapping | false = false;

  /**
   * Holds the current map depth count (number of nested remaps without using a character). In recursive remaps
   * every time we map a key when already performing a remapping this number increases by one. When a remapping
   * handling uses a character this number resets to 0.
   *
   * When it reaches the maxMapDepth it throws the VimError E223.
   * (check vim documentation :help maxmapdepth)
   */
  public mapDepth: number = 0;

  /**
   * Used to reset the mapDepth on nested recursive remaps. Is set to false every time we get a remapping and is set to
   * true when a character is used. We consider a character as being used when we get an action.
   * (check vim documentation :help maxmapdepth).
   *
   * Example 1: if we remap `x -> y` and `y -> x` if we press any of those keys we will continuously find a new
   * remap and increase the mapDepth without ever using an action until we hit maxMapDepth and we get E223 stopping
   * it all.
   *
   * Example 2: if we map `a -> x`, `x -> y`, `y -> b` and `b -> w` and we set maxMapDepth to 4 we get 'E223 Recursive
   * Mapping', because we get to the fourth remap without ever executing an action, but if we change the 'y' map to
   * `y -> wb`, now the max mapDepth we hit is 3 and then we execute the action 'w' that resets the mapDepth and then
   * call another remap of `b -> w` that executes another 'w', meaning that after pressing 'a' the result would be 'ww'.
   * Another option would be to increase the maxMapDepth to 5 or more and then we could use the initial remaps that would
   * turn the pressing of 'a' into a single 'w'.
   *
   * Example 3 (possible use case): if we remap `<leader>cb -> 0i//<Space><Esc>j<leader>cb` that recursively calls itself,
   * every time the`0` key is sent we set remapUsedACharacter to true and reset mapDepth to 0 on all nested remaps so even
   * if it calls itself more than 1000 times (on a file with more than 1000 lines) the mapDepth will always be reset to 0,
   * which allows the remap to keep calling itself to comment all the lines until either we get to the last line and the 'j'
   * action fails stopping the entire remap chain or the user presses `<C-c>` or `<Esc>` to forcelly stop the recursive remaps.
   *
   * P.S. This behavior is weird, because we should reduce the mapDepth by one when the remapping finished handling
   * or if it failed. But this is the way Vim does it. This allows the user to create infinite looping remaps
   * that call themselves and only stop after an error or the user pressing a key (usually <C-c> but we also
   * allow <Esc> because the user might not allow the use of ctrl keys).
   *
   * P.S.2 This is a complicated explanation for a seemingly simple feature, but I wrote this because when I first read the
   * Vim documentation it wasn't very clear to me how this worked, I first thought that mapDepth was like a map count but that
   * is not the case because we can have thousands of nested remaps without ever hitting maxMapDepth like in Example 3, and I
   * only started to understand it better when I tried Example 2 in Vim and some variations of it.
   */
  public remapUsedACharacter: boolean = false;

  /**
   * This will force Stop a recursive remapping. Used by <C-c> or <Esc> key when there is a recursive remapping
   */
  public forceStopRecursiveRemapping: boolean = false;
}
