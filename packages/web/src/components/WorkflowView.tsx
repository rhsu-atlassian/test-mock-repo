import * as React from 'react';

import type { Workflow } from '@myco/types';

export interface WorkflowViewProps {
  readonly workflow: Workflow;
}

export function WorkflowView({ workflow }: WorkflowViewProps): React.ReactElement {
  return (
    <div className="workflow-view">
      <h2>{workflow.name}</h2>
      <p>Status: {workflow.status}</p>
      <ol>
        {workflow.steps.map((step) => (
          <li key={step.id}>
            <span>{step.taskName}</span>
            {step.dependsOn.length > 0 ? (
              <em> (depends on: {step.dependsOn.join(', ')})</em>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
