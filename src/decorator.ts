import * as vscode from 'vscode';
import type { FunctionComplexity } from './analyzer';

export class ComplexityDecorator {
  private lowDecoration: vscode.TextEditorDecorationType;
  private mediumDecoration: vscode.TextEditorDecorationType;
  private highDecoration: vscode.TextEditorDecorationType;

  constructor() {
    this.lowDecoration = vscode.window.createTextEditorDecorationType({
      after: {
        color: '#6a9955',
        fontStyle: 'italic',
        margin: '0 0 0 1.5em',
      },
    });

    this.mediumDecoration = vscode.window.createTextEditorDecorationType({
      after: {
        color: '#ce9178',
        fontStyle: 'italic',
        margin: '0 0 0 1.5em',
      },
    });

    this.highDecoration = vscode.window.createTextEditorDecorationType({
      after: {
        color: '#f44747',
        fontStyle: 'italic',
        margin: '0 0 0 1.5em',
      },
    });
  }

  apply(
    editor: vscode.TextEditor,
    functions: FunctionComplexity[],
    lowThreshold: number,
    highThreshold: number
  ): void {
    const lowRanges: vscode.DecorationOptions[] = [];
    const mediumRanges: vscode.DecorationOptions[] = [];
    const highRanges: vscode.DecorationOptions[] = [];

    for (const fn of functions) {
      const lineIndex = fn.line - 1; // AST lines are 1-indexed
      if (lineIndex < 0 || lineIndex >= editor.document.lineCount) {
        continue;
      }

      const line = editor.document.lineAt(lineIndex);
      const endOfLine = line.range.end;
      const range = new vscode.Range(endOfLine, endOfLine);

      const isHigh = fn.complexity > highThreshold;
      const isMedium = fn.complexity >= lowThreshold && fn.complexity <= highThreshold;

      const label = isHigh
        ? `// complexity: ${fn.complexity} ⚠`
        : `// complexity: ${fn.complexity}`;

      const decoration: vscode.DecorationOptions = {
        range,
        renderOptions: {
          after: { contentText: label },
        },
      };

      if (isHigh) {
        highRanges.push(decoration);
      } else if (isMedium) {
        mediumRanges.push(decoration);
      } else {
        lowRanges.push(decoration);
      }
    }

    editor.setDecorations(this.lowDecoration, lowRanges);
    editor.setDecorations(this.mediumDecoration, mediumRanges);
    editor.setDecorations(this.highDecoration, highRanges);
  }

  clear(editor: vscode.TextEditor): void {
    editor.setDecorations(this.lowDecoration, []);
    editor.setDecorations(this.mediumDecoration, []);
    editor.setDecorations(this.highDecoration, []);
  }

  dispose(): void {
    this.lowDecoration.dispose();
    this.mediumDecoration.dispose();
    this.highDecoration.dispose();
  }
}
