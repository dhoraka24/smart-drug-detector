import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Bell,
  Map,
  Settings,
  Cpu,
  Copy,
  Activity,
  LogOut
} from 'lucide-react';
import useAuthStore from '../store/auth';
import { useNavigate } from 'react-router-dom';

const SidebarEnhanced = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/alerts', label: 'Alerts', icon: Bell },
    { path: '/map', label: 'Real-Time Map', icon: Map },
    { path: '/settings', label: 'Device Settings', icon: Settings },
    { path: '/hardware', label: 'Hardware & INO', icon: Cpu },
    { path: '/duplicates', label: 'Duplicate Telemetry', icon: Copy },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className="w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 z-50 shadow-2xl border-r border-slate-700/50"
    >
      {/* Logo Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 border-b border-slate-700/50"
      >
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
            className="w-12 h-12 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg"
          >
            <Activity className="w-7 h-7 text-white" />
          </motion.div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              SmartDrug
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Detection System</p>
          </div>
        </div>
      </motion.div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <motion.li
                key={item.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={item.path}
                  className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/50'
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <Icon className={`relative z-10 w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                  <span className={`relative z-10 font-medium ${isActive ? 'text-white' : ''}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="relative z-10 ml-auto w-2 h-2 bg-white rounded-full"
                    />
                  )}
                </Link>
              </motion.li>
            );
          })}
        </ul>
      </nav>
      
      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="p-4 border-t border-slate-700/50"
      >
        <div className="bg-slate-800/50 rounded-xl p-4 backdrop-blur-sm border border-slate-700/50">
          <p className="text-xs text-slate-400 text-center mb-1">
            © 2025 SmartDrug Detector
          </p>
          <p className="text-xs text-slate-500 text-center">
            Enterprise Edition
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full mt-3 px-4 py-2.5 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-2 text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default SidebarEnhanced;

