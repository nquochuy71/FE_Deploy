import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { ChatWidget } from '../chat';

export const MainLayout = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--color-cream)' }}>
      <Header />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <ChatWidget />
      <Footer />
    </div>
  );
};
