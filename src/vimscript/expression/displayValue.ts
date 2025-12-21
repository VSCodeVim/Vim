import { Value } from './types';

export function displayValue(value: Value): string {
  return _displayValue(value, true);
}

function _displayValue(value: Value, topLevel = false): string {
  switch (value.type) {
    case 'number':
      return value.value.toString();
    case 'float': {
      // TODO: this is incorrect for float with exponent
      const result = value.value.toFixed(6).replace(/0*$/, '');
      if (result.endsWith('.')) {
        return result + '0';
      }
      return result;
    }
    case 'string':
      return topLevel ? value.value : `'${value.value.replace("'", "''")}'`;
    case 'list':
      return `[${value.items.map((v) => _displayValue(v, false)).join(', ')}]`;
    case 'dictionary':
      return `{${[...value.items]
        .map(([k, v]) => `'${k}': ${_displayValue(v, false)}`)
        .join(', ')}}`;
    case 'funcref':
      if (!value.arglist?.items.length) {
        if (value.dict) {
          return `function('${value.name}', ${_displayValue(value.dict)})`;
        }
        return value.name;
      } else {
        if (value.dict) {
          return `function('${value.name}', ${_displayValue(value.arglist)}, ${_displayValue(
            value.dict,
          )})`;
        }
        return `function('${value.name}', ${_displayValue(value.arglist)})`;
      }
    case 'blob':
      return (
        '0z' +
        [...new Uint8Array(value.data)]
          .map((byte) => byte.toString(16).padStart(2, '0'))
          .join('')
          .toUpperCase()
      );
  }
}
