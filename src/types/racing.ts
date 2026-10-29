export type TaskCategory =
  | "life"
  | "learning"
  | "exercise"
  | "chores"
  | "family";
export type TimeSlot = "morning" | "afternoon" | "evening" | "anytime";
export type TaskStatus = "pending" | "submitted" | "completed" | "skipped";
export type Schedule =
  | { kind: "daily" }
  | { kind: "weekly"; weekdays: number[] }
  | { kind: "once"; date: string };
export interface TaskInput {
  title: string;
  description: string;
  steps: string[];
  icon: string;
  category: TaskCategory;
  schedule: Schedule;
  timeSlot: TimeSlot;
  occurrenceKey: string;
  points: number;
  checkMode: "parent" | "self";
  enabled: boolean;
  sortOrder: number;
}
export interface TaskDefinition extends TaskInput {
  id: string;
  createdAt: number;
  updatedAt: number;
}
export interface DailyTask extends TaskInput {
  id: string;
  definitionId: string;
  date: string;
  status: TaskStatus;
  submittedAt?: number;
  completedAt?: number;
  skippedAt?: number;
  approvedBy?: "parent" | "self";
  submission: number;
}
export interface PointTransaction {
  id: string;
  sourceId: string;
  type: "earn" | "redeem" | "refund" | "adjust";
  amount: number;
  createdAt: number;
  note: string;
}
export interface RewardInput {
  title: string;
  icon: string;
  type: "cosmetic" | "real_world";
  cost: number;
  enabled: boolean;
  description: string;
  cosmeticSlot?: "color" | "sticker" | "wheel";
  assetId?: string;
}
export interface RewardDefinition extends RewardInput {
  id: string;
}
export interface Redemption {
  id: string;
  rewardId: string;
  rewardTitleSnapshot: string;
  costSnapshot: number;
  status: "requested" | "approved" | "fulfilled" | "rejected" | "cancelled";
  requestedAt: number;
  approvedAt?: number;
  fulfilledAt?: number;
  cancelledAt?: number;
}
export interface AuditEvent {
  id: string;
  entityId: string;
  type: string;
  at: number;
  note: string;
}
export interface FeedbackEvent {
  id: string;
  date: string;
  points: number;
  taskTitle: string;
}
export interface RacingState {
  schemaVersion: 1;
  revision: number;
  initializedAt: number;
  generatedDates: string[];
  taskDefinitions: TaskDefinition[];
  dailyTasks: DailyTask[];
  pointTransactions: PointTransaction[];
  rewards: RewardDefinition[];
  redemptions: Redemption[];
  auditEvents: AuditEvent[];
  garage: {
    ownedItemIds: string[];
    equipped: { colorId: string; stickerId?: string; wheelId?: string };
  };
  feedbackEvents: FeedbackEvent[];
  playedFeedbackEventIds: string[];
  celebratedDates: string[];
  achievements: {
    firstTaskAt?: number;
    firstRaceAt?: number;
    tenTasksAt?: number;
  };
  parentPreferences: {
    soundsEnabled: boolean;
    reduceMotion: boolean;
    targetRewardId?: string;
  };
}
export type RacingCommand =
  | { type: "ensure"; date: string }
  | { type: "saveTask"; id?: string; input: TaskInput; applyToday?: boolean }
  | { type: "addToday"; definitionId: string }
  | { type: "submit" | "approve" | "reject" | "skip"; id: string }
  | { type: "saveReward"; id?: string; input: RewardInput }
  | { type: "buy" | "request"; id: string }
  | {
      type: "approveReward" | "rejectReward" | "cancelReward" | "fulfillReward";
      id: string;
    }
  | { type: "equip"; colorId: string; stickerId?: string; wheelId?: string }
  | { type: "feedback"; ids: string[]; celebratedDate?: string }
  | {
      type: "preferences";
      soundsEnabled: boolean;
      reduceMotion: boolean;
      targetRewardId?: string;
    };
