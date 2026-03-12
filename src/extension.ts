import * as vscode from 'vscode';
import { analyzeComplexity } from './analyzer';
import { ComplexityDecorator } from './decorator';

const SUPPORTED_LANGUAGES = new Set([
  'typescript',
  'javascript',
  'typescriptreact',
  'javascriptreact',
]);

function getThresholds(): { low: number; high: number } {
  const config = vscode.workspace.getConfiguration('complexityHints');
  return {
    low: config.get<number>('lowThreshold', 5),
    high: config.get<number>('highThreshold', 10),
  };
}

function applyToEditor(
  editor: vscode.TextEditor,
  decorator: ComplexityDecorator,
  enabled: boolean
): void {
  if (!enabled || !SUPPORTED_LANGUAGES.has(editor.document.languageId)) {
    decorator.clear(editor);
    return;
  }

  const code = editor.document.getText();
  const filePath = editor.document.fileName;
  const functions = analyzeComplexity(code, filePath);
  const { low, high } = getThresholds();
  decorator.apply(editor, functions, low, high);
}

export function activate(context: vscode.ExtensionContext): void {
  const decorator = new ComplexityDecorator();

  const config = vscode.workspace.getConfiguration('complexityHints');
  let enabled = config.get<boolean>('enabled', true);

  // Apply to currently active editor on activation
  if (vscode.window.activeTextEditor) {
    applyToEditor(vscode.window.activeTextEditor, decorator, enabled);
  }

  // Re-apply when switching editors
  const onChangeEditor = vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor) {
      applyToEditor(editor, decorator, enabled);
    }
  });

  // Re-apply on save
  const onSave = vscode.workspace.onDidSaveTextDocument((doc) => {
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document === doc) {
      applyToEditor(editor, decorator, enabled);
    }
  });

  // Re-apply when configuration changes
  const onConfigChange = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('complexityHints')) {
      const updatedConfig = vscode.workspace.getConfiguration('complexityHints');
      enabled = updatedConfig.get<boolean>('enabled', true);
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        applyToEditor(editor, decorator, enabled);
      }
    }
  });

  // Toggle command
  const toggleCommand = vscode.commands.registerCommand(
    'vscode-complexity-hints.toggle',
    () => {
      enabled = !enabled;
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        applyToEditor(editor, decorator, enabled);
      }
      vscode.window.setStatusBarMessage(
        `Complexity Hints: ${enabled ? 'enabled' : 'disabled'}`,
        3000
      );
    }
  );

  context.subscriptions.push(onChangeEditor, onSave, onConfigChange, toggleCommand, decorator);
}

export function deactivate(): void {
  // Cleanup handled via context.subscriptions
}
