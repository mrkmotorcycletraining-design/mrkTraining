export interface UserModel {
  id: number;
  username: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'TRAINER' | 'CLIENT';
  active: boolean;
}
