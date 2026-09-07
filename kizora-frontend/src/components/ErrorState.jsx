import React from 'react';
import { AlertCircle, RefreshCw, Compass, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ErrorState = ({
  title = 'Something went wrong',
  message = 'We encountered an error loading this content. Please try again.',
  onRetry,
  showBrowse = true,
  showBack = false,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 my-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] max-w-lg mx-auto">
      <div className="w-12 h-12 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center mb-4 text-[var(--text-secondary)]">
        <AlertCircle className="w-6 h-6 text-amber-400" />
      </div>

      <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] mb-2">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-[var(--text-secondary)] mb-6 max-w-sm leading-relaxed">
        {message}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try Again
          </button>
        )}

        {showBrowse && (
          <button
            onClick={() => navigate('/browse')}
            className="btn-secondary inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium"
          >
            <Compass className="w-3.5 h-3.5" />
            Browse Anime
          </button>
        )}

        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Go Back
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorState;
