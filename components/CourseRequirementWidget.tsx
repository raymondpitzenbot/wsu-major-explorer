
import React, { useState, useMemo } from 'react';
import { CourseGroup, Course, CourseText } from '../types';
import { ChevronDown, ChevronRight, BookOpen, AlertCircle, Calendar } from 'lucide-react';

interface CourseRequirementWidgetProps {
    courseStructure: CourseGroup[];
}

const cleanText = (text: string) => {
    if (!text) return '';
    // Remove common WSU catalog symbols
    let cleaned = text.replace(/[△*^†‡§#◆◇♦◎]/g, '').trim();

    // Remove (X credits), (Select X credits), (Choose X-Y credits) at the end
    // Regex explanation:
    // \s*         : Optional whitespace
    // \(          : Opening paren
    // (?:[^)]*?)  : Optional non-greedy text (e.g. "Select ", "Total ")
    // \d+(?:-\d+)? : The number (e.g. "3" or "3-4")
    // \s*credits? : " credits" or " credit"
    // \)          : Closing paren
    cleaned = cleaned.replace(/\s*\((?:[^)]*?\s+)?\d+(?:-\d+)?\s*credits?\)\s*$/i, '').trim();

    // Remove " - " if it's left hanging at the start (common if symbol was at start)
    cleaned = cleaned.replace(/^- /, '').trim();

    // Normalize "Major Requirements" etc to consistent naming if it's a top level group
    if (cleaned.toLowerCase() === 'major requirements') return 'Program Requirements';

    // Hide data timeline notes from the main list as we'll show them in the header
    if (cleaned.toLowerCase().includes('data may be outdated') || /20\d{2}-20\d{2} data/i.test(cleaned)) {
        return '';
    }

    return cleaned;
};

const extractCredits = (name: string) => {
    // Matches "(3 credits)", "(Select 3 credits)", "(Total 12 credits)" and extracts the number
    const match = name.match(/\((?:[^)]*?\s+)?(\d+(?:-\d+)?)\s*credits?\)/i);
    return match ? match[1] : null;
};


const CourseItem: React.FC<{ item: Course | CourseText }> = ({ item }) => {
    if (item.type === 'text') {
        const cleanedContent = cleanText(item.content);
        if (!cleanedContent) return null;
        return <div className="py-1 px-2 text-gray-500 italic text-[11px] border-l border-gray-700 ml-1 mb-1">{cleanedContent}</div>;
    }

    let cleanedTitle = cleanText(item.course_title);
    let courseId = item.course_id;

    // Aggressive split logic if ID is missing or Title contains ID
    if (!courseId || cleanedTitle.includes(courseId)) {
        // Regex to find ID at start: ENG 404, MIS362, etc.
        // Followed by separator: - : – or space
        const match = cleanedTitle.match(/^([A-Z]{2,4}\s*\d{3}[A-Z]*)\s*[-:–]?\s*(.*)$/);
        if (match) {
            courseId = match[1];
            cleanedTitle = match[2];
        } else if (cleanedTitle.includes(' - ')) {
            const parts = cleanedTitle.split(' - ');
            if (parts[0].match(/[A-Z]+\s+\d+/)) {
                courseId = parts[0].trim();
                cleanedTitle = parts.slice(1).join(' - ').trim();
            }
        }
    }

    return (
        <div className="flex items-start gap-2 p-1.5 bg-gray-900/20 border border-gray-800/60 transition-colors hover:bg-gray-800/40">
            <div className="mt-1.5 w-1 h-1 rounded-full bg-gray-600 shrink-0 opacity-50"></div>
            <div className="min-w-0 flex-grow">
                {courseId && <div className="font-bold text-gray-300 text-xs leading-tight">{courseId}</div>}
                <div className="text-[11px] text-gray-400 leading-tight">{cleanedTitle}</div>
            </div>
            {item.credits && (
                <div className="self-center text-[10px] font-bold text-white px-2 py-1 border border-white/20 uppercase tracking-wider shrink-0">
                    {item.credits.replace(/[a-z]/gi, '').trim()} CR
                </div>
            )}
        </div>
    );
};


// Helper to determine depth style
const getHeaderStyle = (depth: number) => {
    switch (depth) {
        case 0: return "text-sm font-black text-white mb-2 mt-6 first:mt-0 border-b border-gray-800 pb-1 uppercase tracking-widest";
        case 1: return "text-xs font-bold text-gray-300 mb-1 mt-3 uppercase tracking-wider";
        default: return "text-[10px] font-bold text-gray-500 mb-1 mt-2 uppercase";
    }
};

const RecursiveSection: React.FC<{ group: CourseGroup; depth: number }> = ({ group, depth }) => {
    // Clean the name but keep it faithful to the catalog
    const cleanedName = cleanText(group.group_name);

    // Extract credits for display if present
    const creditsFromHeader = extractCredits(group.group_name);
    let displayCredits = group.credits_required || creditsFromHeader;

    return (
        <div className={`flex flex-col ${depth > 0 ? 'ml-3 pl-3 border-l border-gray-800/30' : ''}`}>
            {cleanedName && (
                <div className={`flex items-end justify-between ${getHeaderStyle(depth)}`}>
                    <span className="flex-grow mr-2">{cleanedName}</span>
                    {displayCredits && (
                        <span className="shrink-0 text-[10px] font-bold px-2 py-1 border bg-amber-900/10 text-amber-500/80 border-amber-900/20">
                            {depth > 0 ? `CHOOSE ${displayCredits} CR` : `${displayCredits} CR`}
                        </span>
                    )}
                </div>
            )}

            {/* Notes */}
            {group.notes && group.notes.length > 0 && (
                <div className="mb-2 space-y-1">
                    {group.notes.map((note, idx) => (
                        <p key={idx} className="text-[10px] text-blue-400/70 italic pl-1">{note}</p>
                    ))}
                </div>
            )}

            {/* Items */}
            <div className="space-y-1 mb-2">
                {group.items.map((item, idx) => (
                    <React.Fragment key={idx}>
                        <CourseItem item={item} />
                    </React.Fragment>
                ))}
            </div>

            {/* Subgroups */}
            {group.subgroups && group.subgroups.length > 0 && (
                <div className="space-y-2">
                    {group.subgroups.map((sub, idx) => (
                        <RecursiveSection key={idx} group={sub} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

const CourseRequirementWidget: React.FC<CourseRequirementWidgetProps> = ({ courseStructure }) => {
    const [isOpen, setIsOpen] = useState(true);

    const catalogTimeline = useMemo(() => {
        const extract = (structure: CourseGroup[]): string | null => {
            for (const group of structure) {
                for (const item of group.items) {
                    if (item.type === 'text') {
                        const match = item.content.match(/(20\d{2}-20\d{2}|\d{2}-\d{2})/);
                        if (match) return match[1];
                    }
                }
                if (group.subgroups) {
                    const result = extract(group.subgroups);
                    if (result) return result;
                }
            }
            return null;
        };
        const found = extract(courseStructure);
        if (found) {
            const parts = found.split('-');
            const start = parts[0].length === 2 ? `20${parts[0]}` : parts[0];
            const end = parts[1].length === 2 ? `20${parts[1]}` : parts[1];
            return `${start}-${end}`;
        }
        return "2024-2025";
    }, [courseStructure]);

    if (!courseStructure || courseStructure.length === 0) return null;

    return (
        <div className="space-y-6">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between pb-2 border-b border-gray-800 hover:bg-gray-900/50 transition-colors group rounded px-2 -mx-2"
            >
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-gray-400">
                        <Calendar size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Academic Year</span>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${catalogTimeline.includes('2025-2026') ? 'bg-purple-900/30 text-purple-400 border-purple-800' : 'bg-blue-900/10 text-blue-400/80 border-blue-900/30'}`}>
                        {catalogTimeline}
                    </span>
                </div>
                <div className="text-gray-500 group-hover:text-gray-300 transition-colors">
                    {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
            </button>

            {isOpen && (
                <div className="animate-fade-in space-y-6">
                    {courseStructure.map((group, idx) => (
                        <RecursiveSection key={idx} group={group} depth={0} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default CourseRequirementWidget;
