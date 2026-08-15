import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getByDepartment, getByType, getDashboardSummary } from '../api/dashboard';
import { extractErrorMessage } from '../api/client';
import { StatCard } from '../components/StatCard';
import { ErrorAlert } from '../components/ErrorAlert';
import type { DashboardSummary, DepartmentBreakdown, TypeBreakdown } from '../types';

const SERIES_BLUE = '#2a78d6';
const GRID_COLOR = '#e1e0d9';
const AXIS_COLOR = '#c3c2b7';
const MUTED_TEXT = '#898781';

function ChartTooltip({
  active,
  payload,
  label,
  valueLabel,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  valueLabel: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-slate-900">{label}</p>
      <p className="text-slate-600">
        {valueLabel}: <span className="font-semibold text-slate-900">{payload[0].value}</span>
      </p>
    </div>
  );
}

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [byDepartment, setByDepartment] = useState<DepartmentBreakdown[]>([]);
  const [byType, setByType] = useState<TypeBreakdown[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getDashboardSummary(), getByDepartment(), getByType()])
      .then(([s, d, t]) => {
        if (cancelled) return;
        setSummary(s);
        setByDepartment(d);
        setByType(t);
        setError(null);
      })
      .catch((err) => !cancelled && setError(extractErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          A live snapshot of compliance record status across the organization.
        </p>
      </div>

      <ErrorAlert message={error} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Records" value={summary?.total ?? 0} accent="text-slate-900" />
        <StatCard label="Active" value={summary?.active ?? 0} accent="text-[#0b6b0b]" />
        <StatCard label="Expiring Soon" value={summary?.expiringSoon ?? 0} accent="text-[#8a5a00]" />
        <StatCard label="Expired" value={summary?.expired ?? 0} accent="text-[#a12a2a]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg bg-white border border-slate-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Compliance By Department</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDepartment} margin={{ top: 4, right: 8, bottom: 4, left: -12 }}>
                <CartesianGrid vertical={false} stroke={GRID_COLOR} />
                <XAxis
                  dataKey="department"
                  tick={{ fill: MUTED_TEXT, fontSize: 12 }}
                  axisLine={{ stroke: AXIS_COLOR }}
                  tickLine={false}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: MUTED_TEXT, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(42,120,214,0.08)' }}
                  content={<ChartTooltip valueLabel="Records" />}
                />
                <Bar dataKey="count" fill={SERIES_BLUE} radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg bg-white border border-slate-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Compliance By Type</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byType} margin={{ top: 4, right: 8, bottom: 4, left: -12 }}>
                <CartesianGrid vertical={false} stroke={GRID_COLOR} />
                <XAxis
                  dataKey="complianceType"
                  tick={{ fill: MUTED_TEXT, fontSize: 12 }}
                  axisLine={{ stroke: AXIS_COLOR }}
                  tickLine={false}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: MUTED_TEXT, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(42,120,214,0.08)' }}
                  content={<ChartTooltip valueLabel="Records" />}
                />
                <Bar dataKey="count" fill={SERIES_BLUE} radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {loading && <p className="text-sm text-slate-400">Loading dashboard…</p>}
    </div>
  );
}
