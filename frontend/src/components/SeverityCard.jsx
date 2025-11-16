import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';

const SeverityCard = ({ severity, value, label, lastUpdate, deviceId }) => {
  const getSeverityConfig = () => {
    switch (severity) {
      case 'SAFE':
        return {
          icon: CheckCircle,
          color: 'emerald',
          bgGradient: 'from-emerald-500/10 to-emerald-600/5',
          borderColor: 'border-emerald-500/30',
          textColor: 'text-emerald-400',
          glow: 'glow-safe',
          animation: { scale: [1, 1.02, 1], transition: { duration: 2, repeat: Infinity } }
        };
      case 'WARNING':
        return {
          icon: AlertTriangle,
          color: 'amber',
          bgGradient: 'from-amber-500/10 to-amber-600/5',
          borderColor: 'border-amber-500/50',
          textColor: 'text-amber-400',
          glow: 'glow-warning',
          animation: { 
            scale: [1, 1.03, 1],
            borderColor: ['rgba(245, 158, 11, 0.5)', 'rgba(245, 158, 11, 1)', 'rgba(245, 158, 11, 0.5)'],
            transition: { duration: 2, repeat: Infinity }
          }
        };
      case 'HIGH':
        return {
          icon: AlertCircle,
          color: 'rose',
          bgGradient: 'from-rose-500/10 to-rose-600/5',
          borderColor: 'border-rose-500/50',
          textColor: 'text-rose-400',
          glow: 'glow-high',
          animation: { 
            x: [0, -5, 5, -5, 5, 0],
            scale: [1, 1.05, 1],
            transition: { duration: 0.5, repeat: 1 }
          }
        };
      default:
        return {
          icon: CheckCircle,
          color: 'gray',
          bgGradient: 'from-gray-500/10 to-gray-600/5',
          borderColor: 'border-gray-500/30',
          textColor: 'text-gray-400',
          glow: '',
          animation: {}
        };
    }
  };

  const config = getSeverityConfig();
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`
        relative overflow-hidden rounded-2xl border-2 ${config.borderColor}
        bg-gradient-to-br ${config.bgGradient}
        backdrop-blur-sm p-6 shadow-lg
        dark:bg-slate-800/50
      `}
    >
      {/* Animated glow effect */}
      {severity !== 'SAFE' && (
        <motion.div
          className={`absolute inset-0 ${config.glow} rounded-2xl`}
          animate={config.animation}
        />
      )}

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-${config.color}-500/20`}>
            <Icon className={`w-6 h-6 ${config.textColor}`} />
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${config.textColor} mb-1`}>
              {value}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {label}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Status
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold bg-${config.color}-500/20 ${config.textColor}`}>
              {severity}
            </span>
          </div>
          
          {deviceId && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Device: {deviceId}
            </div>
          )}
          
          {lastUpdate && (
            <div className="text-xs text-gray-400 dark:text-gray-500">
              {new Date(lastUpdate).toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {/* Shine effect for HIGH severity */}
      {severity === 'HIGH' && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{
            x: ['-100%', '200%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 1,
          }}
        />
      )}
    </motion.div>
  );
};

export default SeverityCard;

