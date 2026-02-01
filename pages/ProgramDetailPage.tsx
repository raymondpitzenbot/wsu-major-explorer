
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { ArrowLeft, ExternalLink, Scale, CheckCircle, XCircle, Briefcase, Handshake, Building, MapPin, DollarSign, BarChart2, Clock, Users, BookOpen, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useCompare } from '../contexts/CompareContext';
import { CareerOutcome } from '../types';

const ProgramDetailPage: React.FC = () => {
    const { programId } = useParams<{ programId: string }>();
    const { getProgramById, departments } = useData();
    const { addToCompare, isComparing } = useCompare();

    const program = getProgramById(programId);

    if (!program) {
        return <div className="text-center py-20 font-body">Program not found.</div>;
    }
    
    const isAddedToCompare = isComparing(program.program_id);
    const totalDepartments = departments.filter(d => d.total_enrollment_fall_2021 != null).length;


    const handleAddToCompare = () => {
        if (!addToCompare(program)) {
            alert("You can compare a maximum of 4 programs.");
        }
    };
    
    return (
        <div className="bg-gray-950">
            <div className="bg-gray-900 border-b border-gray-800 pt-12">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative pb-8">
                    <Link to="/explore" className="flex items-center gap-2 text-sm text-primary-400 hover:underline mb-8 font-semibold font-body">
                        <ArrowLeft size={16} /> Back to Explore
                    </Link>
                    <div className="text-primary-400 text-sm font-semibold inline-block px-3 py-1 rounded-full mb-4 font-body bg-primary-500/10 border border-primary-500/20">
                        {program.expanded_degree_type || program.degree_type}
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-white mt-1">{program.program_name}</h1>
                    <p className="mt-2 text-lg text-gray-400 font-body">{program.department?.department_name} &bull; {program.department?.college_name}</p>
                    <p className="mt-4 max-w-2xl text-gray-300 font-body">{program.overview}</p>
                    <div className="mt-8 flex flex-col sm:flex-row gap-4">
                        <a href={program.program_page_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-500 transition font-body">
                            Official Catalog <ExternalLink size={18} />
                        </a>
                        <button onClick={handleAddToCompare} disabled={isAddedToCompare} className="font-body inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-700 text-base font-medium rounded-md text-gray-200 bg-gray-800/50 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition">
                            <Scale size={18} /> {isAddedToCompare ? 'Added to Compare' : 'Add to Compare'}
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
                                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-400"><CheckCircle size={20}/> Great fit if you...</h3>
                                        <ul className="space-y-2 list-disc list-inside text-gray-300 font-body">
                                            {program.you_might_like?.map(item => <li key={item}>{item}</li>)}
                                        </ul>
                                    </div>
                                     <div>
                                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-orange-400"><XCircle size={20}/> May not be ideal if you...</h3>
                                        <ul className="space-y-2 list-disc list-inside text-gray-300 font-body">
                                            {program.not_for_you?.map(item => <li key={item}>{item}</li>)}
                                        </ul>
                                    </div>
                                 </div>
                            </Widget>
                        )}

                        <Widget title="Career Outlook" icon={<Briefcase />}>
                            {program.career_outcomes && program.career_outcomes.length > 0 ? (
                                <div className="space-y-6">
                                    {program.career_outcomes.map(outcome => (
                                        <CareerOutlookCard key={outcome.occupation_code} outcome={outcome} />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-400 font-body">Specific career outcome data is not available for this program.</p>
                            )}

                            {program.related_job_titles && program.related_job_titles.length > 0 && (
                                <div className="mt-8">
                                    <h3 className="text-lg font-semibold mb-2">Common Career Paths</h3>
                                    <p className="text-sm text-gray-400 mb-4 font-body">Other common careers for graduates of this program</p>
                                    <div className="flex flex-wrap gap-2">
                                        {program.related_job_titles?.map(title => <span key={title} className="font-body bg-primary-900/50 text-primary-200 text-sm font-medium px-3 py-1 rounded-full">{title}</span>)}
                                    </div>
                                </div>
                            )}
                         </Widget>
                        
                        <Widget title="Explore Job Opportunities" icon={<Building />}>
                           <p className="text-gray-400 mb-6 font-body">Find jobs related to this major in the Winona area and beyond</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <JobLinkCard icon={<Building/>} title="Indeed" subtitle="Search jobs in Winona, MN area" href={`https://www.indeed.com/q-${program.program_name}-jobs.html`} />
                               <JobLinkCard icon={<Briefcase/>} title="LinkedIn Jobs" subtitle="Professional network jobs" href={`https://www.linkedin.com/jobs/search/?keywords=${program.program_name}`} />
                               <JobLinkCard icon={<MapPin/>} title="Minnesota Works" subtitle="State job bank" href="https://www.minnesotaworks.net/" />
                               <JobLinkCard icon={<Handshake/>} title="Handshake (WSU)" subtitle="WSU career platform for students" href="https://winona.joinhandshake.com/" />
                            </div>
                             <div className="mt-6 p-4 bg-primary-900/30 rounded-xl border border-primary-800 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-primary-200">WSU Career Services</h3>
                                    <p className="text-sm text-primary-300 font-body">Get personalized job search help</p>
                                </div>
                                <a href="https://www.winona.edu/career/" target="_blank" rel="noopener noreferrer" className="font-body bg-primary-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-primary-700">Visit <ExternalLink className="inline-block ml-1" size={14}/></a>
                            </div>
                        </Widget>

                    </div>
                    <div className="space-y-6 lg:sticky top-24 self-start">
                         <Widget title="Program Snapshot">
                             <dl className="space-y-3 text-sm font-body">
                                <SnapshotRow label="Typical Time to Complete" value="4 years" />
                                <SnapshotRow label="Program Credits" value={program.program_credits} />
                                <SnapshotRow label="Total Credits to Graduate" value={program.total_credits} />
                                <SnapshotRow label="WSU Enrollment (Fall 2021)" value={`${program.enrollment_fall_2021 ?? 'N/A'}`} trend={program.enrollment_trend} />
                                <SnapshotRow label="Degrees Awarded (2021)" value={`${program.graduates_total ?? 'N/A'}`} />
                             </dl>
                         </Widget>

                         {program.department && (
                            <Widget title="Department Snapshot">
                                <dl className="space-y-3 text-sm font-body">
                                    <SnapshotRow label="Department" value={program.department.department_name} />
                                    <SnapshotRow label="Department Enrollment" value={program.department.total_enrollment_fall_2021 ?? 'N/A'} />
                                    <SnapshotRow label="Enrollment Rank" value={program.department.rank ? `Rank ${program.department.rank} of ${totalDepartments}` : 'N/A'} />
                                </dl>
                            </Widget>
                        )}

                        {program.recommended_minors && program.recommended_minors.length > 0 && (
                             <Widget title="Recommended Minors" icon={<BookOpen size={20} />}>
                                <div className="flex flex-wrap gap-2">
                                    {program.recommended_minors.map(minor => <span key={minor.id} className="font-body bg-gray-700 text-sm font-medium px-3 py-1 rounded-full">{minor.name}</span>)}
                                </div>
                            </Widget>
                        )}
                        {program.clubs && program.clubs.length > 0 && (
                            <Widget title="Related Clubs & Orgs" icon={<Users size={20}/>}>
                                <div className="flex flex-wrap gap-2">
                                    {program.clubs.map(club => (
                                        <a href={club.club_url} target="_blank" rel="noopener noreferrer" key={club.club_id} className="font-body bg-gray-700 text-sm font-medium px-3 py-1 rounded-full hover:bg-gray-600 transition">
                                            {club.club_name}
                                        </a>
                                    ))}
                                </div>
                            </Widget>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const Widget: React.FC<{title: string, icon?: React.ReactNode, children: React.ReactNode}> = ({title, icon, children}) => (
    <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3 text-white">
            {icon} {title}
        </h2>
        {children}
    </div>
)

const CareerOutlookCard: React.FC<{ outcome: CareerOutcome }> = ({ outcome }) => {
    return (
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
            <h4 className="font-bold text-lg text-white">{outcome.occupation_title}</h4>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <p className="text-sm text-gray-400 font-body">Median Salary (MN)</p>
                    <p className="text-xl font-semibold text-primary-400">${outcome.median_salary_mn?.toLocaleString() ?? 'N/A'}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-400 font-body">10-Year Growth (MN)</p>
                    <p className="text-xl font-semibold text-primary-400">{outcome.growth_rate_10yr_mn ?? 'N/A'}</p>
                </div>
            </div>
            <a href={outcome.occupation_data_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-4 text-sm font-semibold text-primary-500 hover:underline font-body">
                View on MN DEED <ExternalLink size={14} />
            </a>
        </div>
    );
};


const JobLinkCard: React.FC<{icon: React.ReactElement<{ size?: number }>, title: string, subtitle: string, href:string}> = ({icon, title, subtitle, href}) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="group p-4 bg-gray-800/50 rounded-xl border border-gray-700 flex items-center gap-4 hover:border-primary-500 hover:bg-gray-800 transition">
        <div className="flex-shrink-0 h-12 w-12 rounded-lg flex items-center justify-center bg-primary-900/50 text-primary-300">
             {React.cloneElement(icon, { size: 24 })}
        </div>
        <div className="flex-grow">
            <h4 className="font-semibold text-white">{title}</h4>
            <p className="text-sm text-gray-400 font-body">{subtitle}</p>
        </div>
        <ExternalLink className="text-gray-400 group-hover:text-primary-600 transition" size={20} />
    </a>
);

const TrendIcon = ({ trend }: { trend: 'Up' | 'Down' | 'Stable' | null | undefined }) => {
    if (trend === 'Up') return <TrendingUp size={16} className="text-green-500" />;
    if (trend === 'Down') return <TrendingDown size={16} className="text-red-500" />;
    return <Minus size={16} className="text-gray-500" />;
};

const SnapshotRow: React.FC<{label: string, value: string | number, trend?: 'Up' | 'Down' | 'Stable' | null}> = ({label, value, trend}) => (
    <div className="flex justify-between items-center">
        <dt className="text-gray-400">{label}</dt>
        <dd className="font-semibold flex items-center gap-1 text-white">
            {value} {trend && <TrendIcon trend={trend} />}
        </dd>
    </div>
);


export default ProgramDetailPage;
