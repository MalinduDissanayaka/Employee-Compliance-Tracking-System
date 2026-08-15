import { NavLink, Outlet } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/employees', label: 'Employees' },
  { to: '/compliance-records', label: 'Compliance Records' },
  { to: '/upcoming', label: 'Upcoming Expirations' },
];

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      <aside className="md:w-64 md:flex-shrink-0 bg-white border-b md:border-b-0 md:border-r border-slate-200">
        <div className="px-4 py-4 md:py-5">
          <h1 className="text-lg font-semibold text-slate-900">Compliance Tracker</h1>
          <p className="text-xs text-slate-500 mt-0.5">Employee Compliance Tracking</p>
        </div>
        <nav className="flex md:flex-col overflow-x-auto md:overflow-visible gap-1 px-2 md:px-3 pb-3 md:pb-4">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 min-w-0 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
