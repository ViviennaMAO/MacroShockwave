import { Link, useLocation } from 'react-router-dom';
import { useLuffa } from '../hooks/useLuffa';
import { shortenAddress } from '../lib/utils';
import { motion } from 'framer-motion';

export function Header() {
  const location = useLocation();
  const { account, isConnected, isLoading } = useLuffa();

  const navItems = [
    { path: '/', label: '主页' },
    { path: '/portfolio', label: '投资组合' },
    { path: '/leaderboard', label: '排行榜' },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-bg-primary/80 border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="text-2xl">⚡</div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              MacroShockwave
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="relative group"
              >
                <span
                  className={`text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </span>
                {isActive(item.path) && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-secondary"
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Wallet */}
          <div className="flex items-center space-x-4">
            {isConnected && account ? (
              <Link
                to="/profile"
                className="flex items-center space-x-3 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
              >
                {account.avatar ? (
                  <img
                    src={account.avatar}
                    alt={account.username || 'User'}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary" />
                )}
                <span className="text-sm font-medium">
                  {account.username || shortenAddress(account.address)}
                </span>
              </Link>
            ) : (
              <button
                disabled={isLoading}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity font-medium text-sm disabled:opacity-50"
              >
                {isLoading ? '连接中...' : '连接钱包'}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
