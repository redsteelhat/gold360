import React, { createContext, useContext, useState } from 'react';

// Context oluştur
const AlertDialogContext = createContext<{ isOpen: boolean; setIsOpen: (open: boolean) => void } | undefined>(undefined);

interface AlertDialogProps {
  children: React.ReactNode;
}

const AlertDialog: React.FC<AlertDialogProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AlertDialogContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </AlertDialogContext.Provider>
  );
};

interface AlertDialogTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

const AlertDialogTrigger: React.FC<AlertDialogTriggerProps> = ({ 
  asChild, 
  children 
}) => {
  const context = useContext(AlertDialogContext);
  
  if (!context) {
    throw new Error('AlertDialogTrigger must be used within an AlertDialog');
  }
  
  const { setIsOpen } = context;
  
  if (asChild) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(true);
        if ((children as any).props.onClick) {
          (children as any).props.onClick(e);
        }
      },
    });
  }
  
  return (
    <button 
      type="button" 
      onClick={() => setIsOpen(true)}
    >
      {children}
    </button>
  );
};

const AlertDialogPortal: React.FC<{children: React.ReactNode}> = ({ children }) => {
  return <>{children}</>;
};

interface AlertDialogOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

const AlertDialogOverlay = React.forwardRef<
  HTMLDivElement,
  AlertDialogOverlayProps
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`fixed inset-0 z-50 bg-black/80 ${className || ''}`}
      {...props}
    />
  );
});
AlertDialogOverlay.displayName = "AlertDialogOverlay";

interface AlertDialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

const AlertDialogContent = React.forwardRef<
  HTMLDivElement,
  AlertDialogContentProps
>(({ className, ...props }, ref) => {
  const context = useContext(AlertDialogContext);
  
  if (!context) {
    throw new Error('AlertDialogContent must be used within an AlertDialog');
  }
  
  const { isOpen } = context;
  
  if (!isOpen) {
    return null;
  }
  
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <div
        ref={ref}
        className={`fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] grid w-full max-w-lg gap-4 border bg-white p-6 shadow-lg duration-200 sm:rounded-lg ${className || ''}`}
        {...props}
      />
    </AlertDialogPortal>
  );
});
AlertDialogContent.displayName = "AlertDialogContent";

const AlertDialogHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`flex flex-col space-y-2 text-left ${className || ''}`}
    {...props}
  />
));
AlertDialogHeader.displayName = "AlertDialogHeader";

const AlertDialogFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className || ''}`}
    {...props}
  />
));
AlertDialogFooter.displayName = "AlertDialogFooter";

const AlertDialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={`text-lg font-semibold ${className || ''}`}
    {...props}
  />
));
AlertDialogTitle.displayName = "AlertDialogTitle";

const AlertDialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={`text-sm text-gray-600 ${className || ''}`}
    {...props}
  />
));
AlertDialogDescription.displayName = "AlertDialogDescription";

interface AlertDialogActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const AlertDialogAction = React.forwardRef<
  HTMLButtonElement,
  AlertDialogActionProps
>(({ className, children, ...props }, ref) => {
  const context = useContext(AlertDialogContext);
  
  if (!context) {
    throw new Error('AlertDialogAction must be used within an AlertDialog');
  }
  
  const { setIsOpen } = context;
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (props.onClick) {
      props.onClick(e);
    }
    setIsOpen(false);
  };
  
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-white hover:bg-primary/90 h-10 px-4 py-2 ${className || ''}`}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
});
AlertDialogAction.displayName = "AlertDialogAction";

const AlertDialogCancel = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const context = useContext(AlertDialogContext);
  
  if (!context) {
    throw new Error('AlertDialogCancel must be used within an AlertDialog');
  }
  
  const { setIsOpen } = context;
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (props.onClick) {
      props.onClick(e);
    }
    setIsOpen(false);
  };
  
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-200 bg-transparent hover:bg-gray-100 hover:text-gray-900 h-10 px-4 py-2 ${className || ''}`}
      onClick={handleClick}
      {...props}
    >
      {children || "İptal"}
    </button>
  );
});
AlertDialogCancel.displayName = "AlertDialogCancel";

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}; 