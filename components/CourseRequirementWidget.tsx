
import React, { useState } from 'react';
import { CourseGroup, Course, CourseText } from '../types';
import { ChevronDown, ChevronRight, BookOpen, AlertCircle, CheckCircle } from 'lucide-react';

interface CourseRequirementWidgetProps {
    courseStructure: CourseGroup[];
}

const CourseItem: React.FC<{ item: Course | CourseText }> = ({ item }) => {
    if (item.type === 'text') {
        return <div className="py-2 px-3 text-gray-600 dark:text-gray-400 italic text-sm border-l-2 border-gray-300 dark:border-gray-600 ml-2">{item.content}</div>;
    }

    return (
        <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <BookOpen size={16} />
                </div>
                <div>
                    <div className="font-medium text-gray-900 dark:text-white">{item.course_id}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{item.course_title}</div>
                </div>
            </div>
            <div className="text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                {item.credits}
            </div>
        </div>
    );
};

const GroupSection: React.FC<{ group: CourseGroup; defaultOpen?: boolean }> = ({ group, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const isChoice = group.display_type === 'choice_credits' || group.display_type === 'choice_count';

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden mb-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
                <div className="flex items-center gap-3">
                    {isOpen ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
                    <h3 className="font-semibold text-gray-900 dark:text-white">{group.group_name}</h3>
                </div>
                <div className="flex items-center gap-2">
                    {group.credits_required && (
                        <span className={`text-xs px-2.5 py-1 rounded-full border ${isChoice ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800' : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'}`}>
                            {isChoice ? `Choose ${group.credits_required} Credits` : `${group.credits_required} Credits Required`}
                        </span>
                    )}
                </div>
            </button>

            {isOpen && (
                <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 space-y-3">
                    {group.notes && group.notes.length > 0 && (
                        <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-3 rounded-lg text-sm flex gap-2">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <div>
                                {group.notes.map((note, idx) => (
                                    <p key={idx}>{note}</p>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        {group.items.map((item, idx) => (
                            <CourseItem key={idx} item={item} />
                        ))}
                    </div>

                    {group.subgroups?.map((sub, idx) => (
                        <div key={idx} className="ml-4 mt-4 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                            <GroupSection group={sub} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const CourseRequirementWidget: React.FC<CourseRequirementWidgetProps> = ({ courseStructure }) => {
    if (!courseStructure || courseStructure.length === 0) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="text-purple-600" />
                    Major Requirements
                </h2>
                <div className="text-sm text-gray-500">
                    Auto-generated from 2025-2026 Catalog
                </div>
            </div>

            <div className="space-y-1">
                {courseStructure.map((group, idx) => (
                    <GroupSection key={idx} group={group} defaultOpen={false} />
                ))}
            </div>
        </div>
    );
};

export default CourseRequirementWidget;
