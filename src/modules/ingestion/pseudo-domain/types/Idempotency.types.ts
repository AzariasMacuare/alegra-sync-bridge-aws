export enum IdempotencyStatus {
  processing = 'PROCESSING',
  completed = 'COMPLETED',
  failed = 'FAILED',
}

export interface IdempotencyItem {
  id: string;
  ttl: number;
  status: IdempotencyStatus;
  createdAt: string;
  metadata?: any;
}
