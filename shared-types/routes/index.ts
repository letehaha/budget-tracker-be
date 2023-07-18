export * from './monobank';
export * from './auth';
export * from './stats';

export type BodyPayload = {
  [key: string | number]: string | number | boolean | undefined;
}
export type QueryPayload = {
  [key: string]: string | number | boolean | undefined;
}
