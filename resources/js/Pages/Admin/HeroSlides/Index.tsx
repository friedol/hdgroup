import { Head } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { Link, router } from "@inertiajs/react";

interface HeroSlide {
  id: number;
  title: string;
  image_path: string;
  page_type: string;
  is_active: boolean;
  branch?: { name: string; id: number };
}

export default function Index({ slides }: { slides: HeroSlide[] }) {
  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this hero slide?")) {
      router.delete(`/settings/hero-slides/${id}`, {
        onSuccess: () => {
          // Toast or notification could be added here
        }
      });
    }
  };

  const breadcrumbs = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Settings", href: "#" },
    { title: "Hero slides", href: "#" },
  ];

  return (
    <>
      <Head title="Hero Slides" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="w-full space-y-6 pb-10">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Hero slides</h1>
              <p className="text-muted-foreground mt-1">
                Manage banner slides for your storefront
              </p>
            </div>
            <Link href="/settings/hero-slides/create">
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4" />
                Create slide
              </Button>
            </Link>
          </div>

          {/* Slides Grid */}
          {slides.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">
                    No hero slides yet. Create one to get started!
                  </p>
                  <Link href="/settings/hero-slides/create">
                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4" />
                      Create your first slide
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {slides.map((slide) => (
                <Card
                  key={slide.id}
                  className={`overflow-hidden ${!slide.is_active ? "opacity-60" : ""}`}
                >
                  <div className="aspect-video overflow-hidden bg-muted">
                    <img
                      src={`/storage/${slide.image_path}`}
                      alt={slide.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {slide.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {slide.page_type} • {!slide.is_active && "Inactive"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/settings/hero-slides/${slide.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 flex-1"
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </Button>
                        </Link>
                        <Link
                          href={`/settings/hero-slides/${slide.id}/edit`}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 flex-1"
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleDelete(slide.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </AppLayout>
    </>
  );
}
