import { User } from "../entities/User";

export interface IUserCache{
    get(id:string):Promise<User|null>;
    set(id:string,user:User,ttlSeconds:number):Promise<void>;
    invalidate(id:string):Promise<void>;
}