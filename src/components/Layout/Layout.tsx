import React from 'react';
import Header from './Header';
import Footer from './Footer';
import GuestRoleModal from '../GuestRoleModal';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
      <GuestRoleModal />
    </div>
  );
};

export default Layout;

