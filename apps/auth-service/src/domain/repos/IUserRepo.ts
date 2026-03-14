import { User } from "../entities/User";

export interface IUserRepo{
    findByEmail(email:string):Promise<User|null>;
    save(user: Omit<User, 'id' | 'createdAt'>): Promise<User>;
}