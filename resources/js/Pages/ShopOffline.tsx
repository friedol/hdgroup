import { Head } from "@inertiajs/react";
import { ShoppingBag, Clock } from "lucide-react";

export default function ShopOffline() {
  return (
    <>
      <Head title="Shop Temporarily Offline" />
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="h-20 w-20 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-10 w-10 text-amber-500" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 mb-2">Shop is Temporarily Offline</h1>
          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            We're making some improvements to our online shop. Please check back soon — we'll be back up shortly.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-5 py-2.5 inline-flex">
            <Clock className="h-3.5 w-3.5" />
            <span>Back soon</span>
          </div>
        </div>
      </div>
    </>
  );
}
