import { useForm } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Upload, ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface Branch {
  id: number;
  name: string;
  system_name?: string;
}

interface HeroSlide {
  id: number;
  title: string;
  subtitle: string;
  page_type: string;
  button_text: string;
  button_link: string;
  image_path?: string;
  branch_id: number;
  is_active: boolean;
  sort_order: number;
}

interface HeroSlideFormProps {
  branches: Branch[];
  onSuccess: () => void;
  editingSlideId?: number | null;
  existingSlide?: HeroSlide | null;
}

export default function HeroSlideForm({ branches, onSuccess, editingSlideId, existingSlide }: HeroSlideFormProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const { data, setData, transform, post, put, processing, errors } = useForm({
    title: existingSlide?.title || "",
    subtitle: existingSlide?.subtitle || "",
    page_type: existingSlide?.page_type || "home",
    button_text: existingSlide?.button_text || "",
    button_link: existingSlide?.button_link || "",
    image: null as File | null,
    branch_id: String(existingSlide?.branch_id || "0"),
    is_active: existingSlide?.is_active !== false,
    sort_order: existingSlide?.sort_order || 0,
  });

  useEffect(() => {
    if (existingSlide?.image_path) {
      setPreview(`/storage/${existingSlide.image_path}`);
    }
  }, [existingSlide]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setData("image", file);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const submitOptions = {
    forceFormData: true,
    onSuccess: () => {
      toast.success(editingSlideId ? "Hero slide updated successfully" : "Hero slide created successfully");
      onSuccess();
    },
    onError: (formErrors: Record<string, string>) => {
      const firstError = Object.values(formErrors)[0];
      toast.error(firstError || "Failed to save hero slide");
    },
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    transform((currentData) => ({
      ...currentData,
      branch_id: currentData.branch_id === "0" ? "" : currentData.branch_id,
    }));

    if (editingSlideId) {
      put(`/settings/hero-slides/${editingSlideId}`, submitOptions);
      return;
    }

    post("/settings/hero-slides", submitOptions);
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-none">
        <CardHeader className="pb-4 border-b border-slate-100 mb-6 px-6">
          <div className="flex items-center gap-3">
            <ImageIcon className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle className="text-sm font-semibold">Banner image</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 px-6 pb-6">
          <div className="border border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center gap-4 bg-slate-50/50">
            <div className="w-full aspect-video rounded overflow-hidden shadow-sm flex items-center justify-center bg-slate-100 max-w-md mx-auto">
              {preview ? (
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center space-y-2">
                  <ImageIcon size={32} className="mx-auto text-slate-300" />
                  <p className="text-xs text-slate-400 font-medium">Select a landscape image</p>
                </div>
              )}
            </div>
            <label htmlFor="image-upload" className="cursor-pointer">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-900 bg-white px-6 py-3 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm">
                <Upload size={14} /> {preview ? "Change image" : "Select image"}
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
            <CardTitle className="text-sm font-semibold">Slide details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-xs font-bold text-slate-500 uppercase">
                  Title
                </Label>
                <Input
                  id="title"
                  placeholder="e.g. Summer collection"
                  value={data.title}
                  onChange={(e) => setData("title", e.target.value)}
                  className="h-10"
                />
                {errors.title && <p className="text-xs text-red-600">{errors.title}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="page_type" className="text-xs font-bold text-slate-500 uppercase">
                  Page assignment
                </Label>
                <Select value={data.page_type} onValueChange={(val) => setData("page_type", val)}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">Home page</SelectItem>
                    <SelectItem value="shop">Shop page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle" className="text-xs font-bold text-slate-500 uppercase">
                Subtitle (optional)
              </Label>
              <Textarea
                id="subtitle"
                placeholder="Additional description"
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
                  placeholder="e.g. Shop now"
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
                  placeholder="/shop"
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
          </form>
        </CardContent>
        <CardFooter className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 font-bold uppercase text-[10px]"
            onClick={handleSubmit}
            disabled={processing}
          >
            {processing ? "Saving..." : editingSlideId ? "Update slide" : "Create slide"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
