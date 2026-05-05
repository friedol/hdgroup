import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

interface Props {
    priceRange: [number, number];
    onPriceChange: (range: [number, number]) => void;
}

export function PriceFilter({ priceRange, onPriceChange }: Props) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [minPrice, setMinPrice] = useState(priceRange[0]);
    const [maxPrice, setMaxPrice] = useState(priceRange[1]);

    const handleApply = () => {
        onPriceChange([minPrice, maxPrice]);
    };

    return (
        <div className="pb-6 border-b">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center justify-between w-full mb-4"
            >
                <h3 className="font-bold text-gray-900">Price Range</h3>
                <ChevronDown
                    className={`w-4 h-4 text-gray-600 transition ${isExpanded ? 'rotate-180' : ''}`}
                />
            </button>

            {isExpanded && (
                <div className="space-y-4">
                    {/* Min Price */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Min Price: ${minPrice}
                        </label>
                        <Input
                            type="range"
                            min="0"
                            max="10000"
                            step="50"
                            value={minPrice}
                            onChange={(e) => setMinPrice(parseInt(e.target.value))}
                            className="w-full"
                        />
                    </div>

                    {/* Max Price */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Max Price: ${maxPrice}
                        </label>
                        <Input
                            type="range"
                            min="0"
                            max="10000"
                            step="50"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                            className="w-full"
                        />
                    </div>

                    {/* Apply Button */}
                    <button
                        onClick={handleApply}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 transition"
                    >
                        Apply Filter
                    </button>
                </div>
            )}
        </div>
    );
}
