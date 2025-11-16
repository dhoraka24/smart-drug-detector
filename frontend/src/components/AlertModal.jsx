import { formatToISTSimple } from '../utils/timeFormat';

// AMET University, Chennai coordinates (fallback when GPS is not available)
const AMET_UNIVERSITY_LAT = 12.9012;
const AMET_UNIVERSITY_LON = 80.2209;
const AMET_UNIVERSITY_NAME = 'AMET University, Chennai';

// Helper function to get GPS coordinates with fallback
const getGPSCoordinates = (alert) => {
  if (alert.lat && alert.lon && alert.lat !== 0 && alert.lon !== 0) {
    return {
      lat: alert.lat,
      lon: alert.lon,
      isFallback: false
    };
  }
  return {
    lat: AMET_UNIVERSITY_LAT,
    lon: AMET_UNIVERSITY_LON,
    isFallback: true,
    location: AMET_UNIVERSITY_NAME
  };
};

const AlertModal = ({ alert, onClose, onViewOnMap }) => {
  if (!alert) return null;

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'SAFE':
        return 'bg-green-500 text-white';
      case 'WARNING':
        return 'bg-yellow-500 text-white';
      case 'HIGH':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span
                className={`px-4 py-2 text-sm font-semibold rounded-full ${getSeverityColor(
                  alert.severity
                )}`}
              >
                {alert.severity}
              </span>
              <span className="text-sm text-gray-500">
                {formatToISTSimple(alert.ts || alert.created_at)}
              </span>
              {!alert.notified && (
                <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded">
                  Debounced
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{alert.short_message}</h2>
              {alert.explanation && (
                <p className="text-gray-700 mb-2">{alert.explanation}</p>
              )}
              {alert.recommended_action && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900 mb-1">Recommended Action:</p>
                  <p className="text-sm text-blue-700">{alert.recommended_action}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <p className="text-sm text-gray-600">Device ID</p>
                <p className="font-semibold text-gray-900">{alert.device_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Confidence</p>
                <p className="font-semibold text-gray-900 capitalize">{alert.confidence}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">MQ3 Reading</p>
                <p className="font-semibold text-gray-900">{alert.mq3}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">MQ135 Reading</p>
                <p className="font-semibold text-gray-900">{alert.mq135}</p>
              </div>
              {alert.temp_c && (
                <div>
                  <p className="text-sm text-gray-600">Temperature</p>
                  <p className="font-semibold text-gray-900">{alert.temp_c}°C</p>
                </div>
              )}
              {alert.humidity_pct && (
                <div>
                  <p className="text-sm text-gray-600">Humidity</p>
                  <p className="font-semibold text-gray-900">{alert.humidity_pct}%</p>
                </div>
              )}
              {(() => {
                const gps = getGPSCoordinates(alert);
                return (
                  <>
                    <div>
                      <p className="text-sm text-gray-600">Latitude</p>
                      <p className="font-semibold text-gray-900">
                        {gps.lat.toFixed(6)}
                        {gps.isFallback && (
                          <span className="text-xs text-gray-500 ml-2">({AMET_UNIVERSITY_NAME})</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Longitude</p>
                      <p className="font-semibold text-gray-900">
                        {gps.lon.toFixed(6)}
                        {gps.isFallback && (
                          <span className="text-xs text-gray-500 ml-2">(Fallback)</span>
                        )}
                      </p>
                    </div>
                    {gps.isFallback && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500 italic">
                          * GPS coordinates not available. Showing {AMET_UNIVERSITY_NAME} as fallback location.
                        </p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* View on Map Button */}
            {onViewOnMap && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={onViewOnMap}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  View on Map
                  {(() => {
                    const gps = getGPSCoordinates(alert);
                    return gps.isFallback && (
                      <span className="text-xs bg-blue-500 px-2 py-1 rounded">({AMET_UNIVERSITY_NAME})</span>
                    );
                  })()}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;

