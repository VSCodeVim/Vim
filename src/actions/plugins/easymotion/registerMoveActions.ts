import { RegisterAction, RegisterPluginAction } from './../../base';
import {
  EasyMotionCharMoveCommandBase,
  EasyMotionLineMoveCommandBase,
  EasyMotionWordMoveCommandBase,
  SearchByCharCommand,
  SearchByNCharCommand,
} from './easymotion.cmd';

// EasyMotion n-char-move command

@RegisterPluginAction('easymotion')
class EasyMotionNCharSearchCommand extends EasyMotionCharMoveCommandBase {
  keys = ['<Plug>(easymotion-sn)'];
  constructor() {
    super({ key: '/' }, new SearchByNCharCommand());
  }
}

// EasyMotion char-move commands

@RegisterPluginAction('easymotion')
class EasyMotionTwoCharSearchCommand extends EasyMotionCharMoveCommandBase {
  keys = ['<Plug>(easymotion-s2)'];
  constructor() {
    super({ key: '2s' }, new SearchByCharCommand({ charCount: 2 }));
  }
}

@RegisterPluginAction('easymotion')
class EasyMotionTwoCharFindForwardCommand extends EasyMotionCharMoveCommandBase {
  keys = ['<Plug>(easymotion-f2)'];
  constructor() {
    super({ key: '2f' }, new SearchByCharCommand({ charCount: 2, searchOptions: 'min' }));
  }
}

@RegisterPluginAction('easymotion')
class EasyMotionTwoCharFindBackwardCommand extends EasyMotionCharMoveCommandBase {
  keys = ['<Plug>(easymotion-F2)'];
  constructor() {
    super({ key: '2F' }, new SearchByCharCommand({ charCount: 2, searchOptions: 'max' }));
  }
}

@RegisterPluginAction('easymotion')
class EasyMotionTwoCharTilCharacterForwardCommand extends EasyMotionCharMoveCommandBase {
  keys = ['<Plug>(easymotion-t2)'];
  constructor() {
    super(
      { key: '2t' },
      new SearchByCharCommand({ charCount: 2, searchOptions: 'min', labelPosition: 'before' })
    );
  }
}

// easymotion-bd-t2

@RegisterPluginAction('easymotion')
class EasyMotionTwoCharTilCharacterBidirectionalCommand extends EasyMotionCharMoveCommandBase {
  keys = ['<Plug>(easymotion-bd-t2)'];
  constructor() {
    super(
      { key: 'bd2t', leaderCount: 3 },
      new SearchByCharCommand({ charCount: 2, labelPosition: 'before' })
    );
  }
}

@RegisterPluginAction('easymotion')
class EasyMotionTwoCharTilBackwardCommand extends EasyMotionCharMoveCommandBase {
  keys = ['<Plug>(easymotion-T2)'];
  constructor() {
    super(
      { key: '2T' },
      new SearchByCharCommand({ charCount: 2, searchOptions: 'max', labelPosition: 'after' })
    );
  }
}

@RegisterPluginAction('easymotion')
class EasyMotionSearchCommand extends EasyMotionCharMoveCommandBase {
  keys = ['<Plug>(easymotion-s)'];
  constructor() {
    super({ key: 's' }, new SearchByCharCommand({ charCount: 1 }));
  }
}

@RegisterPluginAction('easymotion')
class EasyMotionFindForwardCommand extends EasyMotionCharMoveCommandBase {
  keys = ['<Plug>(easymotion-f)'];
  constructor() {
    super({ key: 'f' }, new SearchByCharCommand({ charCount: 1, searchOptions: 'min' }));
  }
}

@RegisterPluginAction('easymotion')
class EasyMotionFindBackwardCommand extends EasyMotionCharMoveCommandBase {
  keys = ['<Plug>(easymotion-F)'];
  constructor() {
    super({ key: 'F' }, new SearchByCharCommand({ charCount: 1, searchOptions: 'max' }));
  }
}

@RegisterPluginAction('easymotion')
class EasyMotionTilCharacterForwardCommand extends EasyMotionCharMoveCommandBase {
  keys = ['<Plug>(easymotion-t)'];
  constructor() {
    super(
      { key: 't' },
      new SearchByCharCommand({ charCount: 1, searchOptions: 'min', labelPosition: 'before' })
    );
  }
}

// easymotion-bd-t

@RegisterPluginAction('easymotion')
class EasyMotionTilCharacterBidirectionalCommand extends EasyMotionCharMoveCommandBase {
  keys = ['<Plug>(easymotion-bd-t)'];
  constructor() {
    super(
      { key: 'bdt', leaderCount: 3 },
      new SearchByCharCommand({ charCount: 1, labelPosition: 'before' })
    );
  }
}

@RegisterPluginAction('easymotion')
class EasyMotionTilBackwardCommand extends EasyMotionCharMoveCommandBase {
  keys = ['<Plug>(easymotion-T)'];
  constructor() {
    super(
      { key: 'T' },
      new SearchByCharCommand({ charCount: 1, searchOptions: 'max', labelPosition: 'after' })
    );
  }
}

// EasyMotion word-move commands

@RegisterPluginAction('easymotion')
class EasyMotionStartOfWordForwardsCommand extends EasyMotionWordMoveCommandBase {
  keys = ['<Plug>(easymotion-w)'];
  constructor() {
    super({ key: 'w' }, { searchOptions: 'min' });
  }
}

// easymotion-bd-w

@RegisterPluginAction('easymotion')
class EasyMotionStartOfWordBidirectionalCommand extends EasyMotionWordMoveCommandBase {
  keys = ['<Plug>(easymotion-bd-w)'];
  constructor() {
    super({ key: 'bdw', leaderCount: 3 });
  }
}

@RegisterPluginAction('easymotion')
class EasyMotionLineForward extends EasyMotionWordMoveCommandBase {
  keys = ['<Plug>(easymotion-lineforward)'];
  constructor() {
    super({ key: 'l' }, { jumpToAnywhere: true, searchOptions: 'min', labelPosition: 'after' });
  }
}

@RegisterPluginAction('easymotion')
class EasyMotionLineBackward extends EasyMotionWordMoveCommandBase {
  keys = ['<Plug>(easymotion-linebackward)'];
  constructor() {
    super({ key: 'h' }, { jumpToAnywhere: true, searchOptions: 'max', labelPosition: 'after' });
  }
}

// easymotion "JumpToAnywhere" motion

@RegisterPluginAction('easymotion')
class EasyMotionJumpToAnywhereCommand extends EasyMotionWordMoveCommandBase {
  keys = ['<Plug>(easymotion-jumptoanywhere)'];
  constructor() {
    super({ key: 'j', leaderCount: 3 }, { jumpToAnywhere: true, labelPosition: 'after' });
  }
}

@RegisterPluginAction('easymotion')
class EasyMotionEndOfWordForwardsCommand extends EasyMotionWordMoveCommandBase {
  keys = ['<Plug>(easymotion-e)'];
  constructor() {
    super({ key: 'e' }, { searchOptions: 'min', labelPosition: 'after' });
  }
}

// easymotion-bd-e

@RegisterPluginAction('easymotion')
class EasyMotionEndOfWordBidirectionalCommand extends EasyMotionWordMoveCommandBase {
  keys = ['<Plug>(easymotion-bd-e)'];
  constructor() {
    super({ key: 'bde', leaderCount: 3 }, { labelPosition: 'after' });
  }
}

@RegisterPluginAction('easymotion')
class EasyMotionBeginningWordCommand extends EasyMotionWordMoveCommandBase {
  keys = ['<Plug>(easymotion-b)'];
  constructor() {
    super({ key: 'b' }, { searchOptions: 'max' });
  }
}

@RegisterPluginAction('easymotion')
class EasyMotionEndBackwardCommand extends EasyMotionWordMoveCommandBase {
  keys = ['<Plug>(easymotion-ge)'];
  constructor() {
    super({ key: 'ge' }, { searchOptions: 'max', labelPosition: 'after' });
  }
}

// EasyMotion line-move commands

@RegisterPluginAction('easymotion')
class EasyMotionStartOfLineForwardsCommand extends EasyMotionLineMoveCommandBase {
  keys = ['<Plug>(easymotion-j)'];
  constructor() {
    super({ key: 'j' }, { searchOptions: 'min' });
  }
}

@RegisterPluginAction('easymotion')
class EasyMotionStartOfLineBackwordsCommand extends EasyMotionLineMoveCommandBase {
  keys = ['<Plug>(easymotion-k)'];
  constructor() {
    super({ key: 'k' }, { searchOptions: 'max' });
  }
}

// easymotion-bd-jk

@RegisterPluginAction('easymotion')
class EasyMotionStartOfLineBidirectionalCommand extends EasyMotionLineMoveCommandBase {
  keys = ['<Plug>(easymotion-bd-jk)'];
  constructor() {
    super({ key: 'bdjk', leaderCount: 3 });
  }
}
