import { cn } from '@/lib/utils';

type StatusKind =
  | 'pending'
  | 'preparing'
  | 'delivering'
  | 'paid'
  | 'completed'
  | 'payment_requested'
  | 'payment_verifying'
  | 'active'
  | 'inactive'
  | 'draft';

type Variant = 'order' | 'subscription' | 'generic';

const ORDER_STYLES: Record<string, { dot: string; bg: string; text: string; label: string }> = {
  pending: {
    dot: 'bg-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
    text: 'text-purple-300',
    label: 'Received',
  },
  preparing: {
    dot: 'bg-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/20',
    text: 'text-yellow-300',
    label: 'Preparing',
  },
  delivering: {
    dot: 'bg-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    text: 'text-blue-300',
    label: 'Delivering',
  },
  paid: {
    dot: 'bg-gray-400',
    bg: 'bg-white/5 border-white/10',
    text: 'text-gray-300',
    label: 'Paid',
  },
  completed: {
    dot: 'bg-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
    text: 'text-green-300',
    label: 'Completed',
  },
  payment_requested: {
    dot: 'bg-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20',
    text: 'text-orange-300',
    label: 'Payment Pending',
  },
  payment_verifying: {
    dot: 'bg-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
    text: 'text-cyan-300',
    label: 'Verifying',
  },
};

const SUB_STYLES: Record<string, { dot: string; bg: string; text: string; label: string }> = {
  active: {
    dot: 'bg-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
    text: 'text-green-300',
    label: 'Active',
  },
  inactive: {
    dot: 'bg-red-400',
    bg: 'bg-red-500/10 border-red-500/20',
    text: 'text-red-300',
    label: 'Disabled',
  },
  draft: {
    dot: 'bg-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/20',
    text: 'text-yellow-300',
    label: 'Draft',
  },
};

export function StatusBadge({
  status,
  variant = 'order',
  label,
  className,
  withDot = true,
}: {
  status: string;
  variant?: Variant;
  label?: string;
  className?: string;
  withDot?: boolean;
}) {
  const map = variant === 'order' ? ORDER_STYLES : SUB_STYLES;
  const style = map[status] ?? {
    dot: 'bg-gray-400',
    bg: 'bg-white/5 border-white/10',
    text: 'text-gray-300',
    label: status,
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-medium',
        style.bg,
        style.text,
        className
      )}
    >
      {withDot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', style.dot)} aria-hidden />
      )}
      {label ?? style.label}
    </span>
  );
}
