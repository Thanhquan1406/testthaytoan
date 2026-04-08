import toast from 'react-hot-toast';

const base = {
  duration: 2600,
  style: {
    borderRadius: '10px',
    border: '1px solid var(--border-default)',
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)',
  },
};

export const notify = {
  success: (message) => toast.success(message, base),
  error: (message) => toast.error(message, { ...base, duration: 3200 }),
  info: (message) => toast(message, base),
  warning: (message) => toast(message, { ...base, icon: '⚠️' }),
};

