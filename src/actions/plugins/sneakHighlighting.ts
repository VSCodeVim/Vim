import * as vscode from 'vscode';
import { configuration } from './../../configuration/configuration';
import { BaseAction } from './../base';
import { Position } from 'vscode';
import { MoveRepeat, MoveRepeatReversed } from '../motion';
import { MarkerGenerator } from './easymotion/markerGenerator';
import { SneakAction } from './sneak';
import { minPosition, maxPosition } from '../../util/util';
import { TextEditor } from 'src/textEditor';

export class SneakHighlighter {
  private highlightingOn: boolean = false;

  private editor: vscode.TextEditor;

  private markerStyle: vscode.TextEditorDecorationType = this.createMarkerStyle();

  private fadeoutStyle: vscode.TextEditorDecorationType | undefined = this.createFadeoutStyle();

  private markers: Map<string, vscode.Range> = new Map();

  constructor(editor: vscode.TextEditor) {
    this.editor = editor;
  }

  public setHighlightingOn(on: boolean) {
    this.highlightingOn = on;
  }

  public isHighlightingOn() {
    return this.highlightingOn;
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

  public createMarkerStyle(): vscode.TextEditorDecorationType {
    const styleForMarker = {
      color: this.getFontColor(),
      backgroundColor: this.getBackgroundColor(),
    };

    return vscode.window.createTextEditorDecorationType(styleForMarker);
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
    this.editor.setDecorations(this.markerStyle, []);

    if (this.fadeoutStyle) {
      this.editor.setDecorations(this.fadeoutStyle, []);
    }

    this.setHighlightingOn(false);
  }

  public drawDecorations(labelModeActivated: boolean) {
    this.clearDecorations();
    this.setHighlightingOn(true);

    // Fadeout the background if applicable
    if (this.fadeoutStyle) {
      this.drawFadeoutBackground();
    }

    if (labelModeActivated) {
      this.drawLabelMode();
    } else {
      this.drawNonLabelMode();
    }
  }

  private drawFadeoutBackground() {
    if (!this.fadeoutStyle) {
      return;
    }

    const visibleStart: Position = this.editor.visibleRanges[0].start;
    const visibleEnd: Position = this.editor.visibleRanges[0].end;
    const numLinesVisible = visibleEnd.subtract(visibleStart).line;

    // Fade out the visible portion of the editor and add more lines at the
    // top and the bottom to make sure that when the cursor jumps to the first match
    // every line is properly dimmed.
    const startFadeoutPos = maxPosition(new Position(0, 0), visibleStart.getUp(numLinesVisible));
    const endFadeoutPos = minPosition(
      new Position(this.editor.document.lineCount, 0),
      visibleEnd.getDown(numLinesVisible)
    );

    this.editor.setDecorations(this.fadeoutStyle, [
      new vscode.Range(startFadeoutPos, endFadeoutPos),
    ]);
  }

  public drawNonLabelMode() {
    const rangesToHighlight = [...this.markers.values()];
    this.editor.setDecorations(this.markerStyle, rangesToHighlight);
  }

  public drawLabelMode() {
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
        range: new vscode.Range(markerRange.start, markerRange.start),
        renderOptions: {
          dark: renderOptions,
          light: renderOptions,
        },
      });
    }

    this.editor.setDecorations(this.markerStyle, markerHighlights);
  }

  public generateMarkersAndDraw(
    rangesToHighlight: vscode.Range[],
    labelModeActivated: boolean,
    editor: vscode.TextEditor
  ): void {
    this.markers = new Map();

    // We need to update the editor because the same document can change textEditor
    // on settings reload and it messes with text decorations.
    this.editor = editor;

    const markerGenerator = new MarkerGenerator(
      rangesToHighlight.length,
      configuration.sneakLabelTargets
    );

    let index: number = 0;

    for (const range of rangesToHighlight) {
      const marker = markerGenerator.generateMarker(index, range.start, false);

      if (marker) {
        this.markers.set(marker.name, new vscode.Range(range.start, range.end));
        index++;
      } else {
        break;
      }
    }

    this.drawDecorations(labelModeActivated);
  }

  public getMarkPosition(marker: string): Position | undefined {
    const markerRange = this.markers.get(marker);

    if (!markerRange) {
      return undefined;
    }

    return markerRange.start;
  }
}
