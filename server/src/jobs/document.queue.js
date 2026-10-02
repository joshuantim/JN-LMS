import { Queue, Worker } from 'bullmq';
import { redisConnection } from '../config/redis.js';

export const DOCUMENT_QUEUE_NAME = 'document-processing-queue';

export let documentQueue = null;
export let documentWorker = null;

try {
  documentQueue = new Queue(DOCUMENT_QUEUE_NAME, {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
  });
} catch (err) {
  console.warn('⚠ Could not initialize BullMQ Queue:', err.message);
}

/**
 * Initialize document worker
 * @param {Function} processor - Job processing callback
 */
export const initDocumentWorker = (processor) => {
  try {
    documentWorker = new Worker(
      DOCUMENT_QUEUE_NAME,
      async (job) => {
        console.log(`[BullMQ Worker] Processing document job ${job.id} for document: ${job.data.documentId}`);
        return processor(job.data.documentId);
      },
      {
        connection: redisConnection,
        concurrency: 4,
      }
    );

    documentWorker.on('completed', (job) => {
      console.log(`[BullMQ Worker] Document job ${job.id} completed successfully`);
    });

    documentWorker.on('failed', (job, err) => {
      console.error(`[BullMQ Worker] Document job ${job?.id} failed:`, err.message);
    });

    return documentWorker;
  } catch (err) {
    console.warn('⚠ Could not initialize BullMQ Worker:', err.message);
    return null;
  }
};

/**
 * Queue a document for background text extraction & chunking
 * Fallback to direct synchronous execution if Redis queue is unavailable
 */
export const enqueueDocumentProcessing = async (documentId, fallbackProcessor) => {
  if (documentQueue) {
    try {
      const job = await documentQueue.add('extract-and-chunk', { documentId });
      return { queued: true, jobId: job.id };
    } catch (err) {
      console.warn(`[BullMQ] Enqueue failed for doc ${documentId}. Running fallback processor...`, err.message);
    }
  }

  // Fallback: process asynchronously in-process
  if (fallbackProcessor) {
    setImmediate(async () => {
      try {
        await fallbackProcessor(documentId);
      } catch (err) {
        console.error(`[Fallback Processor] Error processing doc ${documentId}:`, err);
      }
    });
    return { queued: false, mode: 'fallback-direct' };
  }

  return { queued: false };
};
