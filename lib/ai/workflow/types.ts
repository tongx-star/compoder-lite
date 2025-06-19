export interface WorkflowContext {
  stream: {
    write: (chunk: string) => void;
    close: () => void;
  };
  query: {
    prompt: {
      type: "text" | "image";
      content: string;
    }[];
    userId: string;
    codegenId: string;
    selectedLibraries: "antd" | "custom";
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
  };
}

export type WorkflowStep<TIn, TOut> = (ctx: TIn) => Promise<TOut>;
