import { Request, Response } from 'express';
import { UserUseCase } from '../../application/use-cases/UserUseCase';
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email(),
  name: z.string().nullable().optional().default(null),
  role: z.string().optional().default('user'),
});

export class UserController {
  constructor(private useCases: UserUseCase) {}

  create = async (req: Request, res: Response) => {
    try {
      const data = userSchema.parse(req.body);
      const user = await this.useCases.createUser(data);
      res.status(201).json({ success: true, data: user });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  };

  get = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const user = await this.useCases.getUser(id);
      res.json({ success: true, data: user });
    } catch (e: any) { 
      res.status(404).json({ error: e.message }); 
    }
  };

  update = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string
      const user = await this.useCases.updateUser(id, req.body);
      res.json({ success: true, data: user });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  };

  delete = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string
      await this.useCases.deleteUser(id);
      res.json({ success: true, message: 'Deleted' });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  };

  list = async (req: Request, res: Response) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const role = req.query.role as string | undefined;
      
      const result = await this.useCases.listUsers(page, limit, role);
      res.json({ success: true, data: result });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  };
}