import { envConfig } from './env.config';

describe('envConfig', () => {
  it('provides the expected application defaults', () => {
    expect(envConfig.app).toEqual({
      nodeEnv: expect.any(String),
      port: expect.any(Number),
      corsOrigin: expect.any(String),
      frontendUrl: expect.any(String),
    });
  });

  it('provides JWT expiry and email configuration', () => {
    expect(envConfig.jwt.secret).toEqual(expect.any(String));
    expect(envConfig.jwt.accessTokenExpiresIn).toEqual(expect.any(String));
    expect(envConfig.jwt.refreshTokenExpiresIn).toEqual(expect.any(String));
    expect(envConfig.sendlib.apiKey).toEqual(expect.any(String));
    expect(envConfig.sendlib.from).toEqual(expect.any(String));
  });
});
