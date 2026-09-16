import { marked } from 'marked'

marked.setOptions({
  gfm: true,
  breaks: true,
  headerIds: false,
  mangle: false,
})

export function markdownToHtml(markdown: string) {
  return marked.parse(markdown, { async: false }) as string
}
