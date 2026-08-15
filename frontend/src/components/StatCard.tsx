interface StatCardProps {
  label: string;
  value: number;
  accent: string;
}

export function StatCard({ label, value, accent }: StatCardProps) {
  return (
    <div className="rounded-lg bg-white border border-slate-200 p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${accent}`}>{value.toLocaleString()}</p>
    </div>
  );
}
