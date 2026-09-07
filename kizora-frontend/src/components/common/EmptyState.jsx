import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState = ({ title = 'No data found', description = 'There is nothing to show here right now.', icon: Icon = Inbox }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center text-kz-muted">
      <Icon size={48} className="mb-4 opacity-50" />
      <h3 className="text-lg font-semibold text-kz-text mb-1">{title}</h3>
      <p>{description}</p>
    </div>
  );
};
