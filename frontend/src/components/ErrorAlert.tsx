export function ErrorAlert({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="rounded-md bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
      {message}
    </div>
  );
}
