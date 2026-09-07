import React, { useState } from "react";
import { Plus, ImageIcon, Trash2, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";
import { cn } from "@/lib/utils";
import HeroSlideForm from "@/components/HeroSlideForm";
import PopupAdForm from "@/components/PopupAdForm";

interface HeroAdsSettingsProps {
  initialHeroSlides: any[];
  branches: any[];
  settings: any;
  getSettingValue: (key: string, defaultVal?: string) => string;
}

export default function HeroAdsSettings({ 
  initialHeroSlides, 
  branches, 
  settings, 
  getSettingValue 
}: HeroAdsSettingsProps) {
  const [heroSlides, setHeroSlides] = useState(initialHeroSlides);
  const [view, setView] = useState<"list" | "create-slide" | "create-ad">("list");
  const [editingSlideId, setEditingSlideId] = useState<number | null>(null);
  
  const [heroLayout, setHeroLayout] = useState(getSettingValue('hero_layout', 'split'));
  const [isSavingLayout, setIsSavingLayout] = useState(false);

  const handleSaveLayout = async (layout: string) => {
    setHeroLayout(layout);
    setIsSavingLayout(true);
    try {
      const formData = new FormData();
      formData.append('hero_layout', layout);
      await axios.post('/settings/update', formData);
      toast.success("Hero layout updated successfully");
    } catch (error) {
      toast.error("Failed to update layout");
    } finally {
      setIsSavingLayout(false);
    }
  };

  const handleDeleteSlide = async (id: number) => {
    const target = heroSlides.find((s: any) => s.id === id);

    if (confirm("Are you sure you want to delete this slide/ad?")) {
      try {
        await axios.delete(target?.is_ad ? `/settings/popup-ads/${id}` : `/settings/hero-slides/${id}`);
        toast.success(target?.is_ad ? "Ad deleted successfully" : "Slide deleted successfully");
        setHeroSlides(heroSlides.filter((s: any) => s.id !== id));
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to delete");
      }
    }
  };

  if (view === "create-slide") {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-600 rounded-lg">
                <ImageIcon className="h-4 w-4 text-white" />
             </div>
             <div>
               <h3 className="text-sm font-bold text-slate-900">{editingSlideId ? 'Edit Hero Slide' : 'Create Hero Slide'}</h3>
               <p className="text-[11px] text-slate-500 font-medium">Add or update promotional banners for your shop</p>
             </div>
          </div>
          <Button 
            onClick={() => { setView("list"); setEditingSlideId(null); }}
            variant="outline"
            size="sm"
            className="font-bold uppercase text-[10px] h-9 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to list
          </Button>
        </div>
        
        <HeroSlideForm 
          branches={branches}
          onSuccess={() => { setView("list"); setEditingSlideId(null); }}
          onCancel={() => { setView("list"); setEditingSlideId(null); }}
          editingSlideId={editingSlideId}
          existingSlide={editingSlideId ? heroSlides.find(s => s.id === editingSlideId && !s.is_ad) : undefined}
        />
      </div>
    );
  }

  if (view === "create-ad") {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-amber-500 rounded-lg">
                <ImageIcon className="h-4 w-4 text-white" />
             </div>
             <div>
               <h3 className="text-sm font-bold text-slate-900">{editingSlideId ? 'Edit Popup Ad' : 'Create Popup Ad'}</h3>
               <p className="text-[11px] text-slate-500 font-medium">Configure promotional popups and sidebar ads</p>
             </div>
          </div>
          <Button 
            onClick={() => { setView("list"); setEditingSlideId(null); }}
            variant="outline"
            size="sm"
            className="font-bold uppercase text-[10px] h-9 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to list
          </Button>
        </div>
        
        <PopupAdForm 
          branches={branches}
          onSuccess={() => { setView("list"); setEditingSlideId(null); }}
          onCancel={() => { setView("list"); setEditingSlideId(null); }}
          editingSlideId={editingSlideId}
          existingSlide={editingSlideId ? heroSlides.find(s => s.id === editingSlideId && s.is_ad) : undefined}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Layout Configuration */}
      <Card className="border-slate-200 shadow-none overflow-hidden">
        <CardHeader className="pb-4 border-b border-slate-100 px-6 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ImageIcon className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">Hero Section Layout</CardTitle>
              <p className="text-[11px] text-slate-500 font-medium">Configure how your hero slides and ads appear on the landing page</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <button 
                onClick={() => handleSaveLayout('split')}
                className={cn(
                   "flex flex-col text-left p-4 rounded-xl border-2 transition-all group",
                   heroLayout === 'split' ? "border-blue-600 bg-blue-50/50" : "border-slate-100 hover:border-slate-200 bg-white"
                )}
             >
                <div className="flex gap-1.5 w-full aspect-[2/1] mb-3">
                   <div className="w-[70%] h-full bg-slate-200 rounded-md group-hover:bg-slate-300 transition-colors" />
                   <div className="w-[30%] h-full bg-blue-200 rounded-md group-hover:bg-blue-300 transition-colors" />
                </div>
                <p className="text-xs font-bold text-slate-900 mb-1">75/25 Split</p>
                <p className="text-[10px] text-slate-500">Carousel with a static ad on the right (Standard)</p>
             </button>

             <button 
                onClick={() => handleSaveLayout('full')}
                className={cn(
                   "flex flex-col text-left p-4 rounded-xl border-2 transition-all group",
                   heroLayout === 'full' ? "border-blue-600 bg-blue-50/50" : "border-slate-100 hover:border-slate-200 bg-white"
                )}
             >
                <div className="flex gap-1.5 w-full aspect-[2/1] mb-3">
                   <div className="w-full h-full bg-slate-200 rounded-md group-hover:bg-slate-300 transition-colors" />
                </div>
                <p className="text-xs font-bold text-slate-900 mb-1">Full Width</p>
                <p className="text-[10px] text-slate-500">Carousel takes the full width, ads only appear as popups</p>
             </button>

             <button 
                onClick={() => handleSaveLayout('compact')}
                className={cn(
                   "flex flex-col text-left p-4 rounded-xl border-2 transition-all group",
                   heroLayout === 'compact' ? "border-blue-600 bg-blue-50/50" : "border-slate-100 hover:border-slate-200 bg-white"
                )}
             >
                <div className="flex gap-3 w-full aspect-[2/1] mb-3 items-center justify-center bg-slate-50 rounded-md">
                   <div className="w-12 h-12 rounded-full bg-slate-200" />
                   <div className="space-y-2">
                      <div className="w-20 h-2 bg-slate-200 rounded" />
                      <div className="w-16 h-2 bg-slate-100 rounded" />
                   </div>
                </div>
                <p className="text-xs font-bold text-slate-900 mb-1">Modern Centered</p>
                <p className="text-[10px] text-slate-500">Centered carousel with decorative backgrounds</p>
             </button>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Manage Slides & Ads</h3>
          <p className="text-[11px] text-slate-500 font-medium">Individual content items for your landing page</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => { setView("create-ad"); setEditingSlideId(null); }}
            size="sm"
            variant="outline"
            className="font-bold uppercase text-[10px] h-9"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Popup Ad
          </Button>
          <Button 
            onClick={() => { setView("create-slide"); setEditingSlideId(null); }}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 font-bold uppercase text-[10px] h-9 shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Hero Slide
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(heroSlides || []).map((slide: any) => (
          <Card key={slide.id} className="border-slate-200 shadow-none flex flex-col hover:border-blue-300 transition-colors">
            <CardHeader className="p-0 border-b border-slate-50 bg-slate-50/30 overflow-hidden relative">
              {slide.is_ad ? (
                <Badge className="absolute top-2 left-2 z-10 bg-amber-500 text-[9px] uppercase font-black">POPUP AD</Badge>
              ) : (
                <Badge className="absolute top-2 left-2 z-10 bg-blue-500 text-[9px] uppercase font-black">HERO SLIDE</Badge>
              )}
              <Badge variant={slide.is_active ? "default" : "secondary"} className="absolute top-2 right-2 z-10 text-[9px] uppercase font-bold">
                {slide.is_active ? 'Active' : 'Hidden'}
              </Badge>
              <div className="w-full h-36 bg-slate-100 flex items-center justify-center">
                {slide.image_path ? (
                  slide.image_path.match(/\.(mp4|webm|mov|ogg)$/i) ? (
                    <video src={`/storage/${slide.image_path}`} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={`/storage/${slide.image_path}`} alt={slide.title} className="w-full h-full object-cover" />
                  )
                ) : (
                  <ImageIcon size={32} className="text-slate-300" />
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 flex-1 space-y-2">
              <h4 className="text-sm font-bold text-slate-900 truncate">{slide.title || 'Untitled'}</h4>
              {slide.subtitle && <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{slide.subtitle}</p>}
            </CardContent>
            <CardFooter className="p-3 bg-slate-50/50 border-t border-slate-100 flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 text-[10px] font-bold uppercase" 
                onClick={() => { 
                  setEditingSlideId(slide.id); 
                  setView(slide.is_ad ? "create-ad" : "create-slide");
                }}
              >
                Edit
              </Button>
              <Button variant="ghost" size="sm" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent shadow-none" onClick={() => handleDeleteSlide(slide.id)}>
                <Trash2 size={16} />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
