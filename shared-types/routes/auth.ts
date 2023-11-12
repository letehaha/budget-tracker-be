import { UserModel } from 'shared-types';
import { BodyPayload } from './index';

export interface AuthLoginBody extends BodyPayload {
  username: UserModel['username'];
  password: UserModel['password'];
}
// Bearer token
export interface AuthLoginResponse {
  token: string;
}

export interface AuthRegisterBody extends BodyPayload {
  username: UserModel['username'];
  password: UserModel['password'];
}
export interface AuthRegisterResponse {
  user: UserModel;
}
