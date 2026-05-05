import { Head, useForm } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import SettingsLayout from "@/layouts/SettingsLayout";
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { Upload, ImageIcon, ArrowLeft, Badge } from "lucide-react";

interface PopupAd {
  id: number;
  title: string;
  subtitle: string;
  image_path: string;
  button_text: string;
  button_link: string;
  is_active: boolean;
  sort_order: number;
  branch_id: number;
}

interface Branch {
  id: number;
  name: string;
  system_name?: string;
}

export default function Edit({ ad, branches }: { ad: PopupAd; branches: Branch[] }) {
  const [activeTab, setActiveTab] = useState("popup-ads");
  const { data, setData, put, processing, errors } = useForm({
    title: ad.title,
    subtitle: ad.subtitle,
    button_text: ad.button_text,
    button_link: ad.button_link,
    image: null as File | null,
    branch_id: String(ad.branch_id),
    is_active: ad.is_active,
    sort_order: ad.sort_order,
  });

  const [preview, setPreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setData("image", file);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("_method", "PUT");
    formData.append("title", data.title);
    formData.append("subtitle", data.subtitle);
    formData.append("button_text", data.button_text);
    formData.append("button_link", data.button_link);
    formData.append("branch_id", data.branch_id);
    formData.append("is_active", String(data.is_active));
    formData.append("sort_order", String(data.sort_order));
    if (data.image) {
      formData.append("image", data.image);
    }

    put(`/settings/popup-ads/${ad.id}`, formData as any);
  };

  const breadcrumbs = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Settings", href: "/settings" },
    { title: "Popup ads", href: "/settings/popup-ads" },
    { title: "Edit", href: "#" },
  ];

  return (
    <>
      <Head title={`Edit: ${ad.title}`} />
      <AppLayout breadcrumbs={breadcrumbs}>
        <SettingsLayout activeTab={activeTab} onTabChange={setActiveTab} sidebarTitle="Settings">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Edit Popup Ad</h1>
                <p className="text-muted-foreground text-sm">{ad.title}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => window.history.back()}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </div>

          <Card className="border-slate-200 shadow-none">
            <CardHeader className="pb-4 border-b border-slate-100 mb-6 px-6">
              <div className="flex items-center gap-3">
                <ImageIcon className="h-5 w-5 text-blue-600" />
                <div>
                  <CardTitle className="text-sm font-semibold">Ad image</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 px-6 pb-6">
              <div className="border border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center gap-4 bg-slate-50/50">
                <div className="w-full aspect-square rounded overflow-hidden shadow-sm flex items-center justify-center bg-slate-100 max-w-xs mx-auto">
                  {preview ? (
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <img
                      src={`/storage/${ad.image_path}`}
                      alt={ad.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <label htmlFor="image-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-900 bg-white px-6 py-3 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm">
                    <Upload size={14} /> {preview ? "Change image" : "Swap image"}
                  </div>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
              {errors.image && <p className="text-xs text-red-600">{errors.image}</p>}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-none">
            <CardHeader className="pb-4 border-b border-slate-100 mb-6 px-6">
              <div>
                <CardTitle className="text-sm font-semibold">Ad details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 px-6 pb-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-xs font-bold text-slate-500 uppercase">
                    Title
                  </Label>
                  <Input
                    id="title"
                    value={data.title}
                    onChange={(e) => setData("title", e.target.value)}
                    className="h-10"
                  />
                  {errors.title && <p className="text-xs text-red-600">{errors.title}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subtitle" className="text-xs font-bold text-slate-500 uppercase">
                    Subtitle (optional)
                  </Label>
                  <Textarea
                    id="subtitle"
                    value={data.subtitle}
                    onChange={(e) => setData("subtitle", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branch_id" className="text-xs font-bold text-slate-500 uppercase">
                    Branch assignment
                  </Label>
                  <Select value={data.branch_id} onValueChange={(val) => setData("branch_id", val)}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Global (all branches)</SelectItem>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={String(branch.id)}>
                          {branch.system_name || branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="button_text" className="text-xs font-bold text-slate-500 uppercase">
                      Button text (optional)
                    </Label>
                    <Input
                      id="button_text"
                      value={data.button_text}
                      onChange={(e) => setData("button_text", e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="button_link" className="text-xs font-bold text-slate-500 uppercase">
                      Button URL (optional)
                    </Label>
                    <Input
                      id="button_link"
                      value={data.button_link}
                      onChange={(e) => setData("button_link", e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sort_order" className="text-xs font-bold text-slate-500 uppercase">
                    Sort order
                  </Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={data.sort_order}
                    onChange={(e) => setData("sort_order", parseInt(e.target.value))}
                    className="h-10"
                  />
                </div>

                <div className="flex items-center space-x-3 p-4 border border-slate-200 rounded-lg bg-slate-50/50">
                  <Switch
                    checked={data.is_active}
                    onCheckedChange={(checked) => setData("is_active", checked)}
                  />
                  <Label className="text-sm font-medium">Visible on storefront</Label>
                </div>
              </form>
            </CardContent>
            <CardFooter className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => window.history.back()}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 font-bold uppercase text-[10px]"
                onClick={handleSubmit}
                disabled={processing}
              >
                {processing ? "Updating..." : "Update ad"}
              </Button>
            </CardFooter>
          </Card>
          </div>
        </SettingsLayout>
      </AppLayout>
    </>
  );
}
