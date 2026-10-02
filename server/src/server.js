import app from './app.js';
import prisma from './config/db.js';
import { initDocumentWorker } from './jobs/document.queue.js';
import { DocumentService } from './services/document.service.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log('✓ Successfully connected to PostgreSQL database');

    // Initialize BullMQ Document Processing Worker
    initDocumentWorker((docId) => DocumentService.processDocument(docId));
    console.log('✓ BullMQ Document Worker initialized');

    const server = app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`🚀 JN LMS Server running in ${process.env.NODE_ENV || 'development'} mode`);
      console.log(`📡 Listening on http://localhost:${PORT}`);
      console.log(`🏥 Healthcheck: http://localhost:${PORT}/api/health`);
      console.log(`===============================================`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log('PostgreSQL client disconnected. Process terminated.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

startServer();
