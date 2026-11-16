// 轻量 Markdown 渲染：支持问答场景常见语法，先转义 HTML 再解析，避免 XSS
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

// 把一行 markdown 表格拆成单元格（去掉首尾空 pipe，处理内部 pipe）
function splitTableRow(line) {
  let s = line.trim()
  if (s.startsWith('|')) s = s.slice(1)
  if (s.endsWith('|')) s = s.slice(0, -1)
  return s.split('|').map((c) => c.trim())
}

// 判断一行是不是 markdown 表格的分隔行（| --- | --- |）
function isTableSep(line) {
  const cells = splitTableRow(line)
  if (!cells.length) return false
  return cells.every((c) => /^\s*:?-{2,}:?\s*$/.test(c))
}

/**
 * 将 Markdown 文本渲染为安全的 HTML 字符串
 * 支持：标题、有序/无序列表、表格、代码块、行内代码、加粗、斜体、链接、分割线、换行
 */
export function renderMarkdown(source) {
  if (!source) return ''

  const lines = String(source).replace(/\r\n/g, '\n').split('\n')
  const html = []
  let listType = null
  let inCode = false
  let codeBuffer = []
  let paragraph = []

  // 表格解析状态机：
  // 我们先预扫描一遍检测所有表格块（连续多行以 | 开头），然后在主循环里遇到表格时整体处理。
  const tableRanges = [] // [{start, end, header: [...], rows: [[...]]}]
  let i = 0
  while (i < lines.length) {
    const line = lines[i].trim()
    if (!line.startsWith('|')) { i++; continue }
    // 找到连续以 | 开头的行
    const block = []
    let j = i
    while (j < lines.length && lines[j].trim().startsWith('|')) {
      block.push(lines[j].trim())
      j++
    }
    // 至少需要表头 + 分隔行 + 1 行数据才算表格
    if (block.length >= 3 && isTableSep(block[1])) {
      const header = splitTableRow(block[0])
      const rows = block.slice(2).map((r) => splitTableRow(r))
      tableRanges.push({ start: i, end: j, header, rows })
    }
    i = j
  }

  let ti = 0 // 当前处理到哪个表格

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

  const flushTable = () => {
    if (ti >= tableRanges.length) return
    closeList()
    flushParagraph()
    const { header, rows } = tableRanges[ti]
    const colCount = header.length
    html.push('<table class="md-table">')
    html.push('<thead><tr>')
    for (const h of header) {
      html.push(`<th>${parseInline(escapeHtml(h))}</th>`)
    }
    html.push('</tr></thead>')
    html.push('<tbody>')
    for (const row of rows) {
      // 对齐列数
      const cells = row.slice(0, colCount)
      while (cells.length < colCount) cells.push('')
      html.push('<tr>')
      for (const c of cells) {
        html.push(`<td>${parseInline(escapeHtml(c))}</td>`)
      }
      html.push('</tr>')
    }
    html.push('</tbody></table>')
    ti++
  }

  for (let idx = 0; idx < lines.length; idx++) {
    const raw = lines[idx]

    // 遇到表格起始行 → 整体处理表格块
    if (tableRanges[ti] && idx === tableRanges[ti].start) {
      flushTable()
      idx = tableRanges[ti - 1].end - 1 // 跳过表格所有行，for 循环会 idx++
      continue
    }

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

    // 标题（最多四级，映射为 h3~h6 避免压过页面标题）
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
