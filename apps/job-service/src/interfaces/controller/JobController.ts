import { Request, Response } from 'express';
import { jobQueue } from '../../infrastructure/queue/QueueManager.js';

export class JobController {
  
  createJob = async (req: Request, res: Response) => {
    try {
      const jobType = req.params.type as string; 
      const payload = req.body;

      const job = await jobQueue.add(jobType, payload, {
        attempts: 3, 
        backoff: {
          type: 'exponential',
          delay: 2000 
        },
        priority: jobType === 'sendEmail' ? 1 : 10 
      });

      res.status(202).json({ 
        success: true, 
        message: 'Job accepted', 
        jobId: job.id 
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  };

  getJobStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      // 👇 FIX: Explicitly cast to string
      const id = req.params.id as string;
      const job = await jobQueue.getJob(id);
      
      if (!job) {
        res.status(404).json({ error: 'Job not found' });
        return;
      }

      const state = await job.getState();

      res.json({
        success: true,
        jobId: job.id,
        state, 
        attemptsMade: job.attemptsMade,
        failedReason: job.failedReason,
        returnvalue: job.returnvalue
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  };
}