import React, { useState } from "react";
import { Plus, ImageIcon, Trash2, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";
import HeroSlideForm from "@/components/HeroSlideForm";
import PopupAdForm from "@/components/PopupAdForm";

interface HeroAdsSettingsProps {
  initialHeroSlides: any[];
  branches: any[];
}

export default function HeroAdsSettings({ initialHeroSlides, branches }: HeroAdsSettingsProps) {
  const [heroSlides, setHeroSlides] = useState(initialHeroSlides);
  const [view, setView] = useState<"list" | "create-slide" | "create-ad">("list");
  const [editingSlideId, setEditingSlideId] = useState<number | null>(null);

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
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Create Hero Slide</h3>
            <p className="text-xs text-slate-500">Add a new promotional banner</p>
          </div>
          <Button 
            onClick={() => { setView("list"); setEditingSlideId(null); }}
            variant="outline"
            size="sm"
            className="font-bold uppercase text-[10px]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        </div>
        
        <HeroSlideForm 
          branches={branches}
          onSuccess={() => { setView("list"); setEditingSlideId(null); window.location.reload(); }}
          editingSlideId={editingSlideId}
          existingSlide={editingSlideId ? heroSlides.find(s => s.id === editingSlideId && !s.is_ad) : undefined}
        />
      </div>
    );
  }

  if (view === "create-ad") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Create Popup Ad</h3>
            <p className="text-xs text-slate-500">Add a new popup advertisement</p>
          </div>
          <Button 
            onClick={() => { setView("list"); setEditingSlideId(null); }}
            variant="outline"
            size="sm"
            className="font-bold uppercase text-[10px]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        </div>
        
        <PopupAdForm 
          branches={branches}
          onSuccess={() => { setView("list"); setEditingSlideId(null); window.location.reload(); }}
          editingSlideId={editingSlideId}
          existingSlide={editingSlideId ? heroSlides.find(s => s.id === editingSlideId && s.is_ad) : undefined}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Landing Page Carousels & Popup Ads</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => { setView("create-ad"); setEditingSlideId(null); }}
            size="sm"
            variant="outline"
            className="font-bold uppercase text-[10px]"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Ad
          </Button>
          <Button 
            onClick={() => { setView("create-slide"); setEditingSlideId(null); }}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 font-bold uppercase text-[10px]"
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
                  <img src={`/storage/${slide.image_path}`} alt={slide.title} className="w-full h-full object-cover" />
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
