import * as vscode from 'vscode';
import { configuration } from './../../configuration/configuration';
import { BaseAction } from './../base';
import { Position } from 'vscode';
import { MoveRepeat, MoveRepeatReversed } from '../motion';
import { MarkerGenerator } from './easymotion/markerGenerator';
import { SneakAction } from './sneak';
import { minPosition, maxPosition } from '../../util/util';

export class SneakHighlighter {
  private highlighting: boolean = false;

  private sneak: SneakAction;

  private style: vscode.TextEditorDecorationType = this.createHighlightStyle();

  private fadeoutStyle: vscode.TextEditorDecorationType | undefined = this.createFadeoutStyle();

  private markers: Map<string, vscode.Range> = new Map();

  constructor(sneak: SneakAction) {
    this.sneak = sneak;
  }

  public setHighlighting(on: boolean) {
    this.highlighting = on;
  }

  public isHighlightingOn() {
    return this.highlighting;
  }

  private getFontColor(): string | vscode.ThemeColor {
    if (configuration.sneakHighlightFontColor) {
      return configuration.sneakHighlightFontColor;
    } else {
      return new vscode.ThemeColor('editor.background');
    }
  }

  private getBackgroundColor(): string | vscode.ThemeColor {
    if (configuration.sneakHighlightBackgroundColor) {
      return configuration.sneakHighlightBackgroundColor;
    } else {
      return new vscode.ThemeColor('editor.foreground');
    }
  }

  private getFadeoutColor(): string | vscode.ThemeColor {
    if (configuration.sneakHighlightFadeColor) {
      return configuration.sneakHighlightFadeColor;
    } else {
      return new vscode.ThemeColor('editorLineNumber.foreground');
    }
  }

  public createHighlightStyle(): vscode.TextEditorDecorationType {
    const styleForRegExp = {
      color: this.getFontColor(),
      backgroundColor: this.getBackgroundColor(),
    };

    return vscode.window.createTextEditorDecorationType(styleForRegExp);
  }

  private createFadeoutStyle(): vscode.TextEditorDecorationType | undefined {
    if (!configuration.sneakHighlightUseFadeout) {
      return;
    }

    return vscode.window.createTextEditorDecorationType({
      color: this.getFadeoutColor(),
    });
  }

  /**
   * Clear all decorations
   */
  public clearDecorations() {
    const editor = vscode.window.activeTextEditor!;
    editor.setDecorations(this.style, []);

    if (this.fadeoutStyle) {
      editor.setDecorations(this.fadeoutStyle, []);
    }
  }

  private isSneakTheLastAction(lastRecognizedAction: BaseAction | undefined): boolean {
    // we can safely check for MoveRepeat, because the code gets here only in the event when
    // the highlighting is still on (that's the condition before updateDecorations() is called)
    // therefore we are sure that if there is a repeat movement, it repeats the Sneak
    return (
      lastRecognizedAction instanceof SneakAction ||
      lastRecognizedAction instanceof MoveRepeat ||
      lastRecognizedAction instanceof MoveRepeatReversed
    );
  }

  public updateDecorations(lastRecognizedAction: BaseAction | undefined) {
    this.clearDecorations();

    if (!this.isSneakTheLastAction(lastRecognizedAction)) {
      this.highlighting = false;
      return;
    }

    const editor = vscode.window.activeTextEditor!;
    const rangesToHighlight = this.sneak.getRangesToHighlight();

    if (configuration.sneakLabelMode) {
      this.updateMarkerDecorations(editor);
    } else {
      editor.setDecorations(this.style, rangesToHighlight);
    }

    // Fadeout the background if applicable
    if (this.fadeoutStyle) {
      const visibleStart: Position = editor.visibleRanges[0].start;
      const visibleEnd: Position = editor.visibleRanges[0].end;
      const numLinesVisible = visibleEnd.subtract(visibleStart).line;

      // Fade out the visible portion of the editor and add more lines at the
      // top and the bottom to make sure that when the cursor jumps to the first match
      // every line is properly dimmed.
      const startFadeoutPos = maxPosition(new Position(0, 0), visibleStart.getUp(numLinesVisible));
      const endFadeoutPos = minPosition(
        new Position(editor.document.lineCount, 0),
        visibleEnd.getDown(numLinesVisible)
      );

      editor.setDecorations(this.fadeoutStyle, [new vscode.Range(startFadeoutPos, endFadeoutPos)]);
    }
  }

  private updateMarkerDecorations(editor: vscode.TextEditor) {
    this.generateMarkers();

    const markerHighlights: vscode.DecorationOptions[] = [];

    for (const [markerString, markerRange] of this.markers) {
      // when we don't use fadeout, we make the marker more prominent by widening the highlighting
      // when we use fadeout, the prominence is given by fading out the other text, so we don't need spaces
      const contentText = configuration.sneakHighlightUseFadeout
        ? markerString
        : ' ' + markerString + ' ';

      const renderOptions: vscode.ThemableDecorationInstanceRenderOptions = {
        before: {
          contentText,
          color: this.getFontColor(),
          backgroundColor: this.getBackgroundColor(),
        },
      };

      markerHighlights.push({
        range: markerRange,
        renderOptions: {
          dark: renderOptions,
          light: renderOptions,
        },
      });
    }

    editor.setDecorations(this.style, markerHighlights);
  }

  private generateMarkers(): void {
    const markerGenerator = new MarkerGenerator(
      this.sneak.getRangesToHighlight().length,
      configuration.sneakLabelTargets
    );

    let index: number = 0;

    for (const range of this.sneak.getRangesToHighlight()) {
      const marker = markerGenerator.generateMarker(
        index,
        new Position(range.start.line, range.start.character),
        false
      );

      if (marker) {
        this.markers.set(marker.name, new vscode.Range(range.start, range.start));
        index++;
      } else {
        break;
      }
    }
  }

  public getMarkPosition(marker: string): Position | undefined {
    const markerRange = this.markers.get(marker);

    if (!markerRange) {
      return undefined;
    }

    return new Position(markerRange.start.line, markerRange.start.character);
  }
}
