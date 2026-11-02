/**
 * Plain text ⇄ Lexical rich text, for task descriptions written and read over
 * MCP. One paragraph per line; formatting is not carried either way.
 */

type LexicalNode = { type?: string; text?: string; children?: LexicalNode[] }

export function plainTextToLexical(text: string) {
  const paragraphs = text.split(/\r?\n/).map((line) => ({
    type: 'paragraph',
    version: 1,
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    textFormat: 0,
    children: line
      ? [{ type: 'text', version: 1, text: line, format: 0, detail: 0, mode: 'normal', style: '' }]
      : [],
  }))
  return {
    root: { type: 'root', version: 1, direction: 'ltr' as const, format: '' as const, indent: 0, children: paragraphs },
  }
}

export function lexicalToPlainText(value: unknown): string {
  const root = (value as { root?: LexicalNode } | null | undefined)?.root
  if (!root?.children) return ''
  const textOf = (n: LexicalNode): string => (n.text ?? '') + (n.children ?? []).map(textOf).join('')
  return root.children.map(textOf).join('\n').trim()
}
