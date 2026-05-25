import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { ConnectionsRepository } from '../src/modules/ingestion/infra/persistence/repositories/notifications.repository.db';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  const connectionsRepositoryMock = {
    createConnection: jest.fn().mockResolvedValue(undefined),
    updateConnection: jest.fn().mockResolvedValue(undefined),
    findById: jest.fn().mockResolvedValue({ id: 'tx-1', connectionId: '' }),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConnectionsRepository)
      .useValue(connectionsRepositoryMock)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET / returns empty hello from AppService', () => {
    return request(app.getHttpServer()).get('/').expect(200).expect('');
  });

  it('POST /ingest/register returns a transaction id', () => {
    return request(app.getHttpServer())
      .post('/ingest/register')
      .expect(201)
      .expect((res) => {
        expect(typeof res.text).toBe('string');
        expect(res.text.length).toBeGreaterThan(10);
      });
  });
});
