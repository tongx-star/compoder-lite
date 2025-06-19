import { NextRequest } from 'next/server'
import { streamText } from 'ai'
import { deepseek } from '@ai-sdk/deepseek'
import componentDocs from '@/data/component-docs.json'

export async function POST(req: NextRequest) {
  try {
    const { desc, lib } = await req.json()

    // 构建 RAG 内容（知识增强）
    let ragContent = ''
    
    if (lib === 'custom') {
      // 使用自定义组件库
      ragContent = `你必须严格按照以下自定义组件库规范生成代码：

组件库规范：
${Object.entries(componentDocs).map(([name, info]) => 
  `${name} 组件：
  - 用法：${info.usage}
  - 说明：${info.description}
  - 支持的属性：${info.props.join(', ')}`
).join('\n\n')}

重要提醒：
1. 只能使用上述自定义组件，不能使用任何其他组件库
2. 严格按照提供的用法示例编写代码
3. 组件的 import 语句请写成：import { ComponentName } from '@/components/ui'
`
    } else {
      // 使用 Ant Design
      ragContent = `你必须使用 Ant Design (antd) 组件库生成代码：

组件库规范：
1. 从 'antd' 导入组件，例如：import { Button, Input, Form } from 'antd'
2. 常用组件：Button, Input, Form, Card, Table, Modal, Select, DatePicker 等
3. 参考官方文档：https://ant.design/components/overview-cn/
4. 使用最新的 antd 5.x 语法
5. 组件样式已自动引入，无需手动导入 CSS

示例用法：
- 按钮：<Button type="primary" onClick={handleClick}>点击</Button>
- 输入框：<Input placeholder="请输入" value={value} onChange={handleChange} />
- 表单：<Form onFinish={handleSubmit}>...</Form>
`
    }

    // 构建完整的 prompt
    const systemPrompt = `你是一个专业的前端开发工程师，专门负责根据用户需求生成高质量的 React 组件代码。

${ragContent}

代码要求：
1. 使用 TypeScript
2. 使用函数式组件和 React Hooks
3. 代码要完整可运行，包含必要的 import 语句
4. 添加适当的类型定义
5. 代码要有良好的结构和可读性
6. 如果需要状态管理，使用 useState 和 useEffect
7. 添加必要的事件处理函数

请直接返回代码，不需要额外的解释文字。`

    const userPrompt = `用户需求：${desc}

请根据上述需求生成对应的 React 组件代码。`

    // 检查 API Key
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      return new Response('API Key 未配置，请在 .env.local 中设置 DEEPSEEK_API_KEY', { 
        status: 500 
      })
    }

    // 调用 AI 生成代码
    const result = await streamText({
      model: deepseek('deepseek-chat'),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      maxTokens: 2000,
      temperature: 0.1,
    })

    // 创建自定义的流式响应，只返回文本内容
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            controller.enqueue(encoder.encode(chunk))
          }
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    })

  } catch (error) {
    console.error('AI 代码生成错误:', error)
    return new Response(`生成代码时出现错误: ${error}`, { status: 500 })
  }
}