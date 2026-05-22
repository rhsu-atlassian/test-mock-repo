import request from 'supertest';

import { buildApp } from '../app';

const authHeaders = {
  'x-tenant-id': 'tenant-1',
  'x-user-id': 'user-1',
  'x-correlation-id': 'corr-1',
};

describe('tasks API', () => {
  it('rejects requests without auth headers', async () => {
    const app = buildApp();
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
  });

  it('creates and lists a task', async () => {
    const app = buildApp();
    const createRes = await request(app)
      .post('/api/tasks')
      .set(authHeaders)
      .send({
        name: 'send-email',
        payload: { to: 'a@b.com' },
        metadata: { createdBy: 'user-1' },
      });
    expect(createRes.status).toBe(201);
    expect(createRes.body.task.name).toBe('send-email');

    const listRes = await request(app).get('/api/tasks').set(authHeaders);
    expect(listRes.status).toBe(200);
    expect(listRes.body.tasks).toHaveLength(1);
  });
});
