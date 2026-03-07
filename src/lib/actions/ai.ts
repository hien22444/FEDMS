import { api } from '../apiRequest';

export interface DormRulePenalty {
  fine_vnd?: number;
  description?: string;
  repeat_penalty?: string;
}

export interface DormRuleMatch {
  id: string;
  category: string;
  title: string;
  rule: string;
  details: string | null;
  allowed_devices: string[] | null;
  penalty: DormRulePenalty | null;
  score: number;
}

export interface DormRuleQueryResponse {
  answer: string;
  matched_rules: DormRuleMatch[];
  source: {
    source: string;
    issued_date: string;
    language: string;
    version: string;
  };
  confidence: 'high' | 'medium' | 'low';
}

export const queryDormRules = async (question: string) => {
  return api.post<DormRuleQueryResponse>('ai/rules/query', { question });
};
