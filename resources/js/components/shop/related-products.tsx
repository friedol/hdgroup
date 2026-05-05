import { ProductCard } from './product-card';

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
}

interface Props {
    products: Product[];
}

export function RelatedProducts({ products }: Props) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {products.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    );
}
