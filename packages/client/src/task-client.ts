import type { Task, TaskId, CreateTaskInput, UpdateTaskInput } from '@myco/types';

import type { HttpClient } from './http-client';

export class TaskClient {
  constructor(private readonly http: HttpClient) {}

  async list(): Promise<ReadonlyArray<Task>> {
    const res = await this.http.get<{ tasks: Task[] }>('/api/tasks');
    return res.data.tasks;
  }

  async getById(id: number): Promise<Task | null> {
    try {
      const res = await this.http.get<{ task: Task }>(`/api/tasks/${id}`);
      return res.data.task;
    } catch {
      return null;
    }
  }

  async create(input: CreateTaskInput): Promise<Task> {
    const res = await this.http.post<{ task: Task }>('/api/tasks', input);
    return res.data.task;
  }

  async update(id: TaskId, patch: UpdateTaskInput): Promise<Task> {
    const res = await this.http.patch<{ task: Task }>(`/api/tasks/${id}`, patch);
    return res.data.task;
  }

  async cancel(id: TaskId): Promise<void> {
    await this.http.delete(`/api/tasks/${id}`);
  }
}
