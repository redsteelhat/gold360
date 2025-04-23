import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SubItem {
  name: string;
  href: string;
}

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  subItems?: SubItem[];
}

interface SidebarProps {
  items: SidebarItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ items }) => {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({});

  const toggleSubMenu = (itemName: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
  };

  return (
    <div className="h-full w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center">
          <h1 className="text-xl font-bold text-text-primary">
            <span className="text-gold-primary">Gold</span>360
          </h1>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="mt-5 px-2 flex-grow overflow-y-auto">
        <ul className="space-y-1">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded = expandedItems[item.name];
            
            return (
              <li key={item.name} className="mb-1">
                <div className="flex flex-col">
                  <div 
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md cursor-pointer ${
                      isActive
                        ? 'bg-gold-primary/10 text-gold-primary'
                        : 'text-text-secondary hover:bg-gray-50'
                    }`}
                    onClick={() => hasSubItems ? toggleSubMenu(item.name) : null}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {hasSubItems ? (
                      <div className="flex justify-between items-center flex-grow">
                        <span>{item.name}</span>
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'transform rotate-180' : ''}`} 
                          viewBox="0 0 20 20" 
                          fill="currentColor"
                        >
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <Link href={item.href} className="flex-grow">
                        {item.name}
                      </Link>
                    )}
                  </div>
                  
                  {/* Sub Items */}
                  {hasSubItems && isExpanded && (
                    <ul className="ml-8 mt-1 space-y-1">
                      {item.subItems!.map((subItem) => {
                        const isSubItemActive = pathname === subItem.href;
                        return (
                          <li key={subItem.name}>
                            <Link
                              href={subItem.href}
                              className={`block px-4 py-2 text-sm rounded-md ${
                                isSubItemActive
                                  ? 'bg-gold-primary/5 text-gold-primary'
                                  : 'text-text-secondary hover:bg-gray-50'
                              }`}
                            >
                              {subItem.name}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-gold-primary/20 flex items-center justify-center text-gold-primary font-medium">
            U
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-text-primary">User Name</p>
            <p className="text-xs text-text-secondary">user@example.com</p>
          </div>
        </div>
        <button className="mt-4 w-full text-left text-sm text-text-secondary hover:text-text-primary px-2 py-1">
          Log out
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 