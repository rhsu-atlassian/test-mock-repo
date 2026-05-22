import type { Task, TaskId, CreateTaskInput, UpdateTaskInput } from '@myco/types';

/**
 * Generic repository abstraction.
 * Cross-package generic misuse is a deliberate error vector for stress-testing.
 */
export interface Repository<T, TId = string> {
  findById(id: TId): Promise<T | null>;
  findAll(): Promise<ReadonlyArray<T>>;
  create(input: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  update(id: TId, patch: Partial<T>): Promise<T>;
  delete(id: TId): Promise<void>;
}

export class InMemoryTaskRepository implements Repository<Task, TaskId> {
  private readonly store = new Map<TaskId, Task>();

  async findById(id: TaskId): Promise<Task | null> {
    return this.store.get(id) ?? null;
  }

  async findAll(): Promise<ReadonlyArray<Task>> {
    return Array.from(this.store.values());
  }

  async create(input: CreateTaskInput): Promise<Task> {
    const now = new Date();
    const task: Task = {
      id: `task_${Math.random().toString(36).slice(2, 11)}`,
      name: input.name,
      status: 'pending',
      priority: input.priority ?? 'medium',
      payload: input.payload,
      metadata: input.metadata,
      createdAt: now,
      updatedAt: now,
      retryCount: 0,
      maxRetries: input.maxRetries ?? 3,
      scheduledFor: input.scheduledFor,
    };
    this.store.set(task.id, task);
    return task;
  }

  async update(id: TaskId, patch: UpdateTaskInput): Promise<Task> {
    const existing = this.store.get(id);
    if (!existing) {
      throw new Error(`Task not found: ${id}`);
    }
    const updated: Task = {
      ...existing,
      ...patch,
      updatedAt: new Date(),
    };
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: TaskId): Promise<void> {
    this.store.delete(id);
  }

  async findByStatus(status: Task['status']): Promise<ReadonlyArray<Task>> {
    return Array.from(this.store.values()).filter((t) => t.status === status);
  }
}
