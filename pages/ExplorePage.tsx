
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, ChevronDown } from 'lucide-react';
import { getColleges, getDegreeTypes, getLocations, getCredentialLevels } from '../services/dataService';
import ProgramCard from '../components/ProgramCard';
import { interestMappings } from '../data/wsuData';
import DynamicBackground from '../components/DynamicBackground';

const useClickOutside = (ref: React.RefObject<HTMLDivElement>, handler: () => void, isActive: boolean) => {
    useEffect(() => {
        if (!isActive) return;

        const listener = (event: PointerEvent) => {
            if (!ref.current || ref.current.contains(event.target as Node)) {
                return;
            }
            handler();
        };
        document.addEventListener('pointerdown', listener);
        return () => {
            document.removeEventListener('pointerdown', listener);
        };
    }, [ref, handler, isActive]);
};

const FilterDropdown: React.FC<{
    title: string;
    options: string[];
    selected: string[];
    onChange: (option: string) => void;
}> = ({ title, options, selected, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    useClickOutside(dropdownRef, () => setIsOpen(false), isOpen);

    const handleOptionChange = (option: string) => {
        onChange(option);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onPointerUp={(e) => {
                    e.preventDefault();
                    setIsOpen(!isOpen);
                }}
                className="flex items-center justify-between w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-md text-sm font-medium mouse:hover:bg-gray-800 touch-manipulation select-none"
            >
                <span className="font-body pointer-events-none">{title} {selected.length > 0 && `(${selected.length})`}</span>
                <ChevronDown size={16} className={`pointer-events-none transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div
                className={`absolute top-full mt-2 w-64 bg-gray-900 border border-gray-800 rounded-md shadow-lg z-10 p-2 transition-all duration-200 ease-out origin-top ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
            >
                <div className="max-h-60 overflow-y-auto">
                    {options.map(option => (
                        <label key={option} className="flex items-center gap-2 p-2 rounded-md mouse:hover:bg-gray-800 cursor-pointer text-sm font-body touch-manipulation">
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-700 text-primary-600 focus:ring-primary-500 bg-gray-800"
                                checked={selected.includes(option)}
                                onChange={() => handleOptionChange(option)}
                            />
                            {option}
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ExplorePage: React.FC = () => {
    const { programs, loading } = useData();
    const location = useLocation();
    const navigate = useNavigate();

    const [filters, setFilters] = useState<Record<string, string[]>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);


    const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
    const interestId = searchParams.get('interest');

    const filterOptions = useMemo(() => ({
        'Credential Level': getCredentialLevels(),
        'College': getColleges().filter(c => c !== "Uncategorized" && c !== "Pre-Professional Pathways"),
        'Degree Type': ['All Bachelors Degrees', ...getDegreeTypes()],
        'Location': getLocations(),
    }), []);

    const handleFilterChange = (type: string, value: string) => {
        setFilters(prev => {
            const currentValues = prev[type] || [];
            const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value];

            if (newValues.length === 0) {
                const { [type]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [type]: newValues };
        });
    };

    const clearFilters = () => {
        setFilters({});
        setSearchTerm('');
        navigate('/explore', { replace: true });
    };

    const processedPrograms = useMemo(() => {
        if (loading) return [];
        let basePrograms = programs;

        if (interestId) {
            const interestKeywords = Object.values(interestMappings).find(i => i.id === interestId)?.keywords;
            if (interestKeywords) {
                basePrograms = basePrograms.filter(p => {
                    const programText = `${p.program_name} ${p.short_description} ${p.overview}`.toLowerCase();
                    return interestKeywords.some(kw => programText.includes(kw));
                });
            }
        }

        return basePrograms.filter(program => {
            const searchMatch = program.program_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (program.department?.department_name || '').toLowerCase().includes(searchTerm.toLowerCase());

            const filterMatch = Object.entries(filters).every(([type, values]) => {
                if (!Array.isArray(values) || values.length === 0) return true;
                const key = type.toLowerCase().replace(/ /g, '_');
                if (key === 'college') return values.includes(program.department?.college_name || '');
                if (key === 'degree_type') {
                    if (values.includes('All Bachelors Degrees')) {
                        const otherValues = values.filter(v => v !== 'All Bachelors Degrees');
                        const isBachelor = (program.expanded_degree_type || '').includes('Bachelor');
                        return isBachelor || otherValues.includes(program.expanded_degree_type || '');
                    }
                    return values.includes(program.expanded_degree_type || '');
                }
                if (key === 'location') return values.some(val => program.location.includes(val));
                if (key === 'credential_level') {
                    const levelMatch = values.includes(program.credential_level);
                    if (values.includes('Non-degree') && program.degree_type === 'Minor') {
                        return true;
                    }
                    return levelMatch;
                }
                return true;
            });

            return searchMatch && filterMatch;
        });
    }, [programs, searchTerm, filters, interestId, loading]);

    const activeFilterCount = Object.values(filters).flat().length + (interestId ? 1 : 0);

    return (
        <DynamicBackground className="bg-gray-950 min-h-full">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center mb-8 relative z-10">
                    <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white">Explore Programs</h1>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400 font-body">Search, filter, and discover the perfect academic path for you.</p>
                </div>

                <div className={`sticky top-16 z-30 transition-all duration-300 ${isScrolled ? 'py-4' : ''}`}>
                    <div className={`space-y-4 ${!isScrolled ? 'py-4' : ''}`}>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by major, minor, or department..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-gray-900 rounded-lg border border-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition font-body"
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            {Object.entries(filterOptions).map(([title, options]) => (
                                <FilterDropdown
                                    key={title}
                                    title={title}
                                    options={options}
                                    selected={filters[title] || []}
                                    onChange={(option) => handleFilterChange(title, option)}
                                />
                            ))}
                            {activeFilterCount > 0 && (
                                <button onClick={clearFilters} className="px-4 py-2 text-sm font-semibold text-red-500 mouse:hover:text-red-400 flex-shrink-0 font-body">Clear Filters ({activeFilterCount})</button>
                            )}
                        </div>
                    </div>
                </div>

                <main className="pt-8 relative z-10">
                    <p className="text-sm text-gray-400 mb-4 font-body">
                        Showing {processedPrograms.length} of {programs.length} programs.
                    </p>
                    {loading ? (
                        <p className="font-body">Loading programs...</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {processedPrograms.map((program, index) => (
                                <div key={program.program_id} className="card-animation" style={{ animationDelay: `${index * 50}ms` }}>
                                    <ProgramCard program={program} />
                                </div>
                            ))}
                        </div>
                    )}
                    {processedPrograms.length === 0 && !loading && (
                        <div className="text-center py-16">
                            <h3 className="text-xl font-semibold">No Programs Found</h3>
                            <p className="text-gray-500 mt-2 font-body">Try adjusting your search or filters.</p>
                        </div>
                    )}
                </main>
            </div>
        </DynamicBackground>
    );
};

export default ExplorePage;