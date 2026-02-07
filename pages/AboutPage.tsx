
import React, { useRef, useEffect } from 'react';
import { Database, ListChecks, ExternalLink, Target, Info, Mail, AlertTriangle, ArrowRight, User } from 'lucide-react';
import DynamicBackground from '../components/DynamicBackground';
import { dataSources } from '../data/wsuData';

const useAnimateOnScroll = (ref: React.RefObject<HTMLElement>) => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [ref]);
};

const AboutPage: React.FC = () => {
  const dataSourceRef = useRef(null);
  useAnimateOnScroll(dataSourceRef);

  return (
    <div className="bg-gray-950 min-h-screen">
      <DynamicBackground className="relative isolate py-24 sm:py-32">
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-8 animate-fade-in-up" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
              Transparency in <br className="hidden md:block" /> Academic Exploration.
            </h1>
            <p className="mt-6 text-xl text-gray-200 font-body max-w-2xl mx-auto leading-relaxed" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
              An interactive tool designed to help Winona State University students make informed decisions with trusted, consolidated data.
            </p>
          </div>
        </div>
      </DynamicBackground>

      <div className="container mx-auto px-4 py-16 relative z-20"> {/* Removed negative margin */}

        {/* Data Sources Section */}
        <div ref={dataSourceRef} className="mb-24 scroll-animate">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Trusted Data Sources</h2>
            <p className="text-gray-400 max-w-2xl mx-auto font-body">
              This platform is built with official, verifiable data. Complete transparency about where information comes from is essential.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {dataSources.map((source) => (
              <div key={source.source_id} className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-primary-500/50 transition-all group flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-gray-800 rounded-lg text-primary-400 group-hover:text-primary-300 transition-colors">
                    <Database size={20} />
                  </div>
                  <span className="text-xs font-bold font-mono bg-gray-800 text-gray-400 px-2 py-1 rounded border border-gray-700">
                    {source.source_year}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary-400 transition-colors">
                  {source.source_name}
                </h3>
                <p className="text-sm text-gray-400 font-body leading-relaxed mb-6">
                  {source.source_notes}
                </p>
                <div className="mt-auto">
                  <a
                    href={source.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary-500 hover:text-primary-300 uppercase tracking-widest transition-colors"
                  >
                    Verify Source <ArrowRight size={12} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-24">
          {/* Methodology Section */}

          {/* Changed items-center to items-start for top alignment */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">Our Methodology</h2>
              <p className="text-gray-400 text-lg mb-8 font-body leading-relaxed">
                You deserve to see exactly what goes into the data so you can trust what you see. This site prioritizes clarity and honesty over comprehensiveness.
              </p>

              <div className="space-y-6">
                <DetailBlock
                  title="Approach"
                  items={[
                    "Unifies data from multiple isolated sources (Catalog, IPAR, State Data)",
                    "Reformats complex degree requirements for readability",
                    "Provides 'fit' traits to help students discover programs",
                    "Links directly to official sources for verification"
                  ]}
                  colorClass="text-emerald-400"
                />
                <DetailBlock
                  title="Limitations"
                  items={[
                    "Does not replace official academic advising or degree audits",
                    "Does not reflect real-time catalog changes (data is a snapshot)",
                    "Does not rank or score programs subjectively",
                    "Does not track individual student progress or credits"
                  ]}
                  colorClass="text-rose-400"
                />
              </div>
            </div>

            <div className="flex flex-col gap-6"> {/* Added flex col for stacked widgets */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-purple-600 rounded-2xl blur-2xl opacity-20"></div>
                <div className="relative bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
                  <div className="flex items-start gap-4 mb-6">
                    <AlertTriangle className="text-amber-500 flex-shrink-0" size={24} />
                    <div>
                      <h3 className="text-xl font-bold text-white">Disclaimer</h3>
                      <p className="text-gray-400 mt-2 font-body text-sm leading-relaxed">
                        This tool is for informational purposes only. It is not an official WSU resource and should not be used as the sole basis for academic decisions.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4 font-body text-sm text-gray-300 border-t border-gray-800 pt-6">
                    <p>• Automated methods including web scraping and public APIs are used to aggregate data. While AI is used for processing, no academic data is AI-generated.</p>
                    <p>• Unavailable or incomplete data is intentionally omitted or flagged, rather than estimated.</p>
                    <p>• Always verify information with official WSU sources.</p>
                    <p className="text-white font-semibold pt-2">Before making any decisions, please consult with an official WSU academic advisor.</p>
                  </div>
                </div>
              </div>

              {/* New Independent Project Widget */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-gray-800 rounded-lg text-gray-400">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">Independent Student Project</h3>
                    <p className="text-gray-400 font-body text-sm leading-relaxed">
                      This platform was built as an independent project to explore data visualization in higher education. I earn no money from this project, and it is not officially affiliated with Winona State University administration.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="relative rounded-3xl overflow-hidden bg-gray-900 border border-gray-800">
            <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>

            <div className="relative z-10 p-12 lg:p-16 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Have Feedback?</h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 font-body">
                I'm actively improving this tool. If you spot an error or have a suggestion, I'd love to hear from you.
              </p>
              <a
                href="https://forms.gle/pVYDG87KTHPRW3u87"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-full font-bold hover:bg-gray-100 transition-transform transform hover:scale-105 shadow-lg shadow-white/10 font-body"
              >
                <ExternalLink size={18} /> Open Feedback Form
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="h-24"></div>
    </div>
  );
};

const DetailBlock: React.FC<{ title: string, items: string[], colorClass: string }> = ({ title, items, colorClass }) => (
  <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-colors">
    <h4 className={`text-lg font-bold mb-4 ${colorClass} uppercase tracking-wider text-xs`}>{title}</h4>
    <ul className="space-y-3 font-body">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-3 text-gray-300 text-sm">
          <div className={`mt-1.5 w-1.5 h-1.5 rounded-full ${colorClass.replace('text-', 'bg-')} flex-shrink-0`}></div>
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  </div>
);

export default AboutPage;
