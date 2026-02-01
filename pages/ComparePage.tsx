import React, { useState, useEffect, useRef } from 'react';
import { useCompare } from '../contexts/CompareContext';
import { Link, useNavigate } from 'react-router-dom';
import { Program } from '../types';
import { MessageCircle, Plus, Search, X } from 'lucide-react';
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
    const { compareList, removeFromCompare } = useCompare();
    const { departments } = useData();
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const navigate = useNavigate();

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
                    <button onClick={() => setAddModalOpen(true)} className="mt-6 inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 font-semibold transition font-body">
                        <Plus size={18}/> Add Programs to Compare
                    </button>
                </div>
            </div>
        </DynamicBackground>
    );

    const TableView = () => (
        <DynamicBackground className="flex-grow">
            <div className={`container mx-auto px-4 sm:px-6 lg:px-8 py-24 relative`}>
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-semibold text-white tracking-tight">Program Comparison</h1>
                    <p className="mt-3 max-w-2xl mx-auto text-gray-400 font-body">A side-by-side look at your selected programs.</p>
                </div>
                
                <div className="rounded-xl border border-gray-800 bg-gray-950/50 backdrop-blur-lg">
                    {compareList.length < 4 && (
                         <div className="p-4 border-b border-gray-800 flex justify-start items-center sticky top-16 z-50 bg-gray-950/90 backdrop-blur-lg">
                            <button onClick={() => setAddModalOpen(true)} className="font-body flex items-center gap-2 px-4 py-2 border border-primary-700 text-sm font-semibold rounded-md text-primary-300 hover:bg-primary-900/50">
                                <Plus size={16}/> Add Program
                            </button>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px] border-separate border-spacing-0 table-fixed">
                            <tbody>
                                {/* Row 0: Programs */}
                                <tr className="border-b border-gray-800 bg-gray-950/70">
                                <td className="sticky left-0 w-[260px] p-4 font-semibold text-white font-body bg-gray-950 z-20">
                                    Programs
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
                                        <p className="text-white font-semibold leading-snug truncate">
                                        {p.program_name}
                                        </p>
                                        <button
                                        onClick={() => removeFromCompare(p.program_id)}
                                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
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
                                            <td className="sticky left-0 w-[260px] p-4 font-semibold text-gray-200 font-body bg-gray-950 z-20 border-b border-gray-800 transition-colors group-hover:bg-gray-800">
                                                {metric.label}
                                            </td>
                                            {compareList.map(p => {
                                                const value = metric.getValue(p);
                                                const isBest = value === bestValue && bestValue !== null && typeof value === 'number';
                                                const displayValue = value === null || value === undefined
                                                    ? <span className="text-gray-500 italic">N/A</span>
                                                    : metric.isCurrency ? `$${Number(value).toLocaleString()}` : String(value);
                                                
                                                const alignClass = metric.isNumeric ? 'text-center' : 'text-left';
                                                
                                                return (
                                                    <td key={p.program_id} className={`p-4 font-body align-middle bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 ${alignClass} ${isBest ? 'text-green-400 font-bold' : 'text-gray-100'} transition-colors group-hover:bg-gray-800/80`}>
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
                            className="font-body inline-flex items-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-500 transition"
                        >
                            <MessageCircle size={20}/>
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
        </>
    );
};

const AddProgramModal: React.FC<{onClose: () => void}> = ({onClose}) => {
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
        if(!addToCompare(program)) {
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
                    <button onClick={handleClose}><X size={20}/></button>
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
                            <li key={p.program_id} className="flex justify-between items-start py-3 px-2 rounded-md hover:bg-gray-800">
                                <div className="flex-1 min-w-0 mr-4 text-left">
                                    <p className="font-body truncate font-medium text-white">{p.program_name}</p>
                                    <p className="font-body text-xs text-gray-400">{p.department?.college_name}</p>
                                </div>
                                <button onClick={() => handleAdd(p)} className="flex-shrink-0 text-primary-500 hover:text-primary-400 text-sm font-semibold pt-0.5">Add</button>
                            </li>
                        ))}
                    </ul>
                </div>
                 <div className="p-4 border-t border-gray-800 flex-shrink-0">
                    <button onClick={handleClose} className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-body">Done</button>
                </div>
            </div>
        </div>
    );
};

export default ComparePage;