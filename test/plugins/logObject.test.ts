import { cleanUpWorkspace, setupWorkspace } from '../testUtils';
import { Configuration } from '../testConfiguration';
import { newTest } from '../testSimplifier';

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceAll(str: string, find: string, replace: string) {
  return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

suite('logObject plugin', () => {
  const configuration = new Configuration();
  setup(async () => {
    configuration.logObject = true;
    await setupWorkspace(configuration, '.js');
  });

  teardown(cleanUpWorkspace);

  const logObjectTemplate = configuration.logObjectTemplate;
  let logMessage = '';

  logMessage = replaceAll(logObjectTemplate, '{object}', 'myIterator');
  newTest({
    title: "'<leader>liw' generates a console log from the target word",
    start: ['<div>{getContent(myArray[myIte|rator].myProperty)}</div>'],
    keysPressed: '<leader>liw',
    end: ['<div>{getContent(myArray[myIterator].myProperty)}</div>', '|' + logMessage],
  });

  logMessage = replaceAll(logObjectTemplate, '{object}', 'myIterator');
  newTest({
    title: "'<leader>li[' generates a console log from the content of []",
    start: ['<div>{getContent(myArray[myIte|rator].myProperty)}</div>'],
    keysPressed: '<leader>li[',
    end: ['<div>{getContent(myArray[myIterator].myProperty)}</div>', '|' + logMessage],
  });

  logMessage = replaceAll(logObjectTemplate, '{object}', 'myArray[myIterator].myProperty');
  newTest({
    title: "'<leader>li(' generates a console log from the content of ()",
    start: ['<div>{getContent(myArray[myIte|rator].myProperty)}</div>'],
    keysPressed: '<leader>li(',
    end: ['<div>{getContent(myArray[myIterator].myProperty)}</div>', '|' + logMessage],
  });

  logMessage = replaceAll(
    logObjectTemplate,
    '{object}',
    'getContent(myArray[myIterator].myProperty)'
  );
  newTest({
    title: "'<leader>li{' generates a console log from the content of {}",
    start: ['<div>{getContent(myArray[myIte|rator].myProperty)}</div>'],
    keysPressed: '<leader>li{',
    end: ['<div>{getContent(myArray[myIterator].myProperty)}</div>', '|' + logMessage],
  });

  logMessage = replaceAll(
    logObjectTemplate,
    '{object}',
    '{getContent(myArray[myIterator].myProperty)}'
  );
  newTest({
    title:
      "'<leader>lit' generates a console log from the content between opening and closing tags",
    start: ['<div>{getContent(myArray[myIte|rator].myProperty)}</div>'],
    keysPressed: '<leader>lit',
    end: ['<div>{getContent(myArray[myIterator].myProperty)}</div>', '|' + logMessage],
  });
});
