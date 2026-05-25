import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { Test, TestingModule } from '@nestjs/testing';
import { appEnvsProvider } from 'src/test/test-utils';
import { NotificationsSocketGateway } from './notification.gateway';

const mockSend = jest.fn();

jest.mock('@aws-sdk/client-apigatewaymanagementapi', () => ({
  ApiGatewayManagementApiClient: jest.fn().mockImplementation(() => ({ send: mockSend })),
  PostToConnectionCommand: jest.fn((input) => input),
}));

describe('NotificationsSocketGateway', () => {
  let gateway: NotificationsSocketGateway;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationsSocketGateway, appEnvsProvider],
    }).compile();

    gateway = module.get<NotificationsSocketGateway>(NotificationsSocketGateway);
  });

  it('sends websocket payload using https endpoint derived from wss url', async () => {
    mockSend.mockResolvedValue({});

    await gateway.notifyStep('conn-abc', { step: 3, aditional: { id: '1' } });

    expect(ApiGatewayManagementApiClient).toHaveBeenCalledWith({
      endpoint: 'https://abc123.execute-api.us-east-1.amazonaws.com/prod',
    });
    expect(PostToConnectionCommand).toHaveBeenCalledWith({
      ConnectionId: 'conn-abc',
      Data: Buffer.from(JSON.stringify({ step: 3, aditional: { id: '1' } })),
    });
    expect(mockSend).toHaveBeenCalled();
  });

  it('swallows send errors without throwing', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockSend.mockRejectedValue(new Error('Gone'));

    await expect(gateway.notifyStep('conn-x', { step: 1 })).resolves.toBeUndefined();

    errorSpy.mockRestore();
  });
});
