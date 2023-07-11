export * from './monobank';

export type BodyPayload = {
  [key: string | number]: string | number | boolean;
}
export type QueryPayload = {
  [key: string]: string;
}
