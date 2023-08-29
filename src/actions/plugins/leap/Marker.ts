import { Match } from './match';
import * as vscode from 'vscode';
import { configuration } from './../../../configuration/configuration';
import { LeapSearchDirection } from './leap';

export class Marker {
  private decoration: MarkerDecoration;
  label: string = '';
  searchString: string;
  matchPosition: vscode.Position;
  direction: LeapSearchDirection;
  constructor({ position, searchString, direction }: Match, editor: vscode.TextEditor) {
    this.matchPosition = position;
    this.searchString = searchString;
    this.direction = direction;
    this.decoration = new MarkerDecoration(editor, this);
  }

  get prefix() {
    return this.label.length > 1 ? this.label[0] : '';
  }

  deletePrefix() {
    this.label = this.label.slice(-1);
  }

  update() {
    this.show();
  }

  show() {
    this.decoration.show();
  }

  dispose() {
    this.decoration.dispose();
  }
}

class MarkerDecoration {
  private editor: vscode.TextEditor;
  private marker: Marker;
  private range: vscode.Range | undefined;
  private textEditorDecorationType: vscode.TextEditorDecorationType;

  constructor(editor: vscode.TextEditor, marker: Marker) {
    this.editor = editor;
    this.marker = marker;
    this.textEditorDecorationType = vscode.window.createTextEditorDecorationType({});
    this.createRange();
  }

  private createRange() {
    let position = this.marker.matchPosition;
    if (configuration.leap.showMarkerPosition === 'after') {
      position = new vscode.Position(position.line, position.character + 2);
    }
    this.range = new vscode.Range(
      position.line,
      position.character,
      position.line,
      position.character
    );
  }

  private calcDecorationBackgroundColor() {
    const labels = configuration.leap.labels.split('').reverse().join('');

    let index = 0;
    if (this.marker.prefix) {
      const prefixIndex = labels.indexOf(this.marker.prefix);
      if (prefixIndex !== -1) {
        index = (prefixIndex + 1) % 2 === 0 ? 0 : 1;
      }
    }

    return configuration.leap.marker.backgroundColors[index]
  }

  show() {
    this.editor.setDecorations(this.textEditorDecorationType, this.getRangesOrOptions());
  }

  private getRangesOrOptions() {
    const secondCharRenderOptions: vscode.ThemableDecorationInstanceRenderOptions = {
      before: {
        contentText: this.marker.label,
        backgroundColor: this.calcDecorationBackgroundColor(),
        color: configuration.leap.marker.charColor,
        margin: `0 -1ch 0 0;
            position: absolute;
            font-weight: normal;`,
        height: '100%',
      },
    };

    return [
      {
        range: this.range!,
        renderOptions: {
          dark: secondCharRenderOptions,
          light: secondCharRenderOptions,
        },
      },
    ];
  }

  dispose() {
    this.editor.setDecorations(this.textEditorDecorationType, []);
    this.textEditorDecorationType.dispose();
  }
}

export function generateMarkerNames(count: number) {
  const leapLabels = configuration.leap.labels;
  const result = [];

  const prefixCount = Math.floor(count / leapLabels.length);
  const prefixes = leapLabels
    .slice(0 - prefixCount)
    .split('')
    .reverse()
    .join('');

  const firstGroupValues = leapLabels.slice(0, leapLabels.length - prefixCount);
  const secondGroupValues = leapLabels;

  for (let i = 0; i < count; i++) {
    let value;
    let prefixIndex;
    const isFirstGroup = i < firstGroupValues.length;
    if (isFirstGroup) {
      value = firstGroupValues[i % firstGroupValues.length];
      prefixIndex = Math.floor(i / firstGroupValues.length);
    } else {
      const ii = i - firstGroupValues.length;
      value = secondGroupValues[ii % secondGroupValues.length];
      prefixIndex = Math.floor(ii / secondGroupValues.length) + 1;
    }

    const prefixValue = prefixIndex === 0 ? '' : prefixes[prefixIndex - 1];
    result.push(prefixValue + value);
  }

  return result;
}

export function createMarker(match: Match, editor: vscode.TextEditor) {
  return new Marker(match, editor);
}
