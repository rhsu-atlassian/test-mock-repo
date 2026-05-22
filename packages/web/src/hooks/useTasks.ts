import { useEffect, useState } from 'react';

import { HttpClient, TaskClient } from '@myco/client';
import type { Task } from '@myco/types';

export interface UseTasksResult {
  readonly tasks: ReadonlyArray<Task>;
  readonly loading: boolean;
  readonly error: string | null;
  readonly refresh: () => Promise<void>;
}

export function useTasks(baseUrl: string): UseTasksResult {
  const [tasks, setTasks] = useState<ReadonlyArray<Task>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const http = new HttpClient({ baseUrl });
      const client = new TaskClient(http);
      const result = await client.list();
      setTasks(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [baseUrl]);

  return { tasks, loading, error, refresh };
}
