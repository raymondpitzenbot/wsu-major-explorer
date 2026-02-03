import React, { useState, useEffect, useRef } from 'react';
import { useCompare } from '../contexts/CompareContext';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Program } from '../types';
import { MessageCircle, Plus, Search, X, Share2, Check } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import DynamicBackground from '../components/DynamicBackground';

const collegeColorHexMap: Record<string, string> = {
    'College of Business': '#06b6d4', // cyan-500
    'College of Education': '#f59e0b', // amber-500
    'College of Liberal Arts': '#6366f1', // indigo-500
    'College of Nursing and Health Sciences': '#f43f5e', // rose-500
    'College of Science and Engineering': '#10b981', // emerald-500
    'Pre-Professional Pathways': '#64748b', // slate-500
};

const ComparePage: React.FC = () => {
    const { compareList, removeFromCompare, setCompareList } = useCompare();
    const { programs, departments, loading } = useData();
    const [searchParams, setSearchParams] = useSearchParams();
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [showCopyToast, setShowCopyToast] = useState(false);
    const [isSharedView, setIsSharedView] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // URL Sync on Mount
    useEffect(() => {
        if (loading) return;

        const leftId = searchParams.get('left');
        const rightId = searchParams.get('right');
        const p3Id = searchParams.get('p3');
        const p4Id = searchParams.get('p4');

        if (leftId || rightId || p3Id || p4Id) {
            setIsSharedView(true);
            const ids = [leftId, rightId, p3Id, p4Id].filter(Boolean) as string[];
            const matchedPrograms = ids
                .map(id => programs.find(p => p.program_id === id))
                .filter(Boolean) as Program[];

            if (matchedPrograms.length > 0) {
                // Only update if the current list is different from the URL list
                const currentIds = compareList.map(p => p.program_id).join(',');
                const newIds = matchedPrograms.map(p => p.program_id).join(',');
                if (currentIds !== newIds) {
                    setCompareList(matchedPrograms);
                }
            }
        }
    }, [loading, programs, searchParams, setCompareList, compareList]);

    // SEO Updates
    useEffect(() => {
        if (compareList.length > 0) {
            const names = compareList.map(p => p.program_name).join(' vs ');
            document.title = `${names} | WSU Major Explorer`;

            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) {
                metaDesc.setAttribute('content', `Compare ${compareList.map(p => p.program_name).join(' and ')} majors by outcomes, coursework, and career paths.`);
            }
        } else {
            document.title = 'Compare Programs | WSU Major Explorer';
        }
    }, [compareList]);

    const handleShare = () => {
        const params = new URLSearchParams();
        if (compareList[0]) params.set('left', compareList[0].program_id);
        if (compareList[1]) params.set('right', compareList[1].program_id);
        if (compareList[2]) params.set('p3', compareList[2].program_id);
        if (compareList[3]) params.set('p4', compareList[3].program_id);

        // Correctly handle HashRouter URLs: origin + pathname + #/compare?params
        const baseUrl = window.location.href.split('#')[0];
        const routedPath = location.pathname;
        const url = `${baseUrl}#${routedPath}?${params.toString()}`;

        navigator.clipboard.writeText(url).then(() => {
            setShowCopyToast(true);
            setTimeout(() => setShowCopyToast(false), 3000);
        });
    };

    const totalDepartments = departments.filter(d => d.total_enrollment_fall_2021 != null).length;

    const metrics = [
        { label: "College", getValue: (p: Program) => p.department?.college_name, isNumeric: false },
        { label: "Department", getValue: (p: Program) => p.department?.department_name, isNumeric: false },
        { label: "Department Enrollment & Rank", getValue: (p: Program) => p.department?.total_enrollment_fall_2021 ? `${p.department.total_enrollment_fall_2021} (Rank ${p.department.rank} of ${totalDepartments})` : 'N/A', isNumeric: false },
        { label: "Degree Type", getValue: (p: Program) => p.expanded_degree_type, isNumeric: false },
        { label: "Credential Level", getValue: (p: Program) => p.credential_level, isNumeric: false },
        { label: "Program Credits", getValue: (p: Program) => p.program_credits, higherIsBetter: false, isNumeric: false },
        { label: "Total Credits", getValue: (p: Program) => p.total_credits, higherIsBetter: false, isNumeric: true },
        { label: "Enrollment (Fall 2021)", getValue: (p: Program) => p.enrollment_fall_2021, higherIsBetter: true, isNumeric: true },
        { label: "Graduates (FY 2021)", getValue: (p: Program) => p.graduates_total, higherIsBetter: true, isNumeric: true },
        { label: "Median Salary (MN)", getValue: (p: Program) => p.career_outcomes && p.career_outcomes.length > 0 ? p.career_outcomes[0].median_salary_mn : null, higherIsBetter: true, isCurrency: true, isNumeric: true },
    ];

    const getBestValue = (metric: any) => {
        if (metric.higherIsBetter === undefined) return null;
        const numericValues = compareList.map(p => metric.getValue(p)).filter(v => typeof v === 'number') as number[];
        if (numericValues.length < 2) return null;
        return metric.higherIsBetter ? Math.max(...numericValues) : Math.min(...numericValues);
    };

    const handleStillCantDecide = () => {
        const programNames = compareList.map(p => p.program_name).join(', ');
        const prompt = `I'm trying to decide between these majors: ${programNames}. Can you help me understand the key differences and ask some questions to help me figure out which one is a better fit for me?`;
        navigate(`/advisor?prompt=${encodeURIComponent(prompt)}`);
    }

    const EmptyState = () => (
        <DynamicBackground className="flex-grow flex flex-col">
            <div className="flex-grow flex items-center justify-center py-40">
                <div className="text-center container mx-auto px-4 relative z-10">
                    <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white">Compare Programs</h1>
                    <p className="mt-4 text-gray-300 font-body">You haven't selected any programs to compare yet.</p>
                    <button onClick={() => setAddModalOpen(true)} className="mt-6 inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-md mouse:hover:bg-primary-700 font-semibold transition font-body">
                        <Plus size={18} /> Add Programs to Compare
                    </button>
                </div>
            </div>
        </DynamicBackground>
    );

    const TableView = () => (
        <DynamicBackground className="flex-grow">
            <div className={`container mx-auto px-4 sm:px-6 lg:px-8 py-24 relative`}>
                <div className="text-center mb-12">
                    {isSharedView && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-semibold mb-4 animate-fade-in">
                            Shared Comparison
                        </div>
                    )}
                    <h1 className="text-4xl md:text-5xl font-semibold text-white tracking-tight">
                        {compareList.length > 1
                            ? compareList.map(p => p.program_name).join(' vs ')
                            : 'Program Comparison'}
                    </h1>
                    <p className="mt-3 max-w-2xl mx-auto text-gray-400 font-body">A side-by-side look at your selected programs.</p>
                </div>

                <div className="flex justify-end gap-3 mb-6">
                    <button
                        onClick={handleShare}
                        className="font-body flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-800 text-sm font-semibold rounded-md text-white mouse:hover:bg-gray-800 transition-all active:scale-95"
                    >
                        <Share2 size={16} /> Share Comparison
                    </button>
                </div>

                <div className="rounded-xl border border-gray-800 bg-gray-950/50 backdrop-blur-lg">
                    {compareList.length < 4 && (
                        <div className="p-4 border-b border-gray-800 flex justify-start items-center sticky top-16 z-50 bg-gray-950/90 backdrop-blur-lg">
                            <button onClick={() => setAddModalOpen(true)} className="font-body flex items-center gap-2 px-4 py-2 border border-primary-700 text-sm font-semibold rounded-md text-primary-300 mouse:hover:bg-primary-900/50">
                                <Plus size={16} /> Add Program
                            </button>
                        </div>
                    )}

                    <div className="overflow-x-auto pb-4">
                        <table className="w-full min-w-[600px] border-separate border-spacing-0 table-fixed">
                            <tbody>
                                {/* Row 0: Programs */}
                                <tr className="border-b border-gray-800 bg-gray-950/70">
                                    <td className="sticky left-0 w-[140px] sm:w-[200px] md:w-[260px] p-2 sm:p-4 font-semibold text-white font-body bg-gray-950 z-20 border-r border-gray-800/50 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.5)]">
                                        <span className="text-sm sm:text-base">Programs</span>
                                    </td>
                                    {compareList.map(p => (
                                        <td
                                            key={`programs-${p.program_id}`}
                                            className="p-3 bg-gray-950 align-top"
                                        >
                                            <div
                                                className="relative h-full min-h-[56px] pl-3 pr-9 py-2 rounded-md bg-gray-900/60 flex flex-col justify-center"
                                                style={{
                                                    borderLeft: `4px solid ${collegeColorHexMap[p.department?.college_name || ''] || '#4b5563'}`
                                                }}
                                            >
                                                <p className="text-white text-sm sm:text-base font-semibold leading-snug truncate">
                                                    {p.program_name}
                                                </p>
                                                <button
                                                    onClick={() => removeFromCompare(p.program_id)}
                                                    className="absolute top-2 right-2 text-gray-400 mouse:hover:text-red-500"
                                                    aria-label={`Remove ${p.program_name}`}
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    ))}
                                </tr>

                                {/* Your existing metric rows */}
                                {metrics.map((metric) => {
                                    const bestValue = getBestValue(metric);

                                    return (
                                        <tr key={metric.label} className="group">
                                            <td className="sticky left-0 w-[140px] sm:w-[200px] md:w-[260px] p-2 sm:p-4 font-semibold text-gray-200 font-body bg-gray-950 z-20 border-b border-gray-800 border-r border-gray-800/50 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.5)] transition-colors mouse:group-hover:bg-gray-800">
                                                <span className="text-xs sm:text-sm">{metric.label}</span>
                                            </td>
                                            {compareList.map(p => {
                                                const value = metric.getValue(p);
                                                const isBest = value === bestValue && bestValue !== null && typeof value === 'number';
                                                const displayValue = value === null || value === undefined
                                                    ? <span className="text-gray-500 italic">N/A</span>
                                                    : metric.isCurrency ? `$${Number(value).toLocaleString()}` : String(value);

                                                const alignClass = metric.isNumeric ? 'text-center' : 'text-left';

                                                return (
                                                    <td key={p.program_id} className={`p-2 sm:p-4 text-xs sm:text-sm font-body align-middle bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 ${alignClass} ${isBest ? 'text-green-400 font-bold' : 'text-gray-100'} transition-colors mouse:group-hover:bg-gray-800/80`}>
                                                        {displayValue}
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {compareList.length > 1 && (
                    <div className="mt-8 text-center">
                        <button
                            onClick={handleStillCantDecide}
                            className="font-body inline-flex items-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 mouse:hover:bg-primary-500 transition"
                        >
                            <MessageCircle size={20} />
                            Still can't decide? Ask Advisor
                        </button>
                    </div>
                )}
            </div>
        </DynamicBackground>
    );

    return (
        <>
            {compareList.length === 0 ? <EmptyState /> : <TableView />}
            {isAddModalOpen && <AddProgramModal onClose={() => setAddModalOpen(false)} />}

            {/* Toast Notification */}
            <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] transition-all duration-300 pointer-events-none ${showCopyToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className="bg-gray-900 border border-gray-700 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                        <Check size={14} className="text-white" />
                    </div>
                    <span className="font-body text-sm font-medium">Link copied — anyone with it can view this comparison</span>
                </div>
            </div>
        </>
    );
};

const AddProgramModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { programs } = useData();
    const { addToCompare, isComparing, compareList } = useCompare();
    const [searchTerm, setSearchTerm] = useState("");
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsAnimating(true), 10);
        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setIsAnimating(false);
        setTimeout(onClose, 300);
    };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handleClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const filteredPrograms = programs.filter(p => p.program_name.toLowerCase().includes(searchTerm.toLowerCase()) && !isComparing(p.program_id));

    const handleAdd = (program: Program) => {
        if (!addToCompare(program)) {
            alert("You can compare a maximum of 4 programs.");
        }
    }

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ease-out ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
            style={{ backgroundColor: 'rgba(10, 10, 10, 0.7)' }}
            onClick={handleClose}
        >
            <div
                onClick={e => e.stopPropagation()}
                className={`bg-gray-900 rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col border border-gray-800 transition-all duration-300 ease-out ${isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            >
                <div className="p-4 border-b border-gray-800 flex justify-between items-center flex-shrink-0">
                    <h3 className="text-lg font-semibold">Add Program to Comparison ({compareList.length}/4)</h3>
                    <button onClick={handleClose}><X size={20} /></button>
                </div>
                <div className="p-4 flex-shrink-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search programs..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="font-body w-full pl-10 pr-4 py-2 bg-gray-800 rounded-md border border-gray-700"
                        />
                    </div>
                </div>
                <div className="px-4 pb-2 flex-grow overflow-y-auto">
                    <ul className="space-y-1">
                        {filteredPrograms.map(p => (
                            <li key={p.program_id} className="flex justify-between items-start py-3 px-2 rounded-md mouse:hover:bg-gray-800">
                                <div className="flex-1 min-w-0 mr-4 text-left">
                                    <p className="font-body truncate font-medium text-white">{p.program_name}</p>
                                    <p className="font-body text-xs text-gray-400">{p.department?.college_name}</p>
                                </div>
                                <button onClick={() => handleAdd(p)} className="flex-shrink-0 text-primary-500 mouse:hover:text-primary-400 text-sm font-semibold pt-0.5">Add</button>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="p-4 border-t border-gray-800 flex-shrink-0">
                    <button onClick={handleClose} className="w-full px-4 py-2 bg-primary-600 text-white rounded-md mouse:hover:bg-primary-700 font-body">Done</button>
                </div>
            </div>
        </div>
    );
};

export default ComparePage;