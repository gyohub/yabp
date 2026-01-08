import React, { useEffect, useState } from 'react';
import { X, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

const ConfirmationDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = 'info', // 'info', 'danger', 'success', 'warning'
    isAlert = false // If true, only shows confirm/ok button
}) => {
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setAnimate(true);
        } else {
            const timer = setTimeout(() => setAnimate(false), 200);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen && !animate) return null;

    const getIcon = () => {
        switch (type) {
            case 'danger': return <AlertTriangle className="h-6 w-6 text-red-600" />;
            case 'success': return <CheckCircle2 className="h-6 w-6 text-green-600" />;
            case 'warning': return <AlertTriangle className="h-6 w-6 text-amber-600" />;
            default: return <Info className="h-6 w-6 text-blue-600" />;
        }
    };

    const getButtonColor = () => {
        switch (type) {
            case 'danger': return 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500';
            case 'success': return 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500';
            case 'warning': return 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500';
            default: return 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500';
        }
    };

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className={`relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all duration-200 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${type === 'danger' ? 'bg-red-100' : type === 'success' ? 'bg-green-100' : type === 'warning' ? 'bg-amber-100' : 'bg-blue-100'}`}>
                            {getIcon()}
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-6">
                    <p className="text-slate-600 leading-relaxed">{message}</p>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-3">
                    {!isAlert && (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 hover:bg-white border border-transparent hover:border-slate-200 rounded-xl transition-all"
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        onClick={() => {
                            if (onConfirm) onConfirm();
                            onClose();
                        }}
                        className={`px-6 py-2 text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${getButtonColor()}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationDialog;
