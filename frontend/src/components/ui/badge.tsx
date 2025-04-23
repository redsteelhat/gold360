import React from 'react';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

const getBadgeColors = (variant: BadgeVariant): string => {
  const colors = {
    default: 'bg-blue-500 text-white',
    secondary: 'bg-gray-500 text-white',
    destructive: 'bg-red-500 text-white',
    outline: 'bg-transparent border border-gray-300 text-gray-700',
    success: 'bg-green-500 text-white',
    warning: 'bg-yellow-500 text-white',
  };
  return colors[variant];
};

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const colors = getBadgeColors(variant);
    return (
      <div
        ref={ref}
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors} ${className}`}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge }; 