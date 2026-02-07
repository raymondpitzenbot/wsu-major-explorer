import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { ArrowLeft, ExternalLink, Scale, CheckCircle, XCircle, Briefcase, Handshake, Building, MapPin, BookOpen, TrendingUp, TrendingDown, Minus, Users, ChevronDown } from 'lucide-react';
import { useCompare } from '../contexts/CompareContext';
import { CareerOutcome } from '../types';
import CourseRequirementWidget from '../components/CourseRequirementWidget';
import ProfessorWidget from '../components/ProfessorWidget';
import professorsData from '../data/professors_data.json';

// Helper Components
const Widget: React.FC<{ title: string, icon?: React.ReactNode, children: React.ReactNode, year?: string, defaultOpen?: boolean }> = ({ title, icon, children, year, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = React.useState(defaultOpen);

    return (
        <div className="bg-gray-900 rounded-xl border border-gray-800 shadow-sm relative overflow-hidden transition-all duration-300">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-6 flex items-center justify-between text-left group hover:bg-gray-800/20 transition-colors"
            >
                <h2 className="text-xl sm:text-2xl font-bold flex items-center text-white">
                    <span className="flex items-center gap-3">{icon} {title}</span>
                    {year && <span className="ml-3 text-[10px] font-bold px-2 py-0.5 rounded bg-gray-800 border border-gray-700 text-gray-500 uppercase tracking-widest">{year}</span>}
                </h2>
                <ChevronDown className={`text-gray-500 group-hover:text-white transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="px-6 pb-6 border-t border-gray-800/50 pt-6">
                    {children}
                </div>
            )}
        </div>
    );
};

const CareerOutlookCard: React.FC<{ outcome: CareerOutcome }> = ({ outcome }) => {
    return (
        <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
            <h4 className="font-bold text-lg text-white">{outcome.occupation_title}</h4>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <p className="text-sm text-gray-400 font-body uppercase tracking-wider text-[10px] font-bold">Median Salary (MN)</p>
                    <p className="text-xl font-semibold text-primary-400">${outcome.median_salary_mn?.toLocaleString() ?? 'N/A'}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-400 font-body uppercase tracking-wider text-[10px] font-bold">10-Year Growth (MN)</p>
                    <p className="text-xl font-semibold text-primary-400">{outcome.growth_rate_10yr_mn ?? 'N/A'}</p>
                </div>
            </div>
            <a href={outcome.occupation_data_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-4 text-sm font-semibold text-primary-500 hover:text-primary-400 transition-colors font-body">
                View on MN DEED <ExternalLink size={14} />
            </a>
        </div>
    );
};

const JobLinkCard: React.FC<{ icon: React.ReactElement<{ size?: number }>, title: string, subtitle: string, href: string }> = ({ icon, title, subtitle, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="group p-4 bg-gray-800/30 rounded-xl border border-gray-700 flex items-center gap-4 hover:border-primary-500 hover:bg-gray-800/60 transition-all">
        <div className="flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center bg-primary-900/40 text-primary-400">
            {React.cloneElement(icon, { size: 20 })}
        </div>
        <div className="flex-grow min-w-0">
            <h4 className="font-semibold text-white truncate text-sm">{title}</h4>
            <p className="text-[11px] text-gray-400 font-body truncate">{subtitle}</p>
        </div>
        <ExternalLink className="text-gray-500 group-hover:text-primary-400 transition" size={16} />
    </a>
);

const TrendIcon = ({ trend }: { trend: 'Up' | 'Down' | 'Stable' | null | undefined }) => {
    if (trend === 'Up') return <TrendingUp size={14} className="text-emerald-500" />;
    if (trend === 'Down') return <TrendingDown size={14} className="text-rose-500" />;
    return <Minus size={14} className="text-gray-500" />;
};

const SnapshotRow: React.FC<{ label: string, value: string | number, trend?: 'Up' | 'Down' | 'Stable' | null }> = ({ label, value, trend }) => (
    <div className="flex justify-between items-start py-1.5 border-b border-gray-800/50 last:border-0 font-body">
        <dt className="text-gray-500 text-xs">{label}</dt>
        <dd className="font-bold flex items-center gap-1 text-white text-xs text-right ml-4">
            {trend && <TrendIcon trend={trend} />} {value}
        </dd>
    </div>
);

const ProgramDetailPage: React.FC = () => {
    const { programId } = useParams<{ programId: string }>();
    const { getProgramById, departments } = useData();
    const { addToCompare, removeFromCompare, isComparing } = useCompare();

    const program = getProgramById(programId);

    // SEO Data
    const siteUrl = "https://wsu-major-explorer.vercel.app";
    const canonicalUrl = program ? `${siteUrl}/program/${program.program_id}` : siteUrl;

    const jsonLd = program ? {
        "@context": "https://schema.org",
        "@type": "EducationalOccupationalProgram",
        "name": program.program_name,
        "description": program.overview,
        "educationalCredentialAwarded": program.degree_type,
        "provider": {
            "@type": "CollegeOrUniversity",
            "name": "Winona State University",
            "url": "https://www.winona.edu"
        },
        "url": canonicalUrl
    } : null;

    if (!program) {
        return <div className="text-center py-20 font-body text-white">Program not found.</div>;
    }

    const isAddedToCompare = isComparing(program.program_id);
    const totalDepartments = departments.filter(d => d.total_enrollment_fall_2021 != null).length;

    const handleCompareToggle = () => {
        if (isAddedToCompare) {
            removeFromCompare(program.program_id);
        } else {
            if (!addToCompare(program)) {
                alert("You can compare a maximum of 4 programs.");
            }
        }
    };

    return (
        <div className="bg-gray-950 min-h-screen">
            <Helmet>
                <title>{`${program.program_name} | WSU Major Explorer`}</title>
                <meta name="description" content={program.overview ? program.overview.substring(0, 160) + '...' : `Explore the ${program.program_name} program at Winona State University.`} />
                <link rel="canonical" href={canonicalUrl} />
                <script type="application/ld+json">
                    {JSON.stringify(jsonLd)}
                </script>
            </Helmet>
            <div className="bg-gray-900/50 border-b border-gray-800 pt-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative pb-8">
                    <Link to="/explore" className="flex items-center gap-2 text-xs text-primary-400 hover:text-primary-300 mb-6 font-bold font-body uppercase tracking-widest">
                        <ArrowLeft size={14} /> Back to Explore
                    </Link>

                    <div className="relative z-10 p-6 -mx-4 sm:-mx-6 rounded-2xl bg-gradient-to-br from-gray-800/40 to-transparent border border-white/5 shadow-2xl backdrop-blur-sm">
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-snug mb-4 tracking-tight break-words">{program.program_name}</h1>
                        <div className="text-primary-400 text-xs font-bold inline-block px-3 py-1.5 rounded-md mb-3 font-body bg-primary-500/10 border border-primary-500/20 uppercase tracking-wide">
                            {program.expanded_degree_type || program.degree_type}
                        </div>

                        <p className="mt-2 text-sm text-gray-400 font-body flex flex-col sm:flex-row sm:items-center gap-2">
                            <span className="flex items-center gap-2">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary-400"></span>
                                {program.department?.department_name}
                            </span>
                            <span className="hidden sm:inline text-gray-700">•</span>
                            <span>{program.department?.college_name}</span>
                        </p>
                    </div>

                    <p className="mt-6 max-w-2xl text-gray-300 font-body leading-relaxed text-sm sm:text-base">{program.overview}</p>

                    <div className="mt-8 flex flex-col sm:flex-row gap-3">
                        <a href={program.program_page_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold rounded-lg text-white bg-primary-600 hover:bg-primary-500 transition-all font-body active:scale-[0.98]">
                            Official Catalog <ExternalLink size={16} />
                        </a>
                        <button
                            onClick={handleCompareToggle}
                            className={`font-body inline-flex items-center justify-center gap-2 px-6 py-3 border text-sm font-bold rounded-lg transition-all active:scale-[0.98] ${isAddedToCompare ? 'border-primary-500 text-primary-400 bg-primary-500/10 hover:bg-primary-500/20' : 'border-gray-700 text-gray-300 bg-gray-800/50 hover:bg-gray-800'}`}
                        >
                            {isAddedToCompare ? <Minus size={16} /> : <Scale size={16} />}
                            {isAddedToCompare ? 'Remove from Compare' : 'Add to Compare'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">

                        {program.you_might_like && program.you_might_like.length > 0 && (
                            <Widget title="Is This Major Right For You?">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-emerald-400 uppercase tracking-wider"><CheckCircle size={18} /> Why this is a great fit for you</h3>
                                        <ul className="space-y-3 font-body">
                                            {program.you_might_like?.map(item => (
                                                <li key={item} className="flex items-start gap-2 text-gray-300 text-sm">
                                                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500/40"></span>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-rose-400 uppercase tracking-wider"><XCircle size={18} /> Why this might not be for you</h3>
                                        <ul className="space-y-3 font-body">
                                            {program.not_for_you?.map(item => (
                                                <li key={item} className="flex items-start gap-2 text-gray-300 text-sm">
                                                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500/40"></span>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </Widget>
                        )}

                        {/* Course Requirements Widget */}
                        {program.course_structure && (
                            <Widget title="Program Requirements" icon={<BookOpen size={24} className="text-purple-400" />} defaultOpen={false}>
                                <CourseRequirementWidget courseStructure={program.course_structure} />
                            </Widget>
                        )}

                        <Widget title="Career Outlook" icon={<Briefcase size={24} className="text-blue-400" />}>
                            {program.career_outcomes && program.career_outcomes.length > 0 ? (
                                <div className="space-y-6">
                                    {program.career_outcomes.map(outcome => (
                                        <CareerOutlookCard key={outcome.occupation_code} outcome={outcome} />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 font-body text-sm italic">Specific career outcome data is not available for this program.</p>
                            )}

                            {program.career_outcomes && program.related_job_titles && program.related_job_titles.length > 0 && (
                                <div className="mt-6 pt-4 border-t border-gray-800">
                                    <h3 className="text-xs font-bold mb-2 text-white uppercase tracking-wider">Other Common Roles</h3>
                                    <p className="text-sm text-gray-400 font-body">
                                        {program.related_job_titles.slice(0, 4).join(', ')}
                                    </p>
                                </div>
                            )}
                        </Widget>

                        <Widget title="Explore Job Opportunities" icon={<Building size={24} className="text-amber-400" />}>
                            <p className="text-sm text-gray-500 mb-6 font-body">Find jobs related to this major in the Winona area and beyond</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <JobLinkCard icon={<Building />} title="Indeed" subtitle="Jobs in Winona, MN area" href={`https://www.indeed.com/q-${program.program_name}-jobs.html`} />
                                <JobLinkCard icon={<Briefcase />} title="LinkedIn" subtitle="Professional network" href={`https://www.linkedin.com/jobs/search/?keywords=${program.program_name}`} />
                                <JobLinkCard icon={<MapPin />} title="Minnesota Works" subtitle="State job bank" href="https://www.minnesotaworks.net/" />
                                <JobLinkCard icon={<Handshake />} title="Handshake" subtitle="WSU career platform" href="https://winona.joinhandshake.com/" />
                            </div>
                        </Widget>

                    </div>

                    <div className="space-y-6 lg:sticky top-24 self-start">
                        <div className="p-6 bg-gray-900 rounded-xl border border-gray-800 shadow-sm relative overflow-hidden">
                            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex justify-between items-center">
                                <span>Program Snapshot</span>
                                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-blue-950/30 text-blue-400/70 border border-blue-900/30 uppercase tracking-tighter">IPAR (2021)</span>
                            </h3>
                            <dl className="space-y-1">
                                <SnapshotRow label="Est. Time" value="4 years" />
                                <SnapshotRow label="Program Credits" value={program.program_credits} />
                                <SnapshotRow label="Total Credits" value={program.total_credits} />
                                <SnapshotRow label="Fall 2021 Enrollment" value={`${program.enrollment_fall_2021 ?? 'N/A'}`} trend={program.enrollment_trend} />
                                <SnapshotRow label="Graduates (2021)" value={`${program.graduates_total ?? 'N/A'}`} />
                            </dl>
                        </div>

                        {program.department && (
                            <div className="p-6 bg-gray-900 rounded-xl border border-gray-800 shadow-sm">
                                <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex justify-between items-center">
                                    <span>Department Info</span>
                                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-blue-950/30 text-blue-400/70 border border-blue-900/30 uppercase tracking-tighter">IPAR (2021)</span>
                                </h3>
                                <dl className="space-y-1">
                                    <SnapshotRow label="Name" value={program.department.department_name} />
                                    <SnapshotRow label="Enrollment" value={program.department.total_enrollment_fall_2021 ?? 'N/A'} />
                                    <SnapshotRow label="Size Rank" value={program.department.rank ? `Rank ${program.department.rank} of ${totalDepartments}` : 'N/A'} />
                                </dl>
                            </div>
                        )}

                        {/* Professor Widget */}
                        {program.department && (
                            <ProfessorWidget
                                departmentId={program.department.department_id}
                                professorsData={professorsData}
                            />
                        )}

                        {program.recommended_minors && program.recommended_minors.length > 0 && (
                            <div className="p-6 bg-gray-900 rounded-xl border border-gray-800 shadow-sm">
                                <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4">Minors pair well with</h3>
                                <div className="flex flex-wrap gap-2">
                                    {program.recommended_minors.map(minor => <span key={minor.id} className="font-body bg-gray-800 text-gray-300 text-[10px] font-bold px-2.5 py-1 rounded border border-gray-700">{minor.name}</span>)}
                                </div>
                            </div>
                        )}

                        {program.clubs && program.clubs.length > 0 && (
                            <div className="p-6 bg-gray-900 rounded-xl border border-gray-800 shadow-sm">
                                <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4">Related Clubs</h3>
                                <div className="space-y-2">
                                    {program.clubs.map(club => (
                                        <a href={club.club_url} target="_blank" rel="noopener noreferrer" key={club.club_id} className="group flex items-center justify-between font-body bg-gray-800/40 text-[11px] font-bold px-3 py-2 rounded border border-gray-800 hover:border-primary-500 transition-all">
                                            <span className="text-gray-300 truncate mr-2">{club.club_name}</span>
                                            <ExternalLink size={12} className="text-gray-600 group-hover:text-primary-400" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProgramDetailPage;
