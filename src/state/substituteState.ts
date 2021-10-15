import { Pattern } from '../vimscript/pattern';

/**
 * State involved with Substitution commands (:s).
 */
export class SubstituteState {
  /**
   * The last pattern searched for in the substitution
   */
  public searchPattern: Pattern | undefined;

  /**
   * The last replacement string in the substitution
   */
  public replaceString: string;

  constructor(searchPattern: Pattern | undefined, replaceString: string) {
    this.searchPattern = searchPattern;
    this.replaceString = replaceString;
  }
}
