# Cyclomatic Complexity Hints

## Installation

1. Open VS Code
2. Go to the Extensions view (`Cmd+Shift+X` / `Ctrl+Shift+X`)
3. Search for **"Cyclomatic Complexity Hints"**
4. Click **Install**

Or install via CLI:
```bash
code --install-extension vscode-complexity-hints
```

A VS Code extension that shows cyclomatic complexity scores as faded inline annotations next to each function definition — directly in your editor, without running a separate tool.

## Features

- Displays complexity score at the end of every function definition line
- Color-coded by severity:
  - **Gray** — complexity < 5 (simple, easy to test)
  - **Orange** — complexity 5–10 (moderate, worth reviewing)
  - **Red ⚠** — complexity > 10 (high risk, consider refactoring)
- Updates automatically on file save
- Works with TypeScript, JavaScript, TSX, and JSX files
- Toggle on/off without reloading the editor

## Example

```ts
async function processRequest(req: Request, res: Response) {  // complexity: 17 ⚠
  if (req.method === 'POST') {
    // ...
  }
}

function getUser(id: string): User | null {  // complexity: 2
  return db.find(id) ?? null;
}
```

## Usage

The extension activates automatically for `.ts`, `.js`, `.tsx`, and `.jsx` files. Annotations appear after each save.

### Toggle hints

Open the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`) and run:

```
Complexity: Toggle Complexity Hints
```

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `complexityHints.enabled` | `true` | Enable or disable hints globally |
| `complexityHints.lowThreshold` | `5` | Scores below this are shown in gray |
| `complexityHints.highThreshold` | `10` | Scores above this are shown in red |

Edit these in your `settings.json`:

```json
{
  "complexityHints.highThreshold": 8,
  "complexityHints.lowThreshold": 3
}
```

## How Complexity is Calculated

Uses **cyclomatic complexity**: starts at 1 and adds 1 for each decision point:

| Construct | +1 |
|-----------|-----|
| `if` / `else if` | ✓ |
| `for` / `for...of` / `for...in` | ✓ |
| `while` / `do...while` | ✓ |
| `switch case` (non-default) | ✓ |
| `catch` | ✓ |
| `&&` / `||` / `??` | ✓ |
| Ternary `? :` | ✓ |

Nested functions are counted independently — only direct decision points within a function body contribute to that function's score.

## Development

```bash
npm install
npm run compile
# Press F5 in VS Code to launch Extension Development Host
```
