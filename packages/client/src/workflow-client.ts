import type { Workflow, WorkflowId, CreateWorkflowInput, WorkflowExecution } from '@myco/types';

import type { HttpClient } from './http-client';

export class WorkflowClient {
  constructor(private readonly http: HttpClient) {}

  async list(): Promise<ReadonlyArray<Workflow>> {
    const res = await this.http.get<{ workflows: Workflow[] }>('/api/workflows');
    return res.data.workflows;
  }

  async getById(id: WorkflowId): Promise<Workflow | null> {
    try {
      const res = await this.http.get<{ workflow: Workflow }>(`/api/workflows/${id}`);
      return res.data.workflow;
    } catch {
      return null;
    }
  }

  async create(input: CreateWorkflowInput): Promise<Workflow> {
    const res = await this.http.post<{ workflow: Workflow }>('/api/workflows', input);
    return res.data.workflow;
  }

  async start(id: WorkflowId): Promise<WorkflowExecution> {
    const res = await this.http.post<{ execution: WorkflowExecution }>(
      `/api/workflows/${id}/start`,
      {},
    );
    return res.data.execution;
  }
}
