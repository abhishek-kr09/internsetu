import { useEffect } from 'react';

const StatusBanner = ({ text, onClear }) => {
  useEffect(() => {
    if (!text) return undefined;
    const timer = setTimeout(() => {
      onClear?.();
    }, 3200);
    return () => clearTimeout(timer);
  }, [text, onClear]);

  if (!text) return null;

  const isError = /error|invalid|unauthorized|failed|forbidden|expired/i.test(text);

  return (
    <div className="pointer-events-none fixed z-[70] bottom-6 right-6 flex items-end">
      <div className={`pointer-events-auto rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-md ${
        isError
          ? 'border-rose-500/50 bg-rose-500/15 text-rose-200'
          : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
      }`}>
        <div className="flex items-start gap-4">
          <p className="max-w-sm">{text}</p>
          <button
            onClick={() => onClear?.()}
            className="rounded-md px-2 py-0.5 text-xs text-zinc-200/80 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusBanner;
