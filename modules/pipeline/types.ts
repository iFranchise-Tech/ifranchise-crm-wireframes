export type PipelineStage = {
  id: string;
  name: string;
  probability: number;
  category: "Open" | "Closed - Won" | "Closed - Lost";
  color: string;
  children?: string[];
};

export type PipelineConfig = {
  id: string;
  name: string;
  description: string;
  stages: PipelineStage[];
  isDefault: boolean;
};

export type Opportunity = {
  id: string;
  pipelineId: string;
  enquiryId: string;
  name: string;
  email: string;
  phone: string;
  brand: string;
  owner: string;
  source: string;
  stageId: string;
  rnrStep?: number;
  value: number;
  createdAt: string;
  lastActivity: string;
  nextAction: string;
  meetingComplete?: boolean;
  meetingMinutes?: string;
  verifiedAmount?: number;
  payments?: { id: string; amount: number; date: string; reference: string; verified: boolean }[];
  activities?: { id: string; title: string; at: string; note: string }[];
  lostReason?: string;
  history: { stage: string; at: string; note?: string }[];
};

export type PipelineActivity = {
  id: string;
  opportunityId: string;
  title: string;
  at: string;
  note: string;
};
