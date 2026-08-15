import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteComplianceRecord, listComplianceRecords } from '../api/complianceRecords';
import { extractErrorMessage } from '../api/client';
import { ErrorAlert } from '../components/ErrorAlert';
import { Pagination } from '../components/Pagination';
import { StatusBadge } from '../components/StatusBadge';
import { ComplianceStatus, ComplianceType } from '../types';
import type { ComplianceRecord } from '../types';

export function ComplianceRecordsPage() {
  const [records, setRecords] = useState<ComplianceRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const limit = 10;

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [complianceType, setComplianceType] = useState('');
  const [department, setDepartment] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    listComplianceRecords({
      page,
      limit,
      search: search || undefined,
      status: (status as ComplianceStatus) || undefined,
      complianceType: (complianceType as ComplianceType) || undefined,
      department: department || undefined,
    })
      .then((res) => {
        setRecords(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages);
        setError(null);
      })
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [page, search, status, complianceType, department]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(record: ComplianceRecord) {
    if (!confirm('Delete this compliance record?')) return;
    try {
      await deleteComplianceRecord(record.id);
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Compliance Records</h1>
          <p className="text-sm text-slate-500 mt-1">
            Visas, certifications, background checks, training, and work permits.
          </p>
        </div>
        <Link
          to="/compliance-records/new"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          New Record
        </Link>
      </div>

      <ErrorAlert message={error} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <input
          type="text"
          placeholder="Search employee…"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">All statuses</option>
          {Object.values(ComplianceStatus).map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>
        <select
          value={complianceType}
          onChange={(e) => {
            setPage(1);
            setComplianceType(e.target.value);
          }}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">All types</option>
          {Object.values(ComplianceType).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Filter by department…"
          value={department}
          onChange={(e) => {
            setPage(1);
            setDepartment(e.target.value);
          }}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Employee</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Department</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Compliance Type</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Issue Date</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Expiry Date</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
              <th className="px-4 py-3 text-right font-medium text-slate-500">Actions</th>
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
                <td className="px-4 py-3 text-slate-600">{record.issuedDate}</td>
                <td className="px-4 py-3 text-slate-600">{record.expiryDate}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={record.status} />
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  <Link
                    to={`/compliance-records/${record.id}/edit`}
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(record)}
                    className="text-rose-600 hover:text-rose-800 font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!loading && records.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  No compliance records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} />
    </div>
  );
}
