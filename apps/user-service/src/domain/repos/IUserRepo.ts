import { User } from "../entities/User";

export interface PaginatedResult<T>{
    data : T[];
    total : number;
    page : number;
    limit : number;
}

export interface IUserRepo{
    create(user: Omit<User, 'id' | 'createdAt'>): Promise<User>;
    findById(id: string): Promise<User | null>;
    update(id: string, data: Partial<User>): Promise<User>;
    delete(id: string): Promise<void>;
    list(page: number, limit: number, roleFilter?: string): Promise<PaginatedResult<User>>;
}