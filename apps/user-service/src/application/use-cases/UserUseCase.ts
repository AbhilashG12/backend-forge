import { IUserRepo } from "../../domain/repos/IUserRepo";
import { IUserCache } from "../../domain/repos/IUserCache";
import { User } from "../../domain/entities/User";

export class UserUseCase{
    constructor(
        private userRepo : IUserRepo,
        private userCache : IUserCache,
    ){}

    async createUser(data:Omit<User,'id'|'createdAt'>){
        return this.userRepo.create(data);
    }

    async getUser(id:string){
        const cachedUser = await this.userCache.get(id);
        if(cachedUser) return cachedUser;

        const user = await this.userRepo.findById(id);
        if(!user) throw new Error("User not found");

        await this.userCache.set(id,user,3600);
        return user;
    }

    async updateUser(id:string,data:Partial<User>){
        const updatedUser = await this.userRepo.update(id,data);
        await this.userCache.invalidate(id);
        return updatedUser;
    }

    async deleteUser(id:string){
        await this.userRepo.delete(id);
        await this.userCache.invalidate(id);
    }

    async listUsers(page:number,limit:number,role?:string){
        return this.userRepo.list(page,limit,role)
    }
}