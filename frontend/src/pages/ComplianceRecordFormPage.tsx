import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { listEmployees } from '../api/employees';
import {
  createComplianceRecord,
  getComplianceRecord,
  updateComplianceRecord,
} from '../api/complianceRecords';
import { extractErrorMessage } from '../api/client';
import { ErrorAlert } from '../components/ErrorAlert';
import { ComplianceType } from '../types';
import type { CreateComplianceRecordInput, Employee } from '../types';

const EMPTY_FORM: CreateComplianceRecordInput = {
  employeeId: '',
  complianceType: ComplianceType.VISA,
  issuedDate: '',
  expiryDate: '',
  documentUrl: '',
  notes: '',
};

export function ComplianceRecordFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [form, setForm] = useState<CreateComplianceRecordInput>(EMPTY_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    listEmployees({ limit: 200 }).then((res) => setEmployees(res.data));
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getComplianceRecord(id)
      .then((record) => {
        setForm({
          employeeId: record.employeeId,
          complianceType: record.complianceType,
          issuedDate: record.issuedDate,
          expiryDate: record.expiryDate,
          documentUrl: record.documentUrl ?? '',
          notes: record.notes ?? '',
        });
      })
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldError(null);
    setError(null);

    if (!form.employeeId || !form.complianceType || !form.issuedDate || !form.expiryDate) {
      setFieldError('Employee, compliance type, issued date, and expiry date are required.');
      return;
    }
    if (new Date(form.expiryDate) <= new Date(form.issuedDate)) {
      setFieldError('Expiry date must be later than issued date.');
      return;
    }
    if (form.documentUrl && !/^https?:\/\/.+/.test(form.documentUrl)) {
      setFieldError('Document URL must be a valid http(s) URL.');
      return;
    }

    const payload = {
      ...form,
      documentUrl: form.documentUrl || undefined,
      notes: form.notes || undefined,
    };

    setSaving(true);
    try {
      if (isEdit && id) {
        await updateComplianceRecord(id, payload);
      } else {
        await createComplianceRecord(payload);
      }
      navigate('/compliance-records');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-400">Loading…</p>;
  }

  return (
    <div className="max-w-xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          {isEdit ? 'Edit Compliance Record' : 'Create Compliance Record'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {isEdit ? 'Update the details of this compliance record.' : 'Track a new compliance item for an employee.'}
        </p>
      </div>

      <ErrorAlert message={error} />

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <ErrorAlert message={fieldError} />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Employee</label>
          <select
            required
            value={form.employeeId}
            onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="" disabled>
              Select an employee…
            </option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.firstName} {employee.lastName} ({employee.employeeCode})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Compliance Type</label>
          <select
            required
            value={form.complianceType}
            onChange={(e) => setForm({ ...form, complianceType: e.target.value as ComplianceType })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {Object.values(ComplianceType).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Issued Date</label>
            <input
              required
              type="date"
              value={form.issuedDate}
              onChange={(e) => setForm({ ...form, issuedDate: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date</label>
            <input
              required
              type="date"
              value={form.expiryDate}
              onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Document URL</label>
          <input
            type="url"
            placeholder="https://…"
            value={form.documentUrl}
            onChange={(e) => setForm({ ...form, documentUrl: e.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => navigate('/compliance-records')}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Record'}
          </button>
        </div>
      </form>
    </div>
  );
}
