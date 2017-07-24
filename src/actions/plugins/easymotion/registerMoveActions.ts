import { RegisterAction } from './../../base';
import {
  SearchByCharCommand, SearchByNCharCommand, EasyMotionCharMoveCommandBase, EasyMotionWordMoveCommandBase, EasyMotionLineMoveCommandBase
} from "./easymotion.cmd";



// EasyMotion n-char-move command

@RegisterAction
class EasyMotionNCharSearchCommand extends EasyMotionCharMoveCommandBase {
  constructor() {
    super('/', new SearchByNCharCommand());
  }
}



// EasyMotion char-move commands

@RegisterAction
class EasyMotionTwoCharSearchCommand extends EasyMotionCharMoveCommandBase {
  constructor() {
    super('2s', new SearchByCharCommand({
      charCount: 2
    }));
  }
}

@RegisterAction
class EasyMotionTwoCharFindForwardCommand extends EasyMotionCharMoveCommandBase {
  constructor() {
    super('2f', new SearchByCharCommand({
      charCount: 2,
      searchOptions: "min"
    }));
  }
}

@RegisterAction
class EasyMotionTwoCharFindBackwardCommand extends EasyMotionCharMoveCommandBase {
  constructor() {
    super('2F', new SearchByCharCommand({
      charCount: 2,
      searchOptions: "max"
    }));
  }
}

@RegisterAction
class EasyMotionTwoCharTilForwardCommand extends EasyMotionCharMoveCommandBase {
  constructor() {
    super('2t', new SearchByCharCommand({
      charCount: 2,
      searchOptions: "min",
      labelPosition: "before"
    }));
  }
}

@RegisterAction
class EasyMotionTwoCharTilBackwardCommand extends EasyMotionCharMoveCommandBase {
  constructor() {
    super('2T', new SearchByCharCommand({
      charCount: 2,
      searchOptions: "max",
      labelPosition: "after"
    }));
  }
}

@RegisterAction
class EasyMotionSearchCommand extends EasyMotionCharMoveCommandBase {
  constructor() {
    super('s', new SearchByCharCommand({
      charCount: 1
    }));
  }
}

@RegisterAction
class EasyMotionFindForwardCommand extends EasyMotionCharMoveCommandBase {
  constructor() {
    super('f', new SearchByCharCommand({
      charCount: 1,
      searchOptions: "min"
    }));
  }
}

@RegisterAction
class EasyMotionFindBackwardCommand extends EasyMotionCharMoveCommandBase {
  constructor() {
    super('F', new SearchByCharCommand({
      charCount: 1,
      searchOptions: "max"
    }));
  }
}

@RegisterAction
class EasyMotionTilForwardCommand extends EasyMotionCharMoveCommandBase {
  constructor() {
    super('t', new SearchByCharCommand({
      charCount: 1,
      searchOptions: "min",
      labelPosition: "before"
    }));
  }
}

@RegisterAction
class EasyMotionTilBackwardCommand extends EasyMotionCharMoveCommandBase {
  constructor() {
    super('T', new SearchByCharCommand({
      charCount: 1,
      searchOptions: "max",
      labelPosition: "after"
    }));
  }
}



// EasyMotion word-move commands

@RegisterAction
class EasyMotionWordCommand extends EasyMotionWordMoveCommandBase {
  constructor() {
    super('w', {
      searchOptions: "min"
    });
  }
}

@RegisterAction
class EasyMotionEndForwardCommand extends EasyMotionWordMoveCommandBase {
  constructor() {
    super('e', {
      searchOptions: "min",
      labelPosition: "after"
    });
  };
}

@RegisterAction
class EasyMotionBeginningWordCommand extends EasyMotionWordMoveCommandBase {
  constructor() {
    super('b', {
      searchOptions: "max"
    });
  }
}

@RegisterAction
class EasyMotionEndBackwardCommand extends EasyMotionWordMoveCommandBase {
  constructor() {
    super('ge', {
      searchOptions: "max",
      labelPosition: "after"
    });
  }
}



// EasyMotion line-move commands

@RegisterAction
class EasyMotionDownLinesCommand extends EasyMotionLineMoveCommandBase {
  constructor() {
    super('j', {
      searchOptions: "min"
    });
  }
}

@RegisterAction
class EasyMotionUpLinesCommand extends EasyMotionLineMoveCommandBase {
  constructor() {
    super('k', {
      searchOptions: "max"
    });
  }
}
