import { db, Timestamp } from './firebase/firebaseAdminSingleton';
import { Collections } from './firebase/firebaseConstants';
import { AutomationLog, LogEntry } from '../types/types';

/**
 * Session-based logger that accumulates logs in memory
 * and writes them to Firestore at the end of the session.
 *
 * Pattern from listicle-v2 - reduces Firestore writes and creates atomic log entries.
 */
class LoggerClass {
  private session: Partial<AutomationLog> | null = null;
  private logs: LogEntry[] = [];
  private deckContext: { deckId?: string; fileName?: string } = {};

  /**
   * Start a new logging session
   */
  startSession(params: { action: string; deckId?: string }): void {
    this.session = {
      action: params.action,
      deckId: params.deckId,
      status: 'completed',
      startedAt: Timestamp.now(),
      logs: [],
      errors: [],
      metadata: {},
    };
    this.logs = [];
    this.deckContext = params.deckId ? { deckId: params.deckId } : {};

    console.log(`\n🎬 Starting session: ${params.action}`);
  }

  /**
   * Set deck context for logging
   */
  setDeckContext(context: { deckId: string; fileName?: string }): void {
    this.deckContext = context;
    if (this.session) {
      this.session.deckId = context.deckId;
    }

    console.log(`📄 Deck context: ${context.fileName || context.deckId}`);
  }

  /**
   * Add a log entry to the current session
   */
  add(message: string, data?: Record<string, any>): void {
    const logEntry: LogEntry = {
      timestamp: Timestamp.now(),
      message,
      data,
    };

    this.logs.push(logEntry);

    // Also log to console for real-time debugging
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    console.log(`   ${message}${dataStr}`);
  }

  /**
   * Add an error to the current session
   */
  error(message: string, error?: any): void {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (!this.session) {
      console.error(`❌ ${message}: ${errorMessage}`);
      return;
    }

    if (!this.session.errors) {
      this.session.errors = [];
    }

    this.session.errors.push(`${message}: ${errorMessage}`);
    this.session.status = 'failed';

    console.error(`❌ ${message}: ${errorMessage}`);
  }

  /**
   * End the session and write logs to Firestore
   */
  async endSession(params?: {
    status?: 'completed' | 'failed' | 'no_items_found';
    metadata?: Record<string, any>;
  }): Promise<void> {
    if (!this.session) {
      console.warn('⚠️  No active session to end');
      return;
    }

    // Update session with final details
    if (params?.status) {
      this.session.status = params.status;
    }
    if (params?.metadata) {
      this.session.metadata = { ...this.session.metadata, ...params.metadata };
    }

    this.session.completedAt = Timestamp.now();
    this.session.logs = this.logs;

    // Write to Firestore
    try {
      await db.collection(Collections.AUTOMATION_LOGS).add(this.session);

      const duration = this.session.completedAt.toMillis() - this.session.startedAt!.toMillis();
      const statusEmoji = this.session.status === 'completed' ? '✅' :
                         this.session.status === 'failed' ? '❌' : '⚠️';

      console.log(`${statusEmoji} Session ended: ${this.session.status} (${duration}ms)\n`);
    } catch (error) {
      console.error('Failed to write automation log:', error);
    }

    // Clear session
    this.session = null;
    this.logs = [];
    this.deckContext = {};
  }

  /**
   * Get the current deck context
   */
  getDeckContext(): { deckId?: string; fileName?: string } {
    return this.deckContext;
  }
}

// Export singleton instance
export const Logger = new LoggerClass();
