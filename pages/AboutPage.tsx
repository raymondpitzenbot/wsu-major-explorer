
import React from 'react';
import { Database, ListChecks, AlertTriangle, ExternalLink, Target, Info } from 'lucide-react';

const AboutPage: React.FC = () => {
  return (
    <div className="bg-gray-950 py-12 px-4 sm:px-6 lg:px-8 aurora-background">
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center">
            <Info className="mx-auto h-12 w-12 text-primary-500"/>
            <h1 className="mt-2 text-4xl md:text-5xl font-semibold tracking-tight text-white">
                About WSU Major Explorer
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-400 font-body">
                An interactive tool to help students explore academic programs at Winona State University with trusted, transparent data.
            </p>
        </div>

        <div className="mt-16 space-y-10">
          <Section title="Purpose" icon={<Target />}>
            <p>WSU Major Explorer helps prospective and current students explore academic programs at Winona State University, compare program options side-by-side, and chat with an AI advisor to make informed decisions about your academic path.</p>
            <p>This tool is designed to complement—not replace—official academic advising. Always confirm details with WSU advisors before making final decisions.</p>
          </Section>

          <Section title="Data Sources" icon={<Database />}>
            <div className="space-y-4">
              <SourceItem title="WSU IPAR Enrollment Data" timeframe="Fall 2020-2021" details="Official enrollment counts from Winona State University’s Institutional Planning, Assessment, and Research office." />
              <SourceItem title="WSU IPAR Degrees Awarded" timeframe="FY 2021" details="Official degree completion data from WSU IPAR." />
              <SourceItem title="Minnesota DEED Labor Market Data" timeframe="2023" details="Career and wage data from the Minnesota Department of Employment and Economic Development Occupational Employment & Statistics program. Career outcomes are mapped to related occupations only where explicit mappings exist in the source data." />
            </div>
          </Section>

          <Section title="Data Methodology" icon={<ListChecks />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h4 className="font-semibold text-green-400">What We Do</h4>
                    <ul className="mt-2 list-disc list-inside space-y-1 text-gray-300">
                        <li>Exclude discontinued programs and those not accepting new students</li>
                        <li>Clearly label aggregate values (combined totals)</li>
                        <li>Show enrollment trends (Up/Stable/Down) only</li>
                        <li>Use conservative career mappings only where explicit</li>
                        <li>Distinguish pre-professional tracks from degree programs</li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold text-red-400">What We Don't Do</h4>
                    <ul className="mt-2 list-disc list-inside space-y-1 text-gray-300">
                        <li>Infer, estimate, or backfill missing data</li>
                        <li>Create derived rankings or scores</li>
                        <li>Assign graduation data to minors or pre-professional tracks</li>
                        <li>Merge or redistribute data across programs</li>
                        <li>Web scrape or use unverified external data</li>
                    </ul>
                </div>
            </div>
          </Section>

          <div className="bg-yellow-900/20 border-l-4 border-yellow-400 p-6 rounded-r-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-yellow-500" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-bold text-yellow-200">Important Disclaimer</h3>
                <div className="mt-2 text-sm text-yellow-300 space-y-2">
                  <p>This tool is for informational purposes only, it is not an official WSU resource and should not be used as the sole basis for academic decisions.</p>
                  <ul className="list-disc list-inside">
                    <li>Data may be outdated or incomplete.</li>
                    <li>Always verify information with official WSU sources.</li>
                  </ul>
                  <p className="font-semibold">Before making any decisions, please consult with an official WSU academic advisor or visit the official program pages.</p>
                </div>
              </div>
            </div>
          </div>
          
           <Section title="Official Resources" icon={<ExternalLink />}>
             <div className="flex flex-wrap gap-4">
                <a href="https://www.winona.edu/academics/" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline font-medium">WSU Academics</a>
                <a href="https://www.winona.edu/advising/" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline font-medium">Advising Services</a>
                <a href="https://www.winona.edu/admissions/" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline font-medium">Admissions</a>
             </div>
           </Section>

        </div>
      </div>
    </div>
  );
};

const Section: React.FC<{title: string, icon: React.ReactNode, children: React.ReactNode}> = ({title, icon, children}) => (
    <div className="bg-gray-900 p-8 rounded-xl border border-gray-800">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-primary-400">{icon}</span>
            {title}
        </h2>
        <div className="mt-4 text-gray-300 space-y-4 font-body">
            {children}
        </div>
    </div>
);

const SourceItem: React.FC<{title: string, timeframe: string, details: string}> = ({title, timeframe, details}) => (
    <div>
        <h4 className="font-semibold text-gray-100">{title}</h4>
        <p className="font-body text-sm font-mono bg-gray-800 inline-block px-2 py-0.5 rounded my-1 text-gray-200">Timeframe: {timeframe}</p>
        <p className="text-sm font-body">{details}</p>
    </div>
);

export default AboutPage;
