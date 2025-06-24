import { deepseek } from '@ai-sdk/deepseek'
import { generateObject, streamText } from 'ai'
import { z } from 'zod'

const CodeGenerationSchema = z.object({
  code: z.string().describe('生成的完整组件代码'),
  explanation: z.string().describe('代码实现说明'),
  dependencies: z.array(z.string()).describe('所需依赖包'),
  usage: z.string().describe('使用示例')
})

export async function generateCode(
  prompt: string,
  library: string,
  model: 'deepseek' | 'openai' = 'deepseek'
): Promise<string> {
  try {
    const aiProvider = model === 'deepseek' ? deepseek : deepseek

    const result = await generateObject({
      model: aiProvider('deepseek-coder'),
      system: `你是一个专业的前端开发工程师，专门生成高质量的 React 组件代码。
      请根据用户需求生成完整、可运行的 ${library} 组件代码。`,
      prompt,
      schema: CodeGenerationSchema,
    })

    return result.object.code
  } catch (error) {
    console.error('代码生成失败:', error)

    // 降级到简单模板生成
    return generateFallbackCode(prompt, library)
  }
}

// 新增：流式代码生成函数
export async function generateCodeStream(
  prompt: string,
  library: string,
  onChunk: (chunk: string) => void,
  model: 'deepseek' | 'openai' = 'deepseek'
): Promise<string> {
  try {
    const aiProvider = model === 'deepseek' ? deepseek : deepseek

    const result = await streamText({
      model: aiProvider('deepseek-coder'),
      system: `你是一个专业的前端开发工程师，专门生成高质量的 React 组件代码。

请根据用户需求生成完整、可运行的 ${library} 组件代码。

要求：
1. 使用 TypeScript
2. 包含完整的类型定义
3. 代码结构清晰，注释完善
4. 遵循最佳实践
5. 直接输出代码，不要额外的解释文字

${library === 'antd' ? '使用 Ant Design 组件库' : library === 'shadcn' ? '使用 Shadcn UI 组件库' : '使用原生 React'}`,
      prompt,
    })

    let fullCode = ''
    
    for await (const chunk of result.textStream) {
      fullCode += chunk
      onChunk(chunk)
    }

    return fullCode
  } catch (error) {
    console.error('流式代码生成失败:', error)
    
    // 降级到模板生成，但也要通过流式输出
    const fallbackCode = generateFallbackCode(prompt, library)
    
    // 模拟流式输出
    const chunks = fallbackCode.split('\n')
    for (const line of chunks) {
      onChunk(line + '\n')
      // 添加小延迟模拟真实的流式效果
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    
    return fallbackCode
  }
}

// 降级代码生成
function generateFallbackCode(prompt: string, library: string): string {
  const componentName = extractComponentName(prompt) || 'CustomComponent'

  if (library === 'antd') {
    return generateAntdTemplate(componentName, prompt)
  } else if (library === 'shadcn') {
    return generateShadcnTemplate(componentName)
  } else {
    return generateGenericTemplate(componentName)
  }
}

function extractComponentName(prompt: string): string | null {
  const match = prompt.match(/(?:创建|生成|制作)\\s*([a-zA-Z]\\w*)\\s*(?:组件|Component)/i)
  return match?.[1] || null
}

function generateAntdTemplate(componentName: string, prompt: string): string {
  const hasButton = prompt.includes('按钮') || prompt.includes('button')
  const hasForm = prompt.includes('表单') || prompt.includes('form')

  return `import React from 'react';
import { ${hasButton ? 'Button, ' : ''}${hasForm ? 'Form, Input, ' : ''}Card } from 'antd';

interface ${componentName}Props {
  title?: string;
  onSubmit?: (values: any) => void;
}

const ${componentName}: React.FC<${componentName}Props> = ({
  title = '默认标题',
  onSubmit
}) => {
  ${hasForm ? `
  const [form] = Form.useForm();

  const handleFinish = (values: any) => {
    console.log('Form values:', values);
    onSubmit?.(values);
  };
  ` : ''}

  return (
    <Card title={title} style={{ width: '100%', maxWidth: 600 }}>
      ${hasForm ? `
      <Form form={form} onFinish={handleFinish} layout="vertical">
        <Form.Item
          name="input"
          label="输入内容"
          rules={[{ required: true, message: '请输入内容' }]}
        >
          <Input placeholder="请输入..." />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            提交
          </Button>
        </Form.Item>
      </Form>
      ` : `
      <div>
        <p>这是一个基于 Ant Design 的 ${componentName} 组件</p>
        ${hasButton ? `
        <Button type="primary" onClick={() => console.log('Button clicked')}>
          点击按钮
        </Button>
        ` : ''}
      </div>
      `}
    </Card>
  );
};

export default ${componentName};`
}

function generateShadcnTemplate(componentName: string): string {
  return `import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ${componentName}Props {
  title?: string;
  className?: string;
}

const ${componentName}: React.FC<${componentName}Props> = ({
  title = '默认标题',
  className
}) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p>这是一个基于 Shadcn UI 的 ${componentName} 组件</p>
          <Button variant="default">
            点击按钮
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ${componentName};`
}

function generateGenericTemplate(componentName: string): string {
  return `import React from 'react';

interface ${componentName}Props {
  title?: string;
  className?: string;
}

const ${componentName}: React.FC<${componentName}Props> = ({
  title = '默认标题',
  className
}) => {
  return (
    <div className={className}>
      <h2>{title}</h2>
      <p>这是一个自定义的 ${componentName} 组件</p>
    </div>
  );
};

export default ${componentName};`
}
