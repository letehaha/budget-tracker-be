export * from './monobank';
export * from './auth';

export type BodyPayload = {
  [key: string | number]: string | number | boolean;
}
export type QueryPayload = {
  [key: string]: string;
}
