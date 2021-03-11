export function getAllPositions(line: string, regex: RegExp): number[] {
  const positions: number[] = [];
  let result = regex.exec(line);

  while (result) {
    positions.push(result.index);

    // Handles the case where an empty string match causes lastIndex not to advance,
    // which gets us in an infinite loop.
    if (result.index === regex.lastIndex) {
      regex.lastIndex++;
    }
    result = regex.exec(line);
  }

  return positions;
}

export function getAllEndPositions(line: string, regex: RegExp): number[] {
  const positions: number[] = [];
  let result = regex.exec(line);

  while (result) {
    if (result[0].length) {
      positions.push(result.index + result[0].length - 1);
    }

    // Handles the case where an empty string match causes lastIndex not to advance,
    // which gets us in an infinite loop.
    if (result.index === regex.lastIndex) {
      regex.lastIndex++;
    }
    result = regex.exec(line);
  }

  return positions;
}
