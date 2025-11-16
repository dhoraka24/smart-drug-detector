import { useState, useEffect } from 'react';
import { fetchTelemetry } from '../api';

// SVG Icon
const AlertIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const Duplicates = () => {
  const [telemetry, setTelemetry] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const data = await fetchTelemetry(null, 500);
      setTelemetry(data);
      
      // Group by device_id and timestamp to find duplicates
      const grouped = {};
      data.forEach(t => {
        const key = `${t.device_id}_${t.ts}`;
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(t);
      });
      
      // Find groups with more than 1 entry (duplicates)
      const dupGroups = Object.values(grouped).filter(group => group.length > 1);
      setDuplicates(dupGroups);
      setLoading(false);
    } catch (error) {
      console.error('Error loading telemetry:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading duplicate telemetry...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Duplicate Telemetry</h1>
          <p className="text-gray-600 mt-1">Detected duplicate readings grouped by timestamp</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 rounded-lg">
          <AlertIcon />
          <span className="text-sm font-medium text-yellow-800">
            {duplicates.length} duplicate groups found
          </span>
        </div>
      </div>

      {/* Duplicates List */}
      {duplicates.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 border border-gray-100 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Duplicates Found</h3>
          <p className="text-gray-600">All telemetry readings are unique.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {duplicates.map((group, groupIndex) => (
            <div key={groupIndex} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-yellow-50 border-b border-yellow-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-yellow-500 text-white text-xs font-semibold rounded-full">
                      DUPLICATE DETECTED
                    </span>
                    <span className="text-sm text-gray-700">
                      {group.length} entries with same timestamp
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">
                    Device: {group[0].device_id}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Timestamp: {new Date(group[0].ts).toLocaleString()}
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Received At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        MQ3
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        MQ135
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Temp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Humidity
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {group.map((entry, idx) => (
                      <tr key={entry.id} className={idx === 0 ? 'bg-green-50' : 'bg-red-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            {idx === 0 && (
                              <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">
                                Original
                              </span>
                            )}
                            <span className="text-gray-900">#{entry.id}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(entry.received_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.mq3}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.mq135}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.temp_c ? `${entry.temp_c.toFixed(1)}°C` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.humidity_pct ? `${entry.humidity_pct.toFixed(1)}%` : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Duplicates;

