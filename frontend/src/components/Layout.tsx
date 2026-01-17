import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';

export function Layout() {
  return (
    <div className="min-h-screen">
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
