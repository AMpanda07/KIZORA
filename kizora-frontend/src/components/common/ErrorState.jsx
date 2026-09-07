import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './Button';

export const ErrorState = ({ message = 'Something went wrong.', onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-kz-surface rounded border border-kz-border">
      <AlertCircle className="text-kz-danger mb-4" size={48} />
      <h3 className="text-xl font-semibold mb-2">Error</h3>
      <p className="text-kz-muted mb-4">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          Try Again
        </Button>
      )}
    </div>
  );
};
