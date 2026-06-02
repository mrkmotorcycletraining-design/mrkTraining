export interface UserModel {
  id: number;
  emailUsername: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'TRAINER' | 'CLIENT';
  active: boolean;
}
