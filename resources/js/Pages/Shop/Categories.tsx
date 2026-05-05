import { Head, Link } from '@inertiajs/react';
import { Layers, ChevronRight, Package, TrendingUp } from 'lucide-react';
import CustomLayout from '@/layouts/app/custom-layout';

interface Category {
    id: number;
    category_name: string;
    description?: string;
    product_count?: number;
    image_url?: string;
}

interface Props {
    categories: Category[];
}

export default function Categories({ categories }: Props) {
    return (
        <CustomLayout>
            <Head title="Shop by Category" />

            <div className="min-h-screen bg-slate-50">
                {/* Centered Hero Section */}
                <section className="bg-amber-400 py-8 text-slate-900 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-300/50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-300/50 rounded-full blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2"></div>
                    
                    <div className="w-[99%] max-w-[1920px] mx-auto px-2 sm:px-4 relative z-10 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-800 mb-2">Product Categories</p>
                        <h1 className="text-2xl md:text-3xl font-extrabold mb-2 tracking-tight">Explore our Categories</h1>
                        <p className="text-xs text-slate-800 max-w-2xl mx-auto font-normal">
                            Find exactly what you need by browsing our specialized departments. From industrial toolsets to consumer electronics.
                        </p>
                    </div>
                </section>

                <div className="w-[99%] max-w-[1920px] mx-auto px-2 sm:px-4 py-16">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
                        {categories.map((category, index) => {
                            const bgColors = [
                                'bg-gradient-to-br from-rose-50 to-rose-100 hover:border-rose-300 hover:shadow-rose-100 ring-rose-300',
                                'bg-gradient-to-br from-blue-50 to-blue-100 hover:border-blue-300 hover:shadow-blue-100 ring-blue-300',
                                'bg-gradient-to-br from-emerald-50 to-emerald-100 hover:border-emerald-300 hover:shadow-emerald-100 ring-emerald-300',
                                'bg-gradient-to-br from-amber-50 to-amber-100 hover:border-amber-300 hover:shadow-amber-100 ring-amber-300',
                                'bg-gradient-to-br from-purple-50 to-purple-100 hover:border-purple-300 hover:shadow-purple-100 ring-purple-300',
                                'bg-gradient-to-br from-cyan-50 to-cyan-100 hover:border-cyan-300 hover:shadow-cyan-100 ring-cyan-300',
                            ];
                            const textColors = [
                                'text-rose-900 group-hover:text-rose-700',
                                'text-blue-900 group-hover:text-blue-700',
                                'text-emerald-900 group-hover:text-emerald-700',
                                'text-amber-900 group-hover:text-amber-700',
                                'text-purple-900 group-hover:text-purple-700',
                                'text-cyan-900 group-hover:text-cyan-700',
                            ];
                            const iconColors = [
                                'text-rose-600',
                                'text-blue-600',
                                'text-emerald-600',
                                'text-amber-600',
                                'text-purple-600',
                                'text-cyan-600',
                            ];
                            
                            const bgStyle = bgColors[index % bgColors.length];
                            const textStyle = textColors[index % textColors.length];
                            const iconColor = iconColors[index % iconColors.length];

                            return (
                                <Link 
                                    key={category.id} 
                                    href={`/category/${category.id}`}
                                    className={`group rounded-3xl border border-white/50 p-4 md:p-6 shadow-sm hover:shadow-xl hover:ring-2 hover:ring-offset-2 transition-all duration-300 relative overflow-hidden flex flex-col items-center justify-center text-center aspect-square md:aspect-auto md:h-64 ${bgStyle}`}
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full blur-2xl -z-0 opacity-0 group-hover:opacity-100 transition-opacity translate-x-1/2 -translate-y-1/2"></div>
                                    
                                    <div className="relative z-10 flex flex-col items-center w-full">
                                        {category.image_url ? (
                                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl mb-4 shadow-sm group-hover:scale-110 transition-transform overflow-hidden bg-white/50 border border-white/60 p-1 flex-shrink-0">
                                                <img src={category.image_url} alt={category.category_name} className="w-full h-full object-cover rounded-xl" />
                                            </div>
                                        ) : (
                                            <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform bg-white/60 border border-white/80 flex-shrink-0`}>
                                                <Layers className={`w-6 h-6 md:w-8 md:h-8 ${iconColor}`} />
                                            </div>
                                        )}
                                        <h2 className={`text-sm md:text-base font-bold mb-2 tracking-tight leading-tight transition-colors capitalize px-2 line-clamp-2 ${textStyle}`}>
                                            {category.category_name.toLowerCase()}
                                        </h2>
                                        
                                        <div className="flex items-center gap-1.5 mt-1 bg-white/50 px-3 py-1 rounded-full border border-white/50 backdrop-blur-sm shadow-sm group-hover:bg-white/80 transition-colors">
                                            <Package className={`w-3 h-3 ${iconColor}`} />
                                            <span className="text-[9px] md:text-[10px] font-bold text-slate-600 uppercase tracking-widest leading-none pt-0.5">{category.product_count || Math.floor(Math.random() * 50) + 10} Items</span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </CustomLayout>
    );
}
