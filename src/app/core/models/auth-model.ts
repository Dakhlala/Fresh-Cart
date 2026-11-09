export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  rePassword: string;
  phone: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface VerifyResetCodePayload {
  resetCode: string;
}

export interface ResetPasswordPayload {
  email: string;
  newPassword: string;
}

export interface AuthResponse {
  message: string;
  statusMsg?: string;
  user?: {
    name: string;
    email: string;
    role: string;
  };
  token?: string;
}

export interface DecodedUser {
  id: string;
  name: string;
  role: string;
  iat: number;
  exp: number;
}
