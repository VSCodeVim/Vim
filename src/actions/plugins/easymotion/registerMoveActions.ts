import { RegisterAction } from './../../base';
import {
  EasyMotionCharMoveCommandBase,
  EasyMotionLineMoveCommandBase,
  EasyMotionWordMoveCommandBase,
  SearchByCharCommand,
  SearchByNCharCommand,
} from './easymotion.cmd';

// EasyMotion n-char-move command

@RegisterAction
class EasyMotionNCharSearchCommand extends EasyMotionCharMoveCommandBase {
  constructor() {
    super({ key: '/' }, new SearchByNCharCommand());
  }
}

// EasyMotion char-move commands

@RegisterAction
class EasyMotionTwoCharSearchCommand extends EasyMotionCharMoveCommandBase {
  constructor() {
    super({ key: '2s' }, new SearchByCharCommand({ charCount: 2 }));
  }
}

@RegisterAction
class EasyMotionTwoCharFindForwardCommand extends EasyMotionCharMoveCommandBase {
  constructor() {
    super({ key: '2f' }, new SearchByCharCommand({ charCount: 2, searchOptions: 'min' }));
  }
}

@RegisterAction
class EasyMotionTwoCharFindBackwardCommand extends EasyMotionCharMoveCommandBase {
  constructor() {
    super({ key: '2F' }, new SearchByCharCommand({ charCount: 2, searchOptions: 'max' }));
  }
}

@RegisterAction
class EasyMotionTwoCharTilCharacterForwardCommand extends EasyMotionCharMoveCommandBase {
  constructor() {
    super(
      { key: '2t' },
      new SearchByCharCommand({ charCount: 2, searchOptions: 'min', labelPosition: 'before' })
    );
  }
}

// easymotion-bd-t2

@RegisterAction
class EasyMotionTwoCharTilCharacterBidirectionalCommand extends EasyMotionCharMoveCommandBase {
  constructor() {
    super(
      { key: 'bd2t', leaderCount: 3 },
      new SearchByCharCommand({ charCount: 2, labelPosition: 'before' })
    );
  }
}

@RegisterAction
class EasyMotionTwoCharTilBackwardCommand extends EasyMotionCharMoveCommandBase {
  constructor() {
    super(
      { key: '2T' },
      new SearchByCharCommand({ charCount: 2, searchOptions: 'max', labelPosition: 'after' })
    );
  }
}

@RegisterAction
class EasyMotionSearchCommand extends EasyMotionCharMoveCommandBase {
  constructor() {
    super({ key: 's' }, new SearchByCharCommand({ charCount: 1 }));
  }
}

@RegisterAction
class EasyMotionFindForwardCommand extends EasyMotionCharMoveCommandBase {
  constructor() {
    super({ key: 'f' }, new SearchByCharCommand({ charCount: 1, searchOptions: 'min' }));
  }
}

@RegisterAction
class EasyMotionFindBackwardCommand extends EasyMotionCharMoveCommandBase {
  constructor() {
    super({ key: 'F' }, new SearchByCharCommand({ charCount: 1, searchOptions: 'max' }));
  }
}

@RegisterAction
class EasyMotionTilCharacterForwardCommand extends EasyMotionCharMoveCommandBase {
  constructor() {
    super(
      { key: 't' },
      new SearchByCharCommand({ charCount: 1, searchOptions: 'min', labelPosition: 'before' })
    );
  }
}

// easymotion-bd-t

@RegisterAction
class EasyMotionTilCharacterBidirectionalCommand extends EasyMotionCharMoveCommandBase {
  constructor() {
    super(
      { key: 'bdt', leaderCount: 3 },
      new SearchByCharCommand({ charCount: 1, labelPosition: 'before' })
    );
  }
}

@RegisterAction
class EasyMotionTilBackwardCommand extends EasyMotionCharMoveCommandBase {
  constructor() {
    super(
      { key: 'T' },
      new SearchByCharCommand({ charCount: 1, searchOptions: 'max', labelPosition: 'after' })
    );
  }
}

// EasyMotion word-move commands

@RegisterAction
class EasyMotionStartOfWordForwardsCommand extends EasyMotionWordMoveCommandBase {
  constructor() {
    super({ key: 'w' }, { searchOptions: 'min' });
  }
}

// easymotion-bd-w

@RegisterAction
class EasyMotionStartOfWordBidirectionalCommand extends EasyMotionWordMoveCommandBase {
  constructor() {
    super({ key: 'bdw', leaderCount: 3 });
  }
}

@RegisterAction
class EasyMotionEndOfWordForwardsCommand extends EasyMotionWordMoveCommandBase {
  constructor() {
    super({ key: 'e' }, { searchOptions: 'min', labelPosition: 'after' });
  }
}

// easymotion-bd-e

@RegisterAction
class EasyMotionEndOfWordBidirectionalCommand extends EasyMotionWordMoveCommandBase {
  constructor() {
    super({ key: 'bde', leaderCount: 3 }, { labelPosition: 'after' });
  }
}

@RegisterAction
class EasyMotionBeginningWordCommand extends EasyMotionWordMoveCommandBase {
  constructor() {
    super({ key: 'b' }, { searchOptions: 'max' });
  }
}

@RegisterAction
class EasyMotionEndBackwardCommand extends EasyMotionWordMoveCommandBase {
  constructor() {
    super({ key: 'ge' }, { searchOptions: 'max', labelPosition: 'after' });
  }
}

// EasyMotion line-move commands

@RegisterAction
class EasyMotionStartOfLineForwardsCommand extends EasyMotionLineMoveCommandBase {
  constructor() {
    super({ key: 'j' }, { searchOptions: 'min' });
  }
}

@RegisterAction
class EasyMotionStartOfLineBackwordsCommand extends EasyMotionLineMoveCommandBase {
  constructor() {
    super({ key: 'k' }, { searchOptions: 'max' });
  }
}

// easymotion-bd-jk

@RegisterAction
class EasyMotionStartOfLineBidirectionalCommand extends EasyMotionLineMoveCommandBase {
  constructor() {
    super({ key: 'bdjk', leaderCount: 3 });
  }
}
