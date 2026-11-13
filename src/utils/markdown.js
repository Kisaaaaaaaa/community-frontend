// 轻量 Markdown 渲染：仅支持问答场景常见的语法，先转义 HTML 再解析，避免 XSS
const ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch])
}

// 行内语法：行内代码、加粗、斜体、链接
function parseInline(escaped) {
  return escaped
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    )
}

/**
 * 将 Markdown 文本渲染为安全的 HTML 字符串
 * 支持：标题、有序/无序列表、代码块、行内代码、加粗、斜体、链接、分割线、换行
 */
export function renderMarkdown(source) {
  if (!source) return ''

  const lines = String(source).replace(/\r\n/g, '\n').split('\n')
  const html = []
  let listType = null
  let inCode = false
  let codeBuffer = []
  let paragraph = []

  const flushParagraph = () => {
    if (paragraph.length) {
      html.push(`<p>${parseInline(paragraph.join('<br>'))}</p>`)
      paragraph = []
    }
  }

  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`)
      listType = null
    }
  }

  for (const raw of lines) {
    // 代码块围栏
    if (/^\s*```/.test(raw)) {
      if (inCode) {
        html.push(`<pre><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`)
        codeBuffer = []
        inCode = false
      } else {
        flushParagraph()
        closeList()
        inCode = true
      }
      continue
    }
    if (inCode) {
      codeBuffer.push(raw)
      continue
    }

    const line = raw.trim()

    // 空行：结束当前段落与列表
    if (!line) {
      flushParagraph()
      closeList()
      continue
    }

    // 分割线
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
      flushParagraph()
      closeList()
      html.push('<hr>')
      continue
    }

    // 标题（普通正文里最多用到四级，映射为 h3~h6 避免压过页面标题）
    const heading = line.match(/^(#{1,4})\s+(.*)$/)
    if (heading) {
      flushParagraph()
      closeList()
      const level = Math.min(heading[1].length + 2, 6)
      html.push(`<h${level}>${parseInline(escapeHtml(heading[2]))}</h${level}>`)
      continue
    }

    // 列表
    const unordered = line.match(/^[-*+]\s+(.*)$/)
    const ordered = line.match(/^\d+[.)]\s+(.*)$/)
    if (unordered || ordered) {
      flushParagraph()
      const wanted = unordered ? 'ul' : 'ol'
      if (listType !== wanted) {
        closeList()
        html.push(`<${wanted}>`)
        listType = wanted
      }
      html.push(`<li>${parseInline(escapeHtml((unordered || ordered)[1]))}</li>`)
      continue
    }

    // 普通段落行
    closeList()
    paragraph.push(escapeHtml(line))
  }

  if (inCode && codeBuffer.length) {
    html.push(`<pre><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`)
  }
  flushParagraph()
  closeList()

  return html.join('')
}
