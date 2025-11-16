import { useState, useEffect } from 'react';
import { api } from '../store/auth';
import useAuthStore from '../store/auth';
import { format } from 'date-fns';

// SVG Icons
const ChevronDownIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const ChevronUpIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

const MergeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

const IgnoreIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const DuplicateTelemetry = () => {
  const { isAdmin } = useAuthStore();
  const [duplicates, setDuplicates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [selectedDuplicates, setSelectedDuplicates] = useState(new Set());
  
  // Filters
  const [deviceIdFilter, setDeviceIdFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);

  const fetchDuplicates = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: ((currentPage - 1) * limit).toString(),
      });
      
      if (deviceIdFilter) params.append('device_id', deviceIdFilter);
      if (fromDate) params.append('from_ts', new Date(fromDate).toISOString());
      if (toDate) params.append('to_ts', new Date(toDate).toISOString());
      
      const response = await api.get(`/api/v1/duplicates?${params}`);
      setDuplicates(response.data.duplicates || []);
      setTotal(response.data.total || 0);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load duplicates');
      console.error('Error fetching duplicates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuplicates();
  }, [currentPage, deviceIdFilter, fromDate, toDate]);

  const handleExpand = (index) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const handleMerge = async (originalId, duplicateIds) => {
    if (!isAdmin()) {
      alert('Only admins can merge duplicates');
      return;
    }
    
    if (!confirm(`Merge ${duplicateIds.length} duplicate(s) into original telemetry?`)) {
      return;
    }
    
    try {
      await api.post('/api/v1/duplicates/merge', {
        original_id: originalId,
        duplicate_ids: duplicateIds,
      });
      alert('Duplicates merged successfully!');
      fetchDuplicates();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to merge duplicates');
    }
  };

  const handleIgnore = async (ids) => {
    if (!isAdmin()) {
      alert('Only admins can ignore duplicates');
      return;
    }
    
    if (!confirm(`Ignore ${ids.length} duplicate(s)?`)) {
      return;
    }
    
    try {
      await api.post('/api/v1/duplicates/ignore', { ids });
      alert('Duplicates ignored successfully!');
      fetchDuplicates();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to ignore duplicates');
    }
  };

  const toggleSelectDuplicate = (id) => {
    const newSelected = new Set(selectedDuplicates);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedDuplicates(newSelected);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Duplicate Telemetry</h1>
        <p className="text-gray-600 mt-1">
          Review and manage duplicate telemetry entries detected by the system
        </p>
      </div>

      {/* Description */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">How Duplicate Detection Works</h2>
        <p className="text-gray-700 leading-relaxed mb-3">
          The system detects duplicates based on <code className="bg-gray-100 px-1 rounded">(device_id, timestamp)</code> uniqueness.
          When the same telemetry is sent multiple times with identical device_id and timestamp, the first entry is stored as the original,
          and subsequent entries are stored as duplicates. This prevents:
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-1 ml-2">
          <li>Duplicate alerts from being generated</li>
          <li>Unnecessary OpenAI API calls</li>
          <li>Database bloat from repeated data</li>
        </ul>
        <p className="text-gray-700 leading-relaxed mt-3">
          Admins can review duplicates, merge them into the original, or ignore them if they're not needed.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Device ID</label>
            <input
              type="text"
              value={deviceIdFilter}
              onChange={(e) => {
                setDeviceIdFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filter by device ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setDeviceIdFilter('');
                setFromDate('');
                setToDate('');
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading duplicates...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchDuplicates}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : duplicates.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600 text-lg">No duplicates found</p>
            <p className="text-gray-500 text-sm mt-2">
              {deviceIdFilter || fromDate || toDate
                ? 'Try adjusting your filters'
                : 'All telemetry entries are unique'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Primary ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Received</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duplicate Count</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sample MQ3</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sample MQ135</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {duplicates.map((dup, index) => {
                    const isExpanded = expandedRows.has(index);
                    const original = dup.original_telemetry;
                    const sampleDups = dup.sample_duplicates || [];
                    const allDuplicateIds = sampleDups.map(d => d.id);
                    
                    return (
                      <>
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{original?.id || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{dup.device_id}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {dup.timestamp ? format(new Date(dup.timestamp), 'yyyy-MM-dd HH:mm:ss') : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {original?.received_at ? format(new Date(original.received_at), 'yyyy-MM-dd HH:mm:ss') : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                              {dup.duplicate_count}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{original?.mq3 || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{original?.mq135 || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleExpand(index)}
                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-xs"
                              >
                                {isExpanded ? 'Hide' : 'Show All'}
                              </button>
                              {isAdmin() && (
                                <>
                                  <button
                                    onClick={() => handleMerge(original?.id, allDuplicateIds)}
                                    className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors text-xs flex items-center gap-1"
                                    title="Merge duplicates"
                                  >
                                    <MergeIcon />
                                    Merge
                                  </button>
                                  <button
                                    onClick={() => handleIgnore(allDuplicateIds)}
                                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-xs flex items-center gap-1"
                                    title="Ignore duplicates"
                                  >
                                    <IgnoreIcon />
                                    Ignore
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan="8" className="px-4 py-4 bg-gray-50">
                              <div className="space-y-3">
                                <h4 className="font-semibold text-gray-900">Original Telemetry:</h4>
                                <pre className="bg-white p-3 rounded border text-xs overflow-x-auto">
                                  {JSON.stringify(original, null, 2)}
                                </pre>
                                
                                <h4 className="font-semibold text-gray-900 mt-4">Duplicate Entries ({sampleDups.length}):</h4>
                                <div className="space-y-2">
                                  {sampleDups.map((sample, idx) => (
                                    <div key={idx} className="bg-white p-3 rounded border">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs text-gray-600">
                                          Duplicate ID: {sample.id} | Received: {format(new Date(sample.received_at), 'yyyy-MM-dd HH:mm:ss')}
                                        </span>
                                        {isAdmin() && (
                                          <input
                                            type="checkbox"
                                            checked={selectedDuplicates.has(sample.id)}
                                            onChange={() => toggleSelectDuplicate(sample.id)}
                                            className="rounded"
                                          />
                                        )}
                                      </div>
                                      <pre className="text-xs overflow-x-auto">
                                        {JSON.stringify(sample.payload_json, null, 2)}
                                      </pre>
                                    </div>
                                  ))}
                                </div>
                                
                                {dup.duplicate_count > sampleDups.length && (
                                  <p className="text-sm text-gray-600 italic">
                                    Showing {sampleDups.length} of {dup.duplicate_count} duplicates
                                  </p>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, total)} of {total} duplicates
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DuplicateTelemetry;

