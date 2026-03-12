import { parse, AST_NODE_TYPES } from '@typescript-eslint/typescript-estree';
import type { TSESTree } from '@typescript-eslint/typescript-estree';

export interface FunctionComplexity {
  name: string;
  line: number;
  complexity: number;
}

type FunctionNode =
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression
  | TSESTree.ArrowFunctionExpression;

const DECISION_NODES = new Set([
  AST_NODE_TYPES.IfStatement,
  AST_NODE_TYPES.ForStatement,
  AST_NODE_TYPES.ForInStatement,
  AST_NODE_TYPES.ForOfStatement,
  AST_NODE_TYPES.WhileStatement,
  AST_NODE_TYPES.DoWhileStatement,
  AST_NODE_TYPES.CatchClause,
  AST_NODE_TYPES.ConditionalExpression,
]);

function countDecisionPoints(node: TSESTree.Node, stopAt?: TSESTree.Node): number {
  if (node === stopAt) return 0;
  let count = 0;

  if (DECISION_NODES.has(node.type as AST_NODE_TYPES)) {
    count += 1;
  }

  if (node.type === AST_NODE_TYPES.SwitchCase && node.test !== null) {
    count += 1;
  }

  if (node.type === AST_NODE_TYPES.LogicalExpression) {
    const op = (node as TSESTree.LogicalExpression).operator;
    if (op === '&&' || op === '||' || op === '??') {
      count += 1;
    }
  }

  for (const key of Object.keys(node)) {
    const child = (node as Record<string, unknown>)[key];
    if (child && typeof child === 'object') {
      if (Array.isArray(child)) {
        for (const item of child) {
          if (item && typeof item === 'object' && 'type' in item) {
            // Don't recurse into nested functions
            const childNode = item as TSESTree.Node;
            if (
              childNode.type !== AST_NODE_TYPES.FunctionDeclaration &&
              childNode.type !== AST_NODE_TYPES.FunctionExpression &&
              childNode.type !== AST_NODE_TYPES.ArrowFunctionExpression
            ) {
              count += countDecisionPoints(childNode);
            }
          }
        }
      } else if ('type' in child) {
        const childNode = child as TSESTree.Node;
        if (
          childNode.type !== AST_NODE_TYPES.FunctionDeclaration &&
          childNode.type !== AST_NODE_TYPES.FunctionExpression &&
          childNode.type !== AST_NODE_TYPES.ArrowFunctionExpression
        ) {
          count += countDecisionPoints(childNode);
        }
      }
    }
  }

  return count;
}

function getFunctionName(node: TSESTree.Node, parent: TSESTree.Node | null): string {
  if (node.type === AST_NODE_TYPES.FunctionDeclaration) {
    return (node as TSESTree.FunctionDeclaration).id?.name ?? 'anonymous';
  }

  if (parent) {
    if (
      parent.type === AST_NODE_TYPES.VariableDeclarator &&
      (parent as TSESTree.VariableDeclarator).id.type === AST_NODE_TYPES.Identifier
    ) {
      return ((parent as TSESTree.VariableDeclarator).id as TSESTree.Identifier).name;
    }
    if (
      parent.type === AST_NODE_TYPES.MethodDefinition &&
      (parent as TSESTree.MethodDefinition).key.type === AST_NODE_TYPES.Identifier
    ) {
      return ((parent as TSESTree.MethodDefinition).key as TSESTree.Identifier).name;
    }
    if (
      parent.type === AST_NODE_TYPES.Property &&
      (parent as TSESTree.Property).key.type === AST_NODE_TYPES.Identifier
    ) {
      return ((parent as TSESTree.Property).key as TSESTree.Identifier).name;
    }
  }

  return 'anonymous';
}

function walkAST(
  node: TSESTree.Node,
  parent: TSESTree.Node | null,
  results: FunctionComplexity[]
): void {
  const isFunctionNode =
    node.type === AST_NODE_TYPES.FunctionDeclaration ||
    node.type === AST_NODE_TYPES.FunctionExpression ||
    node.type === AST_NODE_TYPES.ArrowFunctionExpression;

  if (isFunctionNode) {
    const fn = node as FunctionNode;
    const name = getFunctionName(node, parent);
    const complexity = 1 + countDecisionPoints(fn.body ?? fn);
    const line = fn.loc?.start.line ?? 0;
    results.push({ name, line, complexity });
  }

  for (const key of Object.keys(node)) {
    if (key === 'parent') continue;
    const child = (node as Record<string, unknown>)[key];
    if (child && typeof child === 'object') {
      if (Array.isArray(child)) {
        for (const item of child) {
          if (item && typeof item === 'object' && 'type' in item) {
            walkAST(item as TSESTree.Node, node, results);
          }
        }
      } else if ('type' in child) {
        walkAST(child as TSESTree.Node, node, results);
      }
    }
  }
}

export function analyzeComplexity(code: string, filePath: string): FunctionComplexity[] {
  const results: FunctionComplexity[] = [];
  try {
    const ast = parse(code, {
      loc: true,
      range: true,
      jsx: filePath.endsWith('x'),
      errorOnUnknownASTType: false,
    });
    walkAST(ast, null, results);
  } catch {
    // Return empty results if parsing fails (e.g. mid-edit syntax errors)
  }
  return results;
}
