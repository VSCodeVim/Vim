import { RegisterAction, RegisterPluginAction } from './../../base';
import {
  EasyMotionCharMoveCommandBase,
  EasyMotionLineMoveCommandBase,
  EasyMotionWordMoveCommandBase,
  SearchByCharCommand,
  SearchByNCharCommand,
} from './easymotion.cmd';

// EasyMotion n-char-move command

@RegisterPluginAction
class EasyMotionNCharSearchCommand extends EasyMotionCharMoveCommandBase {
  keys = ['<(easymotion-sn)>'];
  constructor() {
    super({ key: '/' }, new SearchByNCharCommand());
  }
}

// EasyMotion char-move commands

@RegisterPluginAction
class EasyMotionTwoCharSearchCommand extends EasyMotionCharMoveCommandBase {
  keys = ['<(easymotion-s2)>'];
  constructor() {
    super({ key: '2s' }, new SearchByCharCommand({ charCount: 2 }));
  }
}

@RegisterPluginAction
class EasyMotionTwoCharFindForwardCommand extends EasyMotionCharMoveCommandBase {
  keys = ['<(easymotion-f2)>'];
  constructor() {
    super({ key: '2f' }, new SearchByCharCommand({ charCount: 2, searchOptions: 'min' }));
  }
}

@RegisterPluginAction
class EasyMotionTwoCharFindBackwardCommand extends EasyMotionCharMoveCommandBase {
  keys = ['<(easymotion-F2)>'];
  constructor() {
    super({ key: '2F' }, new SearchByCharCommand({ charCount: 2, searchOptions: 'max' }));
  }
}

@RegisterPluginAction
class EasyMotionTwoCharTilCharacterForwardCommand extends EasyMotionCharMoveCommandBase {
  keys = ['<(easymotion-t2)>'];
  constructor() {
    super(
      { key: '2t' },
      new SearchByCharCommand({ charCount: 2, searchOptions: 'min', labelPosition: 'before' })
    );
  }
}

// easymotion-bd-t2

@RegisterPluginAction
class EasyMotionTwoCharTilCharacterBidirectionalCommand extends EasyMotionCharMoveCommandBase {
  keys = ['<(easymotion-bd-t2)>'];
  constructor() {
    super(
      { key: 'bd2t', leaderCount: 3 },
      new SearchByCharCommand({ charCount: 2, labelPosition: 'before' })
    );
  }
}

@RegisterPluginAction
class EasyMotionTwoCharTilBackwardCommand extends EasyMotionCharMoveCommandBase {
  keys = ['<(easymotion-T2)>'];
  constructor() {
    super(
      { key: '2T' },
      new SearchByCharCommand({ charCount: 2, searchOptions: 'max', labelPosition: 'after' })
    );
  }
}

@RegisterPluginAction
class EasyMotionSearchCommand extends EasyMotionCharMoveCommandBase {
  keys = ['<(easymotion-s)>'];
  constructor() {
    super({ key: 's' }, new SearchByCharCommand({ charCount: 1 }));
  }
}

@RegisterPluginAction
class EasyMotionFindForwardCommand extends EasyMotionCharMoveCommandBase {
  keys = ['<(easymotion-f)>'];
  constructor() {
    super({ key: 'f' }, new SearchByCharCommand({ charCount: 1, searchOptions: 'min' }));
  }
}

@RegisterPluginAction
class EasyMotionFindBackwardCommand extends EasyMotionCharMoveCommandBase {
  keys = ['<(easymotion-F)>'];
  constructor() {
    super({ key: 'F' }, new SearchByCharCommand({ charCount: 1, searchOptions: 'max' }));
  }
}

@RegisterPluginAction
class EasyMotionTilCharacterForwardCommand extends EasyMotionCharMoveCommandBase {
  keys = ['<(easymotion-t)>'];
  constructor() {
    super(
      { key: 't' },
      new SearchByCharCommand({ charCount: 1, searchOptions: 'min', labelPosition: 'before' })
    );
  }
}

// easymotion-bd-t

@RegisterPluginAction
class EasyMotionTilCharacterBidirectionalCommand extends EasyMotionCharMoveCommandBase {
  keys = ['<(easymotion-bd-t)>'];
  constructor() {
    super(
      { key: 'bdt', leaderCount: 3 },
      new SearchByCharCommand({ charCount: 1, labelPosition: 'before' })
    );
  }
}

@RegisterPluginAction
class EasyMotionTilBackwardCommand extends EasyMotionCharMoveCommandBase {
  keys = ['<(easymotion-T)>'];
  constructor() {
    super(
      { key: 'T' },
      new SearchByCharCommand({ charCount: 1, searchOptions: 'max', labelPosition: 'after' })
    );
  }
}

// EasyMotion word-move commands

@RegisterPluginAction
class EasyMotionStartOfWordForwardsCommand extends EasyMotionWordMoveCommandBase {
  keys = ['<(easymotion-w)>'];
  constructor() {
    super({ key: 'w' }, { searchOptions: 'min' });
  }
}

// easymotion-bd-w

@RegisterPluginAction
class EasyMotionStartOfWordBidirectionalCommand extends EasyMotionWordMoveCommandBase {
  keys = ['<(easymotion-bd-w)>'];
  constructor() {
    super({ key: 'bdw', leaderCount: 3 });
  }
}

@RegisterPluginAction
class EasyMotionLineForward extends EasyMotionWordMoveCommandBase {
  keys = ['<(easymotion-lineforward)>'];
  constructor() {
    super({ key: 'l' }, { jumpToAnywhere: true, searchOptions: 'min', labelPosition: 'after' });
  }
}

@RegisterPluginAction
class EasyMotionLineBackward extends EasyMotionWordMoveCommandBase {
  keys = ['<(easymotion-linebackward)>'];
  constructor() {
    super({ key: 'h' }, { jumpToAnywhere: true, searchOptions: 'max', labelPosition: 'after' });
  }
}

// easymotion "JumpToAnywhere" motion

@RegisterPluginAction
class EasyMotionJumpToAnywhereCommand extends EasyMotionWordMoveCommandBase {
  keys = ['<(easymotion-jumptoanywhere)>'];
  constructor() {
    super({ key: 'j', leaderCount: 3 }, { jumpToAnywhere: true, labelPosition: 'after' });
  }
}

@RegisterPluginAction
class EasyMotionEndOfWordForwardsCommand extends EasyMotionWordMoveCommandBase {
  keys = ['<(easymotion-e)>'];
  constructor() {
    super({ key: 'e' }, { searchOptions: 'min', labelPosition: 'after' });
  }
}

// easymotion-bd-e

@RegisterPluginAction
class EasyMotionEndOfWordBidirectionalCommand extends EasyMotionWordMoveCommandBase {
  keys = ['<(easymotion-bd-e)>'];
  constructor() {
    super({ key: 'bde', leaderCount: 3 }, { labelPosition: 'after' });
  }
}

@RegisterPluginAction
class EasyMotionBeginningWordCommand extends EasyMotionWordMoveCommandBase {
  keys = ['<(easymotion-b)>'];
  constructor() {
    super({ key: 'b' }, { searchOptions: 'max' });
  }
}

@RegisterPluginAction
class EasyMotionEndBackwardCommand extends EasyMotionWordMoveCommandBase {
  keys = ['<(easymotion-ge)>'];
  constructor() {
    super({ key: 'ge' }, { searchOptions: 'max', labelPosition: 'after' });
  }
}

// EasyMotion line-move commands

@RegisterPluginAction
class EasyMotionStartOfLineForwardsCommand extends EasyMotionLineMoveCommandBase {
  keys = ['<(easymotion-j)>'];
  constructor() {
    super({ key: 'j' }, { searchOptions: 'min' });
  }
}

@RegisterPluginAction
class EasyMotionStartOfLineBackwordsCommand extends EasyMotionLineMoveCommandBase {
  keys = ['<(easymotion-k)>'];
  constructor() {
    super({ key: 'k' }, { searchOptions: 'max' });
  }
}

// easymotion-bd-jk

@RegisterPluginAction
class EasyMotionStartOfLineBidirectionalCommand extends EasyMotionLineMoveCommandBase {
  keys = ['<(easymotion-bd-jk)>'];
  constructor() {
    super({ key: 'bdjk', leaderCount: 3 });
  }
}
