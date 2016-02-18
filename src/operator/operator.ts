"use strict";

import { Position } from './../motion/position';

export abstract class Operator {
    /**
     * What key triggers this operator?
     */
    abstract key(): string;

    /**
     * Run this operator on a range.
     */
    abstract run(start: Position, stop: Position): Promise<void>;
}