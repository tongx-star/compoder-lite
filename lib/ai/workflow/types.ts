export interface WorkflowContext {
  stream: {
    write: (chunk: string) => void;
    writeCode: (chunk: string) => void;
    startCode: () => void;
    endCode: () => void;
    updateStatus: (status: string) => void;
    error: (message: string) => void;
    close: () => void;
  };
  query: {
    prompt: {
      type: "text" | "image";
      content: string;
    }[];
    userId: string;
    codegenId: string;
    selectedLibraries: "antd" | "shadcn" | "custom";
  };
  state?: {
    designPhase?: {
      componentName: string;
      componentDescription: string;
      selectedLibraries: string[];
      retrievedKnowledge?: string;
    };
    generatePhase?: {
      generatedCode: string;
      aiModel: string;
      ragContext: string;
    };
    error?: string;
  };
}

export type WorkflowStep<TIn, TOut> = (ctx: TIn) => Promise<TOut>;
