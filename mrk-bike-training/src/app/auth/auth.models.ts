export interface LoginRequest {
  emailUsername: string;
  password: string;
}

export interface JwtResponse {
  token: string;
  role: string;
  userId: number;
}

export interface JwtPayload {
  sub: string;
  role: string;
  active: boolean;
  exp: number;
  iat?: number;
}
