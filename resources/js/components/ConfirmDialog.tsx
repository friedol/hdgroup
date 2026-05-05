import React from 'react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: 'red' | 'green' | 'blue' | 'yellow';
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmColor = 'blue',
    onConfirm,
    onCancel,
    isLoading = false,
}: ConfirmDialogProps) {
    if (!isOpen) return null;

    const confirmColorClasses = {
        red: 'bg-red-600 hover:bg-red-700',
        green: 'bg-green-600 hover:bg-green-700',
        blue: 'bg-blue-600 hover:bg-blue-700',
        yellow: 'bg-yellow-600 hover:bg-yellow-700',
    };

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                    <p className="text-gray-600 mb-6">{message}</p>

                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={onCancel}
                            disabled={isLoading}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-200 text-gray-800 font-semibold rounded-lg transition"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`px-4 py-2 ${confirmColorClasses[confirmColor]} disabled:opacity-50 text-white font-semibold rounded-lg transition flex items-center gap-2`}
                        >
                            {isLoading && (
                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                            )}
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
