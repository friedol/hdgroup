import { Head, Link } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { router } from "@inertiajs/react";

interface HeroSlide {
  id: number;
  title: string;
  subtitle: string;
  image_path: string;
  page_type: string;
  button_text: string;
  button_link: string;
  is_active: boolean;
  sort_order: number;
  branch?: { name: string; id: number };
}

export default function Show({ heroSlide }: { heroSlide: HeroSlide }) {
  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this hero slide?")) {
      router.delete(`/settings/hero-slides/${heroSlide.id}`, {
        onSuccess: () => router.visit("/settings/hero-slides"),
      });
    }
  };

  const breadcrumbs = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Settings", href: "#" },
    { title: "Hero slides", href: "/settings/hero-slides" },
    { title: heroSlide.title, href: "#" },
  ];

  return (
    <>
      <Head title={heroSlide.title} />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="w-full pb-10">
          <Link href="/settings/hero-slides">
            <Button variant="ghost" className="mb-6 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to slides
            </Button>
          </Link>

          <Card>
            <CardHeader className="border-b">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{heroSlide.title}</CardTitle>
                  <div className="flex gap-2 mt-2">
                    <Badge variant={heroSlide.is_active ? "default" : "outline"}>
                      {heroSlide.is_active ? "active" : "Inactive"}
                    </Badge>
                    <Badge variant="secondary">{heroSlide.page_type}</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/settings/hero-slides/${heroSlide.id}/edit`}>
                    <Button variant="outline" className="gap-2">
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="destructive"
                    className="gap-2"
                    onClick={handleDelete}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Image */}
              <div>
                <h3 className="font-semibold text-sm mb-3">Banner image</h3>
                <img
                  src={`/storage/${heroSlide.image_path}`}
                  alt={heroSlide.title}
                  className="w-full aspect-video object-cover rounded-lg"
                />
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">
                    Subtitle
                  </p>
                  <p className="text-sm">{heroSlide.subtitle || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">
                    Sort order
                  </p>
                  <p className="text-sm">{heroSlide.sort_order}</p>
                </div>
              </div>

              {/* Button Info */}
              {heroSlide.button_text && (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">
                      Button text
                    </p>
                    <p className="text-sm">{heroSlide.button_text}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">
                      Button link
                    </p>
                    <p className="text-sm">{heroSlide.button_link || "—"}</p>
                  </div>
                </div>
              )}

              {/* Branch */}
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">
                  Branch
                </p>
                <p className="text-sm">
                  {heroSlide.branch?.name || "Global (all branches)"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </>
  );
}
