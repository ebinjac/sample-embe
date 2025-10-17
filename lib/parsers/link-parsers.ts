import { ParsedLink } from '@/lib/actions/linkmanager/bulk-import'

/**
 * Parse CSV format links
 * Expected format: url,title,description,tags,isPrivate,isPinned
 */
export function parseCSV(content: string): ParsedLink[] {
  const lines = content.split('\n').filter(line => line.trim())
  const links: ParsedLink[] = []
  
  // Skip header if present
  const startIndex = lines[0].toLowerCase().includes('url') ? 1 : 0
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    // Simple CSV parsing (handles commas in quotes)
    const values: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim())
    
    if (values.length >= 1 && values[0]) {
      const tags = values[3] ? values[3].split(';').map(tag => tag.trim()).filter(Boolean) : []
      
      links.push({
        url: values[0],
        title: values[1] || '',
        description: values[2] || '',
        tags,
        isPrivate: values[4]?.toLowerCase() === 'true',
        isPinned: values[5]?.toLowerCase() === 'true',
      })
    }
  }
  
  return links
}

/**
 * Parse Markdown format links
 * Extracts links from markdown format: [title](url) and plain URLs
 */
export function parseMarkdown(content: string): ParsedLink[] {
  const links: ParsedLink[] = []
  const lines = content.split('\n')
  
  // Regex for markdown links: [title](url)
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  // Regex for plain URLs
  const urlRegex = /https?:\/\/[^\s]+/g
  
  for (const line of lines) {
    // Extract markdown links
    let match
    while ((match = markdownLinkRegex.exec(line)) !== null) {
      links.push({
        url: match[2],
        title: match[1],
        description: '',
        tags: [],
        isPrivate: false,
        isPinned: false,
      })
    }
    
    // Extract plain URLs that weren't captured as markdown links
    markdownLinkRegex.lastIndex = 0 // Reset regex
    const plainUrls = line.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '') // Remove markdown links
    while ((match = urlRegex.exec(plainUrls)) !== null) {
      links.push({
        url: match[0],
        title: '',
        description: '',
        tags: [],
        isPrivate: false,
        isPinned: false,
      })
    }
  }
  
  return links
}

/**
 * Parse HTML format links
 * Extracts links from <a> tags and meta refresh tags
 */
export function parseHTML(content: string): ParsedLink[] {
  const links: ParsedLink[] = []
  
  // Regex for <a> tags
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi
  // Regex for meta refresh
  const metaRegex = /<meta[^>]+http-equiv=["']refresh["'][^>]+content=["'][^;]*;url=([^"']+)["'][^>]*>/gi
  
  let match
  
  // Extract <a> tags
  while ((match = linkRegex.exec(content)) !== null) {
    const url = match[1]
    const title = match[2].trim()
    
    if (url && !url.startsWith('#') && !url.startsWith('javascript:')) {
      links.push({
        url,
        title: title || '',
        description: '',
        tags: [],
        isPrivate: false,
        isPinned: false,
      })
    }
  }
  
  // Extract meta refresh URLs
  while ((match = metaRegex.exec(content)) !== null) {
    links.push({
      url: match[1],
      title: '',
      description: '',
      tags: [],
      isPrivate: false,
      isPinned: false,
    })
  }
  
  return links
}

/**
 * Parse JSON format links
 * Expected format:
 * [
 *   {
 *     "url": "https://example.com",
 *     "title": "Example",
 *     "description": "Description",
 *     "tags": ["tag1", "tag2"],
 *     "isPrivate": false,
 *     "isPinned": false
 *   }
 * ]
 */
export function parseJSON(content: string): ParsedLink[] {
  try {
    const data = JSON.parse(content)
    
    if (!Array.isArray(data)) {
      throw new Error('JSON must be an array of link objects')
    }
    
    return data.map(item => ({
      url: item.url || '',
      title: item.title || '',
      description: item.description || '',
      tags: Array.isArray(item.tags) ? item.tags : [],
      isPrivate: Boolean(item.isPrivate),
      isPinned: Boolean(item.isPinned),
    })).filter(link => link.url) // Filter out items without URLs
  } catch (error) {
    throw new Error(`Invalid JSON format: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}