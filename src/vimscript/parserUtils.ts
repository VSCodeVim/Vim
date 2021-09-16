import { Parser, regexp } from 'parsimmon';

export const numberParser: Parser<number> = regexp(/\d+/).map((num) => Number.parseInt(num, 10));
