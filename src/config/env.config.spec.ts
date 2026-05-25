import { AppEnvsConfig, EnvValidationSchema } from './env.config';
import { mockAppEnvs, setTestEnvVars } from 'src/test/test-utils';

describe('env.config', () => {
  beforeEach(() => {
    setTestEnvVars();
  });

  it('validates required environment variables', () => {
    const { error } = EnvValidationSchema.validate(process.env, { allowUnknown: true });
    expect(error).toBeUndefined();
  });

  it('fails when a required variable is missing', () => {
    const env = { ...process.env };
    delete env.OPENAI_API_KEY;
    const { error } = EnvValidationSchema.validate(env, { allowUnknown: true });
    expect(error).toBeDefined();
  });

  it('maps environment variables via registerAs factory', () => {
    const config = AppEnvsConfig();
    expect(config).toMatchObject(mockAppEnvs);
  });
});
