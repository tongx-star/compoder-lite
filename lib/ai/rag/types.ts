export interface KnowledgeBase {
    id: string
    name: string
    description: string
    type: 'antd' | 'shadcn' | 'mui' | 'custom'
    documents: KnowledgeDocument[]
  }
  
  export interface KnowledgeDocument {
    id: string
    title: string
    content: string
    metadata: {
      componentName?: string
      category: string
      tags: string[]
      examples?: string[]
      apiReference?: string
      complexity: 'basic' | 'intermediate' | 'advanced'
    }
    embedding?: number[]
    chunks: DocumentChunk[]
  }
  
  export interface DocumentChunk {
    id: string
    content: string
    startIndex: number
    endIndex: number
    embedding?: number[]
    metadata: Record<string, unknown>
  }
  
  export interface SearchResult {
    document: KnowledgeDocument
    chunk: DocumentChunk
    score: number
    relevance: 'high' | 'medium' | 'low'
  }
  