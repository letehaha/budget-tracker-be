import request from 'supertest';
import { RESPONSE_STATUS, ERROR_CODES } from 'shared-types';
import { app, serverInstance, redisClient } from '@root/app';

describe('Login service', () => {
  afterAll(() => {
    redisClient.quit();
    serverInstance.close();
  });

  it('should return correct error for unexisting user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        password: 'unexisting-password',
        username: 'unexisting-user',
      });

    expect(res.statusCode).toEqual(404);
    expect(res.body.status).toEqual(RESPONSE_STATUS.error);
    expect(res.body.response.code).toEqual(ERROR_CODES.notFound);
  })
})