import { UserModel } from 'shared-types';
import { BodyPayload } from './index';

export interface AuthLoginBody extends BodyPayload {
  username: string;
  password: string;
}
// Bearer token
export interface AuthLoginResponse {
  token: string;
}

export interface AuthRegisterBody extends BodyPayload {
  username: string;
  password: string;
}
export interface AuthRegisterResponse {
  user: UserModel;
}
