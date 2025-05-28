import { newTest } from '../testSimplifier';

suite(':sort', () => {
  newTest({
    title: 'Sort whole file, ascending',
    start: ['Eggplant', 'dragonfruit', 'ap|ple', 'Banana', 'cabbage'],
    keysPressed: ':sort\n',
    end: ['|Banana', 'Eggplant', 'apple', 'cabbage', 'dragonfruit'],
  });

  newTest({
    title: 'Sort whole file, ascending, ignore case',
    start: ['Eggplant', 'dragonfruit', 'ap|ple', 'Banana', 'cabbage'],
    keysPressed: ':sort i\n',
    end: ['|apple', 'Banana', 'cabbage', 'dragonfruit', 'Eggplant'],
  });

  newTest({
    title: 'Sort whole file, descending',
    start: ['Eggplant', 'dragonfruit', 'ap|ple', 'Banana', 'cabbage'],
    keysPressed: ':sort!\n',
    end: ['|dragonfruit', 'cabbage', 'apple', 'Eggplant', 'Banana'],
  });

  newTest({
    title: 'Sort whole file, descending, ignore case',
    start: ['Eggplant', 'dragonfruit', 'ap|ple', 'Banana', 'cabbage'],
    keysPressed: ':sort! i\n',
    end: ['|Eggplant', 'dragonfruit', 'cabbage', 'Banana', 'apple'],
  });

  newTest({
    title: 'Sort range, ascending',
    start: ['Eggplant', 'dragonfruit', 'ap|ple', 'Banana', 'cabbage'],
    keysPressed: ':2,4sort\n',
    end: ['Eggplant', '|Banana', 'apple', 'dragonfruit', 'cabbage'],
  });

  newTest({
    title: 'Sort range, ascending, ignore case',
    start: ['Eggplant', 'dragonfruit', 'ap|ple', 'Banana', 'cabbage'],
    keysPressed: ':2,4sort i\n',
    end: ['Eggplant', '|apple', 'Banana', 'dragonfruit', 'cabbage'],
  });

  newTest({
    title: 'Sort range, descending',
    start: ['Eggplant', 'dragonfruit', 'ap|ple', 'Banana', 'cabbage'],
    keysPressed: ':2,4sort!\n',
    end: ['Eggplant', '|dragonfruit', 'apple', 'Banana', 'cabbage'],
  });

  newTest({
    title: 'Sort range, descending, ignore case',
    start: ['Eggplant', 'dragonfruit', 'ap|ple', 'Banana', 'cabbage'],
    keysPressed: ':2,4sort! i\n',
    end: ['Eggplant', '|dragonfruit', 'Banana', 'apple', 'cabbage'],
  });

  newTest({
    title: 'Sort whole file, ascending, unique',
    start: ['Eggplant', 'apple', 'Banana', 'dragonfruit', 'ap|ple', 'Banana', 'cabbage', 'apple'],
    keysPressed: ':sort u\n',
    end: ['|Banana', 'Eggplant', 'apple', 'cabbage', 'dragonfruit'],
  });

  newTest({
    title: 'Sort whole file, ascending, ignore case, unique',
    start: ['Eggplant', 'Apple', 'banana', 'dragonfruit', 'ap|ple', 'Banana', 'cabbage', 'apple'],
    keysPressed: ':sort iu\n',
    end: ['|Apple', 'banana', 'cabbage', 'dragonfruit', 'Eggplant'],
  });

  newTest({
    title: 'Sort whole file, numeric',
    start: ['2', '|10', '1', '2'],
    keysPressed: ':sort n\n',
    end: ['|1', '2', '2', '10'],
  });

  newTest({
    title: 'Sort range, numeric',
    start: ['2', '|10', '1', '2', '-1', '5'],
    keysPressed: ':2,4sort n\n',
    end: ['2', '|1', '2', '10', '-1', '5'],
  });

  newTest({
    title: 'Sort range descending, numeric',
    start: ['2', '|10', '1', '2', '-1', '5'],
    keysPressed: ':2,5sort! n\n',
    end: ['2', '|10', '2', '1', '-1', '5'],
  });

  newTest({
    title: 'Sort whole file ascending, numeric mixed with ascii',
    start: ['banana2', 'apple|10', 'cabbage1', 'App2le'],
    keysPressed: ':sort n\n',
    end: ['|cabbage1', 'banana2', 'App2le', 'apple10'],
  });

  newTest({
    title: 'Sort whole file descending, numeric mixed with ascii',
    start: ['banana2', 'apple|10', 'cabbage1', 'App2le'],
    keysPressed: ':sort! n\n',
    end: ['|apple10', 'App2le', 'banana2', 'cabbage1'],
  });
});
