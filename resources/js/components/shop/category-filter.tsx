import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface Category {
    id: number;
    category_name: string;
    category_description?: string;
    product_count?: number;
}

interface Props {
    categories: Category[];
    selectedCategory: number | null;
    onCategoryChange: (categoryId: number | null) => void;
    productCount?: number;
}

export function CategoryFilter({
    categories,
    selectedCategory,
    onCategoryChange,
    productCount,
}: Props) {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="pb-6 border-b">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center justify-between w-full mb-4"
            >
                <h3 className="font-bold text-gray-900">Categories</h3>
                <ChevronDown
                    className={`w-4 h-4 text-gray-600 transition ${isExpanded ? 'rotate-180' : ''}`}
                />
            </button>

            {isExpanded && (
                <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer hover:opacity-70">
                        <input
                            type="radio"
                            name="category"
                            checked={selectedCategory === null}
                            onChange={() => onCategoryChange(null)}
                            className="w-4 h-4"
                        />
                        <span className="text-sm text-gray-700">All Categories</span>
                        {productCount !== undefined && (
                            <span className="text-xs text-gray-500">({productCount})</span>
                        )}
                    </label>

                    {categories.map((category) => (
                        <label
                            key={category.id}
                            className="flex items-center gap-3 cursor-pointer hover:opacity-70"
                        >
                            <input
                                type="radio"
                                name="category"
                                checked={selectedCategory === category.id}
                                onChange={() => onCategoryChange(category.id)}
                                className="w-4 h-4"
                            />
                            <span className="text-sm text-gray-700">{category.category_name}</span>
                            {category.product_count !== undefined && (
                                <span className="text-xs text-gray-500">
                                    ({category.product_count})
                                </span>
                            )}
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}
