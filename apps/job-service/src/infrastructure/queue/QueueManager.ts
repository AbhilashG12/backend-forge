import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null 
});


export const jobQueue = new Queue('PlatformJobs', { connection: connection as any });

export const jobWorker = new Worker('PlatformJobs', async (job: Job) => {
  console.log(`🚀 Processing job ${job.id} of type: ${job.name}`);

  switch (job.name) {
    case 'sendEmail':
      return await handleSendEmail(job.data);
    case 'generateReport':
      return await handleGenerateReport(job.data);
    case 'resizeImage':
      return await handleResizeImage(job.data);
    default:
      throw new Error(`Unknown job type: ${job.name}`);
  }
}, { connection: connection as any });

async function handleSendEmail(data: { email: string }) {
  console.log(`📧 Sending email to ${data.email}...`);
  await new Promise(res => setTimeout(res, 2000)); 
  console.log(`✅ Email sent to ${data.email}`);
  return { success: true, sentTo: data.email };
}

async function handleGenerateReport(data: { userId: string }) {
  console.log(`📊 Generating report for user ${data.userId}...`);
  await new Promise(res => setTimeout(res, 5000)); 
  console.log(`✅ Report generated for ${data.userId}`);
  return { success: true, reportUrl: 'https://cdn.example.com/report.pdf' };
}

async function handleResizeImage(data: { imageUrl: string }) {
  console.log(`🖼️ Resizing image from ${data.imageUrl}...`);
  if (Math.random() > 0.5) throw new Error("Image download failed timeout");
  return { success: true, resizedUrl: 'https://cdn.example.com/small.jpg' };
}


jobWorker.on('failed', (job: Job | undefined, err: Error) => {
  if (job) {
    console.error(`❌ [DLQ] Job ${job.id} failed after ${job.attemptsMade} attempts. Reason: ${err.message}`);
  }
});

jobWorker.on('completed', (job: Job) => {
  console.log(`🎉 Job ${job.id} completed successfully!`);
});