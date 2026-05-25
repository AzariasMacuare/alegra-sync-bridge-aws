import { AppService } from './app.service';

describe('AppService', () => {
  it('returns empty string from getHello', () => {
    const service = new AppService();
    expect(service.getHello()).toBe('');
  });
});
