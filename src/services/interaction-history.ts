export interface InteractionEntry {
  timestamp: Date;
  type: 'input' | 'selection' | 'action';
  label: string;
  value: string;
}

class InteractionHistoryService {
  private history: InteractionEntry[] = [];
  private static instance: InteractionHistoryService;

  private constructor() {}

  static getInstance(): InteractionHistoryService {
    if (!InteractionHistoryService.instance) {
      InteractionHistoryService.instance = new InteractionHistoryService();
    }
    return InteractionHistoryService.instance;
  }

  record(type: InteractionEntry['type'], label: string, value: string): void {
    this.history.push({
      timestamp: new Date(),
      type,
      label,
      value
    });
  }

  getHistory(): InteractionEntry[] {
    return [...this.history];
  }

  getFormattedHistory(): string[] {
    return this.history.map(entry => `${entry.label}: ${entry.value}`);
  }

  clear(): void {
    this.history = [];
  }

  getLastEntries(count: number = 5): InteractionEntry[] {
    return this.history.slice(-count);
  }
}

export const InteractionHistory = InteractionHistoryService.getInstance();