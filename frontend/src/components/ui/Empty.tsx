import { ReactNode } from 'react';

interface EmptyProps {
  icon?: string;
  title?: string;
  description?: string;
  action?: ReactNode;
}

export function Empty({
  icon = '📭',
  title = '暂无数据',
  description,
  action
}: EmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="text-6xl opacity-50">{icon}</div>
      <div className="text-center space-y-2">
        <h3 className="text-lg font-medium text-white">{title}</h3>
        {description && <p className="text-sm text-gray-400">{description}</p>}
      </div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
