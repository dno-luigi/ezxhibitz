export default function SharingExample() {
  return (
    <div className="mt-6 w-full max-w-none overflow-hidden rounded-[14px] border border-line">
      <div className="grid grid-cols-3 gap-3 bg-surface px-4 py-3 text-[14px] font-[550] text-muted">
        <span>Active</span>
        <span>Removal date</span>
        <span>Remove link</span>
      </div>
      <p className="px-4 py-5 text-sm text-muted">No active share links.</p>
    </div>
  );
}
