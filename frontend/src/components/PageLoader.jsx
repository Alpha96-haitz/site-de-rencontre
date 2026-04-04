export default function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-xl px-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-2/3 bg-slate-200 rounded-xl mx-auto" />
          <div className="h-4 w-full bg-slate-200 rounded-lg" />
          <div className="h-4 w-5/6 bg-slate-200 rounded-lg" />
          <div className="h-40 w-full bg-slate-200 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
