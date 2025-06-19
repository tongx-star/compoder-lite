// AI 相关的工具函数和类型定义
export interface GenerateCodeRequest {
    desc: string
    lib: 'antd' | 'custom'
  }
  
  export interface ComponentDoc {
    props: string[]
    usage: string
    description: string
  }
  
  export type ComponentDocs = Record<string, ComponentDoc>
  
  // 构建 RAG 提示内容
  export function buildRAGPrompt(lib: string, componentDocs: ComponentDocs): string {
    if (lib === 'custom') {
      return `你必须严格按照以下自定义组件库规范生成代码：
  
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
      return `你必须使用 Ant Design (antd) 组件库生成代码：
  
  组件库规范：
  1. 从 'antd' 导入组件，例如：import { Button, Input, Form } from 'antd'
  2. 常用组件：Button, Input, Form, Card, Table, Modal, Select, DatePicker 等
  3. 参考官方文档：https://ant.design/components/overview-cn/
  4. 使用最新的 antd 5.x 语法
  5. 组件样式已自动引入，无需手动导入 CSS
  `
    }
  }