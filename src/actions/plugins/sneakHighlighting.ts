import {
  DecorationOptions,
  Position,
  Range,
  TextEditor,
  TextEditorDecorationType,
  ThemableDecorationInstanceRenderOptions,
  ThemeColor,
  window,
} from 'vscode';
import { configuration } from './../../configuration/configuration';
import { BaseAction } from './../base';
import { MoveRepeat, MoveRepeatReversed } from '../motion';
import { MarkerGenerator } from './easymotion/markerGenerator';
import { SneakAction } from './sneak';

export class SneakHighlighter {
  public isHighlightingOn: boolean = false;

  private sneak: SneakAction;

  private style: TextEditorDecorationType = this.createHighlightStyle();

  private fadeoutStyle: TextEditorDecorationType | undefined = this.createFadeoutStyle();

  private markers: Map<string, Range> = new Map();

  constructor(sneak: SneakAction) {
    this.sneak = sneak;
  }

  private getFontColor(): string | ThemeColor {
    if (configuration.sneakHighlightFontColor) {
      return configuration.sneakHighlightFontColor;
    } else {
      return new ThemeColor('editor.background');
    }
  }

  private getBackgroundColor(): string | ThemeColor {
    if (configuration.sneakHighlightBackgroundColor) {
      return configuration.sneakHighlightBackgroundColor;
    } else {
      return new ThemeColor('editor.foreground');
    }
  }

  private getFadeoutColor(): string | ThemeColor {
    if (configuration.sneakHighlightFadeColor) {
      return configuration.sneakHighlightFadeColor;
    } else {
      return new ThemeColor('editorLineNumber.foreground');
    }
  }

  public createHighlightStyle(): TextEditorDecorationType {
    const styleForRegExp = {
      color: this.getFontColor(),
      backgroundColor: this.getBackgroundColor(),
    };

    return window.createTextEditorDecorationType(styleForRegExp);
  }

  private createFadeoutStyle(): TextEditorDecorationType | undefined {
    if (!configuration.sneakHighlightUseFadeout) {
      return;
    }

    return window.createTextEditorDecorationType({
      color: this.getFadeoutColor(),
    });
  }

  /**
   * Clear all decorations
   */
  public clearDecorations(editor: TextEditor) {
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

  public updateDecorations(editor: TextEditor, lastRecognizedAction: BaseAction | undefined) {
    this.clearDecorations(editor);

    if (!this.isSneakTheLastAction(lastRecognizedAction)) {
      this.isHighlightingOn = false;
      return;
    }

    const rangesToHighlight = this.sneak.getRangesToHighlight();

    if (configuration.sneakLabelMode) {
      this.updateMarkerDecorations(editor);
    } else {
      editor.setDecorations(this.style, rangesToHighlight);
    }

    if (this.fadeoutStyle && rangesToHighlight.length > 0) {
      const fadeoutRangeEndIndex = configuration.sneakLabelMode
        ? this.markers.size - 1
        : rangesToHighlight.length - 1;
      // we fade out the text up to the last match + 2 lines (only for aesthetic purposes)
      const matchesRange = new Range(
        editor.visibleRanges[0].end,
        rangesToHighlight[fadeoutRangeEndIndex].end.translate(2, Number.MAX_SAFE_INTEGER)
      );
      const ranges = [...editor.visibleRanges, matchesRange];
      editor.setDecorations(this.fadeoutStyle, ranges);
    }
  }

  private updateMarkerDecorations(editor: TextEditor) {
    this.generateMarkers();

    const markerHighlights: DecorationOptions[] = [];

    for (const [markerString, markerRange] of this.markers) {
      // when we don't use fadeout, we make the marker more prominent by widening the highlighting
      // when we use fadeout, the prominence is given by fading out the other text, so we don't need spaces
      const contentText = configuration.sneakHighlightUseFadeout
        ? markerString
        : ' ' + markerString + ' ';

      const renderOptions: ThemableDecorationInstanceRenderOptions = {
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
        this.markers.set(marker.name, new Range(range.start, range.start));
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
