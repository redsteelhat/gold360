import React, { useState, useRef, useEffect, useContext, createContext } from 'react';

// Context oluştur
const DropdownMenuContext = createContext<{ setIsOpen: (open: boolean) => void } | undefined>(undefined);

interface DropdownMenuProps {
  children: React.ReactNode;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <DropdownMenuContext.Provider value={{ setIsOpen }}>
      <div className="relative inline-block text-left" ref={dropdownRef} data-dropdown>
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            if (child.type === DropdownMenuTrigger) {
              return React.cloneElement(child as React.ReactElement<any>, {
                onClick: () => setIsOpen(!isOpen),
              });
            }
            if (child.type === DropdownMenuContent) {
              return isOpen ? child : null;
            }
            return child;
          }
          return child;
        })}
      </div>
    </DropdownMenuContext.Provider>
  );
};

interface DropdownMenuTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  children: React.ReactNode;
}

const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  DropdownMenuTriggerProps
>(({ asChild, children, ...props }, ref) => {
  if (asChild) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (props.onClick) props.onClick(e);
        if ((children as any).props.onClick) (children as any).props.onClick(e);
      },
      tabIndex: 0,
      onMouseEnter: undefined,
      onFocus: undefined,
      onMouseOver: undefined,
    });
  }
  return (
    <button
      ref={ref}
      type="button"
      {...props}
      onClick={(e) => {
        e.stopPropagation();
        if (props.onClick) props.onClick(e);
      }}
      tabIndex={0}
      onMouseEnter={undefined}
      onFocus={undefined}
      onMouseOver={undefined}
    >
      {children}
    </button>
  );
});
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'end' | 'center';
  sideOffset?: number;
  children: React.ReactNode;
}

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  DropdownMenuContentProps
>(({ align = 'center', className, children, ...props }, ref) => {
  const alignmentClasses = {
    start: 'left-0',
    center: 'left-1/2 transform -translate-x-1/2',
    end: 'right-0',
  };

  return (
    <div
      ref={ref}
      className={`z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 shadow-md animate-in slide-in-from-top-2 absolute mt-2 ${alignmentClasses[align]} ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  );
});
DropdownMenuContent.displayName = "DropdownMenuContent";

interface DropdownMenuItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  inset?: boolean;
  children: React.ReactNode;
}

const DropdownMenuItem = React.forwardRef<
  HTMLButtonElement,
  DropdownMenuItemProps
>(({ className, inset, children, onClick, ...props }, ref) => {
  const ctx = useContext(DropdownMenuContext);
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick(e);
    }
    // Context üzerinden menüyü kapat
    if (ctx && ctx.setIsOpen) {
      ctx.setIsOpen(false);
    }
  };

  return (
    <button
      ref={ref}
      className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 w-full text-left ${
        inset ? 'pl-8' : ''
      } ${className || ''}`}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
});
DropdownMenuItem.displayName = "DropdownMenuItem";

// Yeni bileşenleri ekleyelim
interface DropdownMenuLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  inset?: boolean;
  children: React.ReactNode;
}

const DropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  DropdownMenuLabelProps
>(({ className, inset, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`px-2 py-1.5 text-sm font-semibold ${inset ? 'pl-8' : ''} ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  );
});
DropdownMenuLabel.displayName = "DropdownMenuLabel";

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`-mx-1 my-1 h-px bg-gray-200 ${className || ''}`}
      {...props}
    />
  );
});
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

interface DropdownMenuCheckboxItemProps extends DropdownMenuItemProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const DropdownMenuCheckboxItem = React.forwardRef<
  HTMLButtonElement,
  DropdownMenuCheckboxItemProps
>(({ className, children, checked, onCheckedChange, ...props }, ref) => {
  const ctx = useContext(DropdownMenuContext);
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onCheckedChange) {
      onCheckedChange(!checked);
    }
    if (props.onClick) {
      props.onClick(e);
    }
    if (ctx && ctx.setIsOpen) {
      ctx.setIsOpen(false);
    }
  };

  return (
    <button
      ref={ref}
      className={`relative flex cursor-pointer select-none items-center rounded-sm pl-8 pr-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 w-full text-left ${className || ''}`}
      onClick={handleClick}
      {...props}
    >
      <div className="absolute left-2 flex h-4 w-4 items-center justify-center">
        {checked && (
          <svg 
            width="15" 
            height="15" 
            viewBox="0 0 15 15" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-current"
          >
            <path
              d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z"
              fill="currentColor"
              fillRule="evenodd"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>
      {children}
    </button>
  );
});
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem
}; 