import 'dotenv/config';
import express from 'express';
import { JobController } from './interfaces/controller/JobController.js';

async function bootstrap() {
  const app = express();
  app.use(express.json());

  const jobController = new JobController();

  app.post('/jobs/:type', jobController.createJob);
  app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'job-service' });
});
  app.get('/jobs/:id', jobController.getJobStatus);

  const PORT = process.env.PORT || 3003;
  app.listen(PORT, () => {
    console.log(`✅ Job Service & Worker running on http://localhost:${PORT}`);
  });
}

bootstrap().catch(console.error);