import { API_ERROR_CODES, API_RESPONSE_STATUS } from 'shared-types';
import { makeRequest } from '@tests/helpers';

describe('Login service', () => {
  it('should return correct error for unexisting user', async () => {
    await new Promise(resolve => setTimeout(resolve, 4000))
    const res = await makeRequest({
      method: 'post',
      url: '/auth/login',
      payload: {
        password: 'unexisting-password',
        username: 'unexisting-user',
      },
    });

    expect(res.statusCode).toEqual(404);
    expect(res.body.status).toEqual(API_RESPONSE_STATUS.error);
    expect(res.body.response.code).toEqual(API_ERROR_CODES.notFound);
  })
})
