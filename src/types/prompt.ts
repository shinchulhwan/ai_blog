export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  systemInstructions: string;
  userTemplate: string;
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PromptTemplateInput {
  name: string;
  description: string;
  systemInstructions: string;
  userTemplate: string;
}

/** Placeholder for future prompt management CRUD */
export interface PromptService {
  list(): Promise<PromptTemplate[]>;
  getById(id: string): Promise<PromptTemplate | null>;
  create(input: PromptTemplateInput): Promise<PromptTemplate>;
  update(id: string, input: Partial<PromptTemplateInput>): Promise<PromptTemplate>;
  delete(id: string): Promise<void>;
}
