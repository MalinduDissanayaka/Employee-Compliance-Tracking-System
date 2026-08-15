import { useCallback, useEffect, useState } from 'react';
import {
  createEmployee,
  deleteEmployee,
  listEmployees,
  updateEmployee,
} from '../api/employees';
import { extractErrorMessage } from '../api/client';
import { ErrorAlert } from '../components/ErrorAlert';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import type { CreateEmployeeInput, Employee } from '../types';

const EMPTY_FORM: CreateEmployeeInput = {
  employeeCode: '',
  firstName: '',
  lastName: '',
  email: '',
  department: '',
};

export function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState<CreateEmployeeInput>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    listEmployees({ page, limit, search: search || undefined, department: department || undefined })
      .then((res) => {
        setEmployees(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages);
        setError(null);
      })
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [page, search, department]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormErrors(null);
    setModalOpen(true);
  }

  function openEdit(employee: Employee) {
    setEditing(employee);
    setForm({
      employeeCode: employee.employeeCode,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      department: employee.department,
    });
    setFormErrors(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormErrors(null);
    try {
      if (editing) {
        await updateEmployee(editing.id, form);
      } else {
        await createEmployee(form);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setFormErrors(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(employee: Employee) {
    if (!confirm(`Delete employee ${employee.firstName} ${employee.lastName}?`)) return;
    try {
      await deleteEmployee(employee.id);
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Employees</h1>
          <p className="text-sm text-slate-500 mt-1">Manage the employees tracked for compliance.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Add Employee
        </button>
      </div>

      <ErrorAlert message={error} />

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by name, email, or code…"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <input
          type="text"
          placeholder="Filter by department…"
          value={department}
          onChange={(e) => {
            setPage(1);
            setDepartment(e.target.value);
          }}
          className="sm:w-64 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Code</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Name</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Email</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Department</th>
              <th className="px-4 py-3 text-right font-medium text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.map((employee) => (
              <tr key={employee.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-700">{employee.employeeCode}</td>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {employee.firstName} {employee.lastName}
                </td>
                <td className="px-4 py-3 text-slate-600">{employee.email}</td>
                <td className="px-4 py-3 text-slate-600">{employee.department}</td>
                <td className="px-4 py-3 text-right space-x-3">
                  <button
                    type="button"
                    onClick={() => openEdit(employee)}
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(employee)}
                    className="text-rose-600 hover:text-rose-800 font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!loading && employees.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No employees found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} />

      {modalOpen && (
        <Modal title={editing ? 'Edit Employee' : 'Add Employee'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <ErrorAlert message={formErrors} />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Employee Code</label>
              <input
                required
                value={form.employeeCode}
                onChange={(e) => setForm({ ...form, employeeCode: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                <input
                  required
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                <input
                  required
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
              <input
                required
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
