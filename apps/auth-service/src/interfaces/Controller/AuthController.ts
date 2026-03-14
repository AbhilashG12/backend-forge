import { Request, Response } from 'express';
import { LoginUser } from '../../application/use-cases/LoginUser.js';
import { loginSchema , registerSchema } from '../validation/authSchema.js';
import { RegisterUser } from '../../application/use-cases/RegisterUser.js';

export class AuthController {
  constructor(private registerUserUseCase : RegisterUser,private loginUserUseCase: LoginUser , ) {}

  register = async (req:Request,res:Response):Promise<void>=>{
    try{
      const parsedData = registerSchema.parse(req.body);
      const result = await this.registerUserUseCase.execute(parsedData.email,parsedData.password);
      res.status(201).json({success:true,data:result})
    }catch(error){
      res.status(400).json({success:false,error})
    }
  }

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const parsedData = loginSchema.parse(req.body);
      const result = await this.loginUserUseCase.execute(
        parsedData.email,
        parsedData.password
      );
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  
}