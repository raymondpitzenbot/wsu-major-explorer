import React from 'react';
import { Star, ExternalLink } from 'lucide-react';

interface Professor {
    name: string;
    title: string;
    rmp_id?: number;
    avg_rating?: number;
    num_ratings?: number;
    would_take_again_percent?: number;
    rmp_url?: string;
}

interface ProfessorWidgetProps {
    departmentId: string;
    professorsData: Record<string, Professor[]>;
}

const ProfessorWidget: React.FC<ProfessorWidgetProps> = ({ departmentId, professorsData }) => {
    const professors = professorsData[departmentId] || [];

    if (professors.length === 0) {
        return null;
    }

    return (
        <div className="bg-gray-900 rounded-xl border border-gray-800 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Star className="text-blue-500 fill-blue-500/20" size={16} />
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">
                        Related Faculty
                    </h3>
                </div>
                <div className="flex gap-1.5">
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-blue-950/30 text-blue-400/70 border border-blue-900/30 font-bold uppercase tracking-tighter">Winona.edu</span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-blue-950/30 text-blue-400/70 border border-blue-900/30 font-bold uppercase tracking-tighter">RateMyProfessor</span>
                </div>
            </div>

            <div className="space-y-3">
                {professors.slice(0, 3).map((prof, idx) => (
                    <div
                        key={idx}
                        className="bg-gray-950/40 border border-gray-800/60 rounded-lg p-3 hover:bg-gray-900/80 hover:border-blue-900/30 transition-all group"
                    >
                        <div className="flex justify-between items-start gap-3">
                            <div>
                                {/* Professor Name */}
                                <div className="text-gray-200 font-bold text-sm leading-tight">
                                    {prof.name}
                                </div>

                                {/* Title */}
                                <div className="text-gray-500 text-[11px] mt-0.5 leading-tight font-medium">
                                    {prof.title}
                                </div>
                            </div>

                            {/* Rating (Compact) */}
                            <div className="flex flex-col items-end">
                                <div className="flex items-center gap-1 bg-blue-950/20 px-1.5 py-0.5 rounded border border-blue-900/20">
                                    <span className="text-blue-400 font-bold text-xs">
                                        {prof.avg_rating && prof.avg_rating > 0 ? prof.avg_rating.toFixed(1) : 'N/A'}
                                    </span>
                                    <Star className="text-blue-500 fill-blue-500" size={10} />
                                </div>
                                <span className="text-gray-600 text-[9px] mt-0.5 font-medium">
                                    {prof.num_ratings || 0} reviews
                                </span>
                            </div>
                        </div>

                        {/* Footer Info (Hidden unless there's data to show, kept minimal) */}
                        {(prof.would_take_again_percent && prof.would_take_again_percent > 0) || prof.rmp_url ? (
                            <div className="mt-2 pt-2 border-t border-gray-800/60 flex items-center justify-between">
                                {prof.would_take_again_percent && prof.would_take_again_percent > 0 ? (
                                    <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wide">
                                        {prof.would_take_again_percent.toFixed(0)}% would take again
                                    </div>
                                ) : <div></div>}

                                {prof.rmp_url && (
                                    <a
                                        href={prof.rmp_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[9px] text-blue-400/80 hover:text-blue-300 transition-colors group-hover:underline decoration-blue-500/30 uppercase font-bold tracking-wide"
                                    >
                                        View on RMP
                                        <ExternalLink size={8} />
                                    </a>
                                )}
                            </div>
                        ) : null}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProfessorWidget;
