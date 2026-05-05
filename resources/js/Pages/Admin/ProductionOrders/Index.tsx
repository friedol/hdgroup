import { Head } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";

export default function Index(props: any) {
  return (
    <AppLayout>
      <Head title="Index" />
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="bg-card w-full rounded-xl border border-border overflow-hidden p-8 animate-fade-up">
          <h2 className="text-2xl font-bold text-foreground mb-4">Index Module</h2>
       
          <pre className="bg-slate-950 text-emerald-400 p-4 rounded-lg overflow-x-auto text-xs border border-white/10 custom-scrollbar max-h-[600px]">
            {JSON.stringify(props, null, 2)}
          </pre>
        </div>
      </div>
    </AppLayout>
  );
}
