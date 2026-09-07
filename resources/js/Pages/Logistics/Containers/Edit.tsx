import { Head, Link, useForm } from "@inertiajs/react";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import AppLayout from "@/layouts/app-layout";

interface Container {
  id: number;
  container_id: string;
  name: string;
  length: number;
  width: number;
  height: number;
  capacity: number;
  tare_weight: number;
  gross_weight: number;
  max_payload: number;
  description?: string;
}

export default function ContainerEdit({ container }: { container: Container }) {
  const breadcrumbs = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Logistics", href: "/logistics" },
    { title: "Containers", href: "/containers" },
    { title: "Edit", href: "#" }
  ];

  const { data, setData, put, processing, errors } = useForm({
    container_id: container.container_id,
    name: container.name,
    length: container.length.toString(),
    width: container.width.toString(),
    height: container.height.toString(),
    capacity: container.capacity.toString(),
    tare_weight: container.tare_weight.toString(),
    gross_weight: container.gross_weight.toString(),
    max_payload: container.max_payload.toString(),
    description: container.description || ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(`/containers/${container.id}`);
  };

  const labelClass = "text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block";
  const inputClass = "w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-slate-50/50 focus:bg-white transition-all h-10 shadow-none";

  return (
    <>
      <Head title={`Edit ${container.name}`} />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="max-w-[1700px] mx-auto space-y-6 pb-20">
          
          {/* Header */}
          <div className="flex items-center gap-3">
            <Link href="/containers" className="h-9 w-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 shadow-sm transition-all">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-[18px] font-bold text-slate-900 tracking-tight leading-none">Edit Container</h1>
              <p className="text-xs font-medium text-slate-500 mt-1.5">{container.name}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Basic Information */}
            <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
              <CardHeader className="border-b border-slate-50 pb-4">
                <CardTitle className="text-sm font-bold text-slate-800">Basic Information</CardTitle>
                <CardDescription className="text-xs text-slate-400">Container identification and naming</CardDescription>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Container ID *</label>
                    <Input
                      placeholder="e.g., CNT-001"
                      value={data.container_id}
                      onChange={(e) => setData("container_id", e.target.value)}
                      className={`${inputClass} opacity-60 bg-slate-100 cursor-not-allowed`}
                      disabled
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Container Name *</label>
                    <Input
                      placeholder="e.g., Container Alpha"
                      value={data.name}
                      onChange={(e) => setData("name", e.target.value)}
                      className={`${inputClass} ${errors.name ? "border-red-500 focus:border-red-500 focus:ring-red-100" : ""}`}
                    />
                    {errors.name && <p className="text-red-500 text-[11px] font-semibold mt-1">{errors.name}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dimensions */}
            <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
              <CardHeader className="border-b border-slate-50 pb-4">
                <CardTitle className="text-sm font-bold text-slate-800">Physical Dimensions</CardTitle>
                <CardDescription className="text-xs text-slate-400">Container measurements in meters</CardDescription>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className={labelClass}>Length (m) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={data.length}
                      onChange={(e) => setData("length", e.target.value)}
                      className={`${inputClass} ${errors.length ? "border-red-500 focus:border-red-500 focus:ring-red-100" : ""}`}
                    />
                    {errors.length && <p className="text-red-500 text-[11px] font-semibold mt-1">{errors.length}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Width (m) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={data.width}
                      onChange={(e) => setData("width", e.target.value)}
                      className={`${inputClass} ${errors.width ? "border-red-500 focus:border-red-500 focus:ring-red-100" : ""}`}
                    />
                    {errors.width && <p className="text-red-500 text-[11px] font-semibold mt-1">{errors.width}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Height (m) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={data.height}
                      onChange={(e) => setData("height", e.target.value)}
                      className={`${inputClass} ${errors.height ? "border-red-500 focus:border-red-500 focus:ring-red-100" : ""}`}
                    />
                    {errors.height && <p className="text-red-500 text-[11px] font-semibold mt-1">{errors.height}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Capacity (CBM) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={data.capacity}
                      onChange={(e) => setData("capacity", e.target.value)}
                      className={`${inputClass} ${errors.capacity ? "border-red-500 focus:border-red-500 focus:ring-red-100" : ""}`}
                    />
                    {errors.capacity && <p className="text-red-500 text-[11px] font-semibold mt-1">{errors.capacity}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Weight Specifications */}
            <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
              <CardHeader className="border-b border-slate-50 pb-4">
                <CardTitle className="text-sm font-bold text-slate-800">Weight Specifications</CardTitle>
                <CardDescription className="text-xs text-slate-400">Weight limits and specifications in kilograms</CardDescription>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Tare Weight (kg) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={data.tare_weight}
                      onChange={(e) => setData("tare_weight", e.target.value)}
                      className={`${inputClass} ${errors.tare_weight ? "border-red-500 focus:border-red-500 focus:ring-red-100" : ""}`}
                    />
                    {errors.tare_weight && <p className="text-red-500 text-[11px] font-semibold mt-1">{errors.tare_weight}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Gross Weight (kg) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={data.gross_weight}
                      onChange={(e) => setData("gross_weight", e.target.value)}
                      className={`${inputClass} ${errors.gross_weight ? "border-red-500 focus:border-red-500 focus:ring-red-100" : ""}`}
                    />
                    {errors.gross_weight && <p className="text-red-500 text-[11px] font-semibold mt-1">{errors.gross_weight}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Max Payload (kg) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={data.max_payload}
                      onChange={(e) => setData("max_payload", e.target.value)}
                      className={`${inputClass} ${errors.max_payload ? "border-red-500 focus:border-red-500 focus:ring-red-100" : ""}`}
                    />
                    {errors.max_payload && <p className="text-red-500 text-[11px] font-semibold mt-1">{errors.max_payload}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
              <CardHeader className="border-b border-slate-50 pb-4">
                <CardTitle className="text-sm font-bold text-slate-800">Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div>
                  <label className={labelClass}>Description</label>
                  <textarea
                    placeholder="Optional notes about this container..."
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-slate-50/50 focus:bg-white transition-all min-h-[100px]"
                    value={data.description}
                    onChange={(e) => setData("description", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <Link href="/containers">
                <button type="button" className="h-9 px-4 rounded-xl text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-650 transition-all">
                  Cancel
                </button>
              </Link>
              <button 
                type="submit" 
                disabled={processing}
                className="rounded-xl h-9 px-4 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/30 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </AppLayout>
    </>
  );
}
