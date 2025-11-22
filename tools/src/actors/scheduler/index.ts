/**
 * Scheduler
 *
 * Orchestrates all actor cron jobs using node-cron
 *
 * Pattern from listicle-v2: Each job runs independently and checks for work.
 * Jobs are scheduled with overlap prevention to avoid resource exhaustion.
 */

import cron from 'node-cron';
import { validateEnv, isUsingEmulator } from '../../utils/env';
import { extractPDFPages } from '../extractor';
import { critiqueProblemStatement } from '../critic';

// Cron patterns (with second precision)
const EVERY_THIRTY_SECONDS = '*/30 * * * * *';
const EVERY_TWENTY_SECONDS = '*/20 * * * * *';

// Track running jobs to prevent overlap
const runningJobs = new Map<string, boolean>();

/**
 * Wrapper to prevent job overlap
 */
function preventOverlap(jobName: string, jobFn: () => Promise<void>) {
  return async () => {
    if (runningJobs.get(jobName)) {
      console.log(`⏭️  Skipping ${jobName} (previous run still active)`);
      return;
    }

    runningJobs.set(jobName, true);

    try {
      await jobFn();
    } catch (error) {
      console.error(`❌ ${jobName} error:`, error);
    } finally {
      runningJobs.set(jobName, false);
    }
  };
}

/**
 * Initialize and start all cron jobs
 */
function startScheduler(): void {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║        DeckCheck Actor Scheduler Starting...          ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  // Validate environment
  validateEnv();

  // Show environment info
  if (isUsingEmulator()) {
    console.log('🔧 Running against Firebase EMULATOR');
  } else {
    console.log('🚀 Running against PRODUCTION Firebase');
  }

  console.log('\n📅 Scheduling cron jobs...\n');

  // Job 1: Extract PDF pages (every 30 seconds)
  cron.schedule(
    EVERY_THIRTY_SECONDS,
    preventOverlap('Extract PDF Pages', extractPDFPages),
    {
      name: 'Extract PDF Pages',
      timezone: 'America/New_York',
    }
  );
  console.log('   ✓ Extract PDF Pages (every 30s)');

  // Job 2: Critique problem statements (every 20 seconds)
  cron.schedule(
    EVERY_TWENTY_SECONDS,
    preventOverlap('Critique Problem Statements', critiqueProblemStatement),
    {
      name: 'Critique Problem Statements',
      timezone: 'America/New_York',
    }
  );
  console.log('   ✓ Critique Problem Statements (every 20s)');

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║              Scheduler is now running!                ║');
  console.log('║         Press Ctrl+C to stop the scheduler           ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down scheduler...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n👋 Shutting down scheduler...');
  process.exit(0);
});

// Start the scheduler
startScheduler();
