import * as React from 'react';

import type { Task, TaskStatus } from '@myco/types';

export interface TaskListProps {
  readonly tasks: ReadonlyArray<Task>;
  readonly filterStatus?: TaskStatus;
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  pending: '#888',
  running: '#1976d2',
  completed: '#388e3c',
  failed: '#d32f2f',
  retrying: '#f57c00',
  cancelled: '#616161',
};

export function TaskList({ tasks, filterStatus }: TaskListProps): React.ReactElement {
  const visible = filterStatus ? tasks.filter((t) => t.status === filterStatus) : tasks;
  const sorted = visible.slice().sort((a, b) => b.priority - a.priority);

  return (
    <ul className="task-list">
      {sorted.map((task) => (
        <li key={task.id} style={{ borderLeft: `4px solid ${STATUS_COLORS[task.status]}` }}>
          <strong>{task.name}</strong>
          <span>priority: {task.priority}</span>
          <span>status: {task.status}</span>
          <span>retries: {task.retryCount} / {task.maxRetries}</span>
        </li>
      ))}
    </ul>
  );
}
