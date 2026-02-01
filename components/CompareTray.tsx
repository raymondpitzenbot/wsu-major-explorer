import React from 'react';
import { useCompare } from '../contexts/CompareContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Scale, Trash2 } from 'lucide-react';

const CompareTray: React.FC = () => {
    const { compareList, removeFromCompare, clearCompare } = useCompare();
    const navigate = useNavigate();
    const location = useLocation();

    if (compareList.length === 0) {
        return null;
    }

    const handleCompare = () => {
        if(compareList.length > 1) {
            if (location.pathname === '/compare') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                navigate('/compare');
            }
        }
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 sm:bottom-4 sm:right-4 sm:left-auto sm:w-11/12 sm:max-w-md">
            <div className="bg-gray-900/80 backdrop-blur-xl shadow-2xl overflow-hidden sm:rounded-lg border-t border-gray-800 sm:border">
                
                {/* Mobile View */}
                <div className="sm:hidden px-4 py-3">
                    <div className="flex justify-between items-center flex-nowrap">
                        <div className="flex items-baseline gap-2 flex-shrink-0 mr-2 min-w-0">
                            <span className="font-semibold text-white text-sm whitespace-nowrap">Compare</span>
                            <span className="text-xs text-gray-400 font-body whitespace-nowrap">({compareList.length}/4)</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                                onClick={handleCompare}
                                disabled={compareList.length < 2}
                                className="font-body flex items-center gap-2 px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700 disabled:cursor-not-allowed"
                            >
                                <Scale size={14} />
                                Compare
                            </button>
                            <button
                                onClick={clearCompare}
                                className="text-gray-400 hover:text-red-400 p-1"
                                aria-label="Clear all comparison items"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Desktop View */}
                <div className="hidden sm:block p-3">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-base font-semibold text-white">Compare Programs ({compareList.length}/4)</h3>
                        <button
                            onClick={clearCompare}
                            className="text-gray-400 hover:text-red-400 transition-colors"
                            aria-label="Clear all comparison items"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-2">
                        {compareList.map(program => (
                            <div key={program.program_id} className="flex justify-between items-center bg-gray-800 p-1.5 rounded-md">
                                <span className="text-xs font-medium text-gray-200 truncate font-body">{program.program_name}</span>
                                <button
                                    onClick={() => removeFromCompare(program.program_id)}
                                    className="ml-2 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                                    aria-label={`Remove ${program.program_name} from comparison`}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={handleCompare}
                        disabled={compareList.length < 2}
                        className="font-body mt-3 w-full flex items-center justify-center gap-2 px-4 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                    >
                        <Scale size={16} />
                        Compare ({compareList.length})
                    </button>
                    {compareList.length < 2 && <p className="text-xs text-center mt-1.5 text-gray-400 font-body">Add at least 2 programs to compare.</p>}
                </div>
            </div>
        </div>
    );
};

export default CompareTray;