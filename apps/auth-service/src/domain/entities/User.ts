export interface User {
    id: string;
    email: string;
    passwordHash: string;
    role: string;      
    name?: string | null;   
    createdAt: Date;
}