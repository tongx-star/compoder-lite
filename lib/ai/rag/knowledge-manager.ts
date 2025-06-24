import { KnowledgeBase, KnowledgeDocument, SearchResult } from './types'

export class KnowledgeManager {
  private knowledgeBases: Map<string, KnowledgeBase> = new Map()

  constructor() {
    this.initializeKnowledgeBases()
  }

  private async initializeKnowledgeBases() {
    // 加载预设知识库
    await this.loadAntdKnowledge()
    await this.loadShadcnKnowledge()
    await this.loadCustomKnowledge()
  }

  private async loadAntdKnowledge() {
    const antdKB: KnowledgeBase = {
      id: 'antd',
      name: 'Ant Design',
      description: 'Ant Design 组件库知识库',
      type: 'antd',
      documents: [
        {
          id: 'antd-button',
          title: 'Button 按钮',
          content: `
            Button 按钮用于触发一个操作。

            基础用法：
            import { Button } from 'antd';
            <Button type="primary">Primary Button</Button>
            <Button>Default Button</Button>
            <Button type="dashed">Dashed Button</Button>

            按钮类型：
            - primary: 主要按钮
            - default: 默认按钮
            - dashed: 虚线按钮
            - link: 链接按钮
            - text: 文本按钮

            按钮状态：
            - loading: 加载状态
            - disabled: 禁用状态
            - danger: 危险状态
          `,
          metadata: {
            componentName: 'Button',
            category: 'General',
            tags: ['button', 'action', 'trigger'],
            examples: [
              '<Button type="primary">Primary</Button>',
              '<Button loading>Loading</Button>',
              '<Button danger>Danger</Button>'
            ],
            complexity: 'basic'
          },
          chunks: []
        },
        {
          id: 'antd-form',
          title: 'Form 表单',
          content: `
            Form 表单用于数据录入和验证。

            基础用法：
            import { Form, Input, Button } from 'antd';

            const Demo = () => {
              const [form] = Form.useForm();

              const onFinish = (values) => {
                console.log('Success:', values);
              };

              return (
                <Form form={form} onFinish={onFinish}>
                  <Form.Item name="username" rules={[{ required: true }]}>
                    <Input placeholder="用户名" />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit">
                      提交
                    </Button>
                  </Form.Item>
                </Form>
              );
            };

            表单验证：
            - required: 必填验证
            - pattern: 正则验证
            - validator: 自定义验证
          `,
          metadata: {
            componentName: 'Form',
            category: 'Data Entry',
            tags: ['form', 'input', 'validation'],
            complexity: 'intermediate'
          },
          chunks: []
        }
      ]
    }

    this.knowledgeBases.set('antd', antdKB)
  }

  private async loadShadcnKnowledge() {
    const shadcnKB: KnowledgeBase = {
      id: 'shadcn',
      name: 'Shadcn UI',
      description: 'Shadcn UI 组件库知识库',
      type: 'shadcn',
      documents: [
        {
          id: 'shadcn-button',
          title: 'Button',
          content: `
            Button component for triggering actions.

            Usage:
            import { Button } from "@/components/ui/button"

            <Button variant="default">Default</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>

            Sizes:
            <Button size="default">Default</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
            <Button size="icon">Icon</Button>
          `,
          metadata: {
            componentName: 'Button',
            category: 'Components',
            tags: ['button', 'action', 'ui'],
            complexity: 'basic'
          },
          chunks: []
        }
      ]
    }

    this.knowledgeBases.set('shadcn', shadcnKB)
  }

  private async loadCustomKnowledge() {
    // 从文件系统或数据库加载自定义知识库
    // 这里可以扩展为从 MongoDB 或文件系统读取
  }

  // 简化版语义搜索（实际项目中可以集成向量数据库）
  public async search(
    query: string,
    libraryType: 'antd' | 'shadcn' | 'all' = 'all',
    limit: number = 5
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = []

    const kbsToSearch = libraryType === 'all'
      ? Array.from(this.knowledgeBases.values())
      : [this.knowledgeBases.get(libraryType)].filter((kb): kb is KnowledgeBase => kb !== undefined)

    for (const kb of kbsToSearch) {
      for (const doc of kb.documents) {
        const score = this.calculateRelevanceScore(query, doc)
        if (score > 0.3) { // 阈值过滤
          results.push({
            document: doc,
            chunk: {
              id: `${doc.id}-full`,
              content: doc.content,
              startIndex: 0,
              endIndex: doc.content.length,
              metadata: doc.metadata
            },
            score,
            relevance: score > 0.7 ? 'high' : score > 0.5 ? 'medium' : 'low'
          })
        }
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  private calculateRelevanceScore(query: string, doc: KnowledgeDocument): number {
    const queryLower = query.toLowerCase()
    const contentLower = doc.content.toLowerCase()
    const titleLower = doc.title.toLowerCase()

    let score = 0

    // 标题匹配权重更高
    if (titleLower.includes(queryLower)) score += 0.5
    if (doc.metadata.componentName?.toLowerCase().includes(queryLower)) score += 0.4

    // 内容匹配
    const queryWords = queryLower.split(' ')
    for (const word of queryWords) {
      if (contentLower.includes(word)) score += 0.1
      if (doc.metadata.tags.some(tag => tag.includes(word))) score += 0.15
    }

    return Math.min(score, 1.0)
  }

  public getKnowledgeBase(id: string): KnowledgeBase | undefined {
    return this.knowledgeBases.get(id)
  }

  public listKnowledgeBases(): KnowledgeBase[] {
    return Array.from(this.knowledgeBases.values())
  }
}

export const knowledgeManager = new KnowledgeManager()
