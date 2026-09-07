import { Head, Link } from '@inertiajs/react';
import { Search, SlidersHorizontal, Grid, List as ListIcon } from 'lucide-react';
import { useState } from 'react';
import CustomLayout from '@/layouts/app/custom-layout';
import { ProductCard } from '@/components/shop/product-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Product {
    id: number;
    product_id: string;
    product_name: string;
    product_price: number;
    total_qty?: number;
    feature?: string;
    productManagement?: {
        id: number;
        images?: Array<{
            id: number;
            image_url: string;
            is_featured: boolean;
        }>;
        category?: {
            id: number;
            category_name: string;
        };
    };
    product_management?: any;
    variants?: any;
}

interface Props {
    products: Product[];
    categories: any[];
    searchQuery?: string;
}

export default function Products({ products, categories, searchQuery = '' }: Props) {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    return (
        <CustomLayout>
            <Head title="Our Products" />

            <div className="min-h-screen bg-slate-50">
                {/* Hero Section */}
                <section className="bg-blue-600 py-12 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                    <div className="w-[98%] md:w-[88%] max-w-[1600px] mx-auto px-2 sm:px-4 md:px-8 relative z-10 text-center">
                        <span className="inline-block bg-white/20 text-white text-xl font-dancing font-bold px-5 py-1.5 rounded-full mb-4 backdrop-blur-sm border border-white/30">Product Gallery</span>
                        <h1 className="text-2xl md:text-3xl font-extrabold mb-3 tracking-tight">Explore our Products</h1>
                        <p className="text-sm text-white/85 max-w-2xl mx-auto font-normal leading-relaxed">
                            Discover high-quality industrial solutions and consumer goods curated for excellence and reliability.
                        </p>
                    </div>
                </section>

                <div className="w-[98%] md:w-[88%] max-w-[1600px] mx-auto px-2 sm:px-4 md:px-8 py-12">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Sidebar Filters */}
                        <aside className="hidden lg:block w-64 space-y-8 flex-shrink-0">
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-4">Categories</h3>
                                <div className="space-y-1">
                                    <Link
                                        href="/shop/products"
                                        className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-bold bg-blue-600 text-white"
                                    >
                                        All Products
                                    </Link>
                                    {categories.map((cat) => (
                                        <Link 
                                            key={cat.id}
                                            href={`/category/${cat.id}`}
                                            className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-white hover:text-slate-900 transition"
                                        >
                                            {cat.category_name}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </aside>

                        {/* Main Content */}
                        <div className="flex-1">
                            {/* Toolbar */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                                <div className="relative w-full md:w-96">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input 
                                        placeholder="Search products..." 
                                        className="pl-10 h-10 border-slate-100 bg-slate-50 focus:bg-white"
                                        defaultValue={searchQuery}
                                    />
                                </div>

                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                        <button 
                                            onClick={() => setViewMode('grid')}
                                            className={`p-1.5 rounded-md transition ${viewMode === 'grid' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            <Grid className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => setViewMode('list')}
                                            className={`p-1.5 rounded-md transition ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            <ListIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <Button variant="outline" className="h-10 gap-2 font-bold border-slate-200">
                                        <SlidersHorizontal className="w-4 h-4" />
                                        Filters
                                    </Button>
                                </div>
                            </div>

                            {/* Product Grid */}
                            {products.length > 0 ? (
                                <div className={viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-6" : "space-y-4"}>
                                    {products.map((product) => (
                                        <ProductCard 
                                            key={product.id} 
                                            product={product} 
                                            view={viewMode}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-300">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Search className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900">No products found</h3>
                                    <p className="text-slate-500 mt-2">Try adjusting your search or filters to find what you're looking for.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </CustomLayout>
    );
}
