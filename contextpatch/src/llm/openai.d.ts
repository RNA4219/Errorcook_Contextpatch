declare module 'openai' {
  export class OpenAI {
    constructor(config?: any);
    chat: { completions: { create: (params: any) => Promise<any> } };
  }
}
