import { useCallback, useEffect, useState } from 'react';
import { getUpcoming } from '../api/dashboard';
import { extractErrorMessage } from '../api/client';
import { ErrorAlert } from '../components/ErrorAlert';
import { StatusBadge } from '../components/StatusBadge';
import type { ComplianceRecord } from '../types';

const DAY_PRESETS = [7, 30, 60, 90];

export function UpcomingExpirationsPage() {
  const [days, setDays] = useState(30);
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [records, setRecords] = useState<ComplianceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const query = useCustomRange && startDate && endDate ? { startDate, endDate } : { days };
    getUpcoming(query)
      .then((data) => {
        setRecords(data);
        setError(null);
      })
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [days, useCustomRange, startDate, endDate]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Upcoming Expirations</h1>
        <p className="text-sm text-slate-500 mt-1">
          Compliance items that need attention before they expire.
        </p>
      </div>

      <ErrorAlert message={error} />

      <div className="flex flex-col sm:flex-row sm:items-end gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Window</label>
          <div className="flex gap-2">
            {DAY_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setUseCustomRange(false);
                  setDays(preset);
                }}
                className={`rounded-md px-3 py-1.5 text-sm font-medium border ${
                  !useCustomRange && days === preset
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {preset} days
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-end gap-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setUseCustomRange(true);
              }}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setUseCustomRange(true);
              }}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Employee</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Department</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Compliance Type</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Expiry Date</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((record) => (
              <tr key={record.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {record.employee ? `${record.employee.firstName} ${record.employee.lastName}` : '—'}
                </td>
                <td className="px-4 py-3 text-slate-600">{record.employee?.department ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600">{record.complianceType}</td>
                <td className="px-4 py-3 text-slate-600">{record.expiryDate}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={record.status} />
                </td>
              </tr>
            ))}
            {!loading && records.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Nothing expiring in this window.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
