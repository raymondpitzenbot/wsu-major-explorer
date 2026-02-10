
import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Search, MessageSquare, Scale, ArrowRight } from 'lucide-react';
import { interestMappings } from '../data/wsuData';
import { useData } from '../contexts/DataContext';
import DynamicBackground from '../components/DynamicBackground';


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

const FeatureStatCard: React.FC<{ value: string, label: string, gradient: string }> = ({ value, label, gradient }) => (
    <div className={`relative rounded-xl p-8 flex-grow flex items-center justify-center ${gradient} shadow-lg shadow-gray-200`}>
        <div className="text-center">
            <p className="text-7xl lg:text-8xl font-bold text-white drop-shadow-md">{value}</p>
            <p className="text-lg text-white/90 mt-2 font-body drop-shadow-sm">{label}</p>
        </div>
    </div>
);

const FeatureBlock: React.FC<{
    title: string;
    description: string;
    linkTo: string;
    linkText: string;
    stat: React.ReactNode;
    orientation: 'left' | 'right';
}> = ({ title, description, linkTo, linkText, stat, orientation }) => {
    const sectionRef = useRef(null);
    useAnimateOnScroll(sectionRef);

    const textOrder = orientation === 'left' ? '' : 'lg:order-last';

    return (
        <div ref={sectionRef} className="scroll-animate grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className={`flex flex-col justify-center ${textOrder} order-2 lg:order-none`}>
                <h3 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">{title}</h3>
                <p className="mt-4 text-lg text-gray-500 font-body">{description}</p>
                <div className="mt-8">
                    <Link to={linkTo} className="font-body inline-flex items-center gap-2 text-lg font-semibold text-primary-600 hover:text-primary-500 transition-colors">
                        {linkText} <ArrowRight size={20} />
                    </Link>
                </div>
            </div>
            <div className="flex min-h-[300px] order-1 lg:order-none">
                {stat}
            </div>
        </div>
    );
};


const LandingPage: React.FC = () => {
    const { programs } = useData();
    const [currentPrompt, setCurrentPrompt] = useState(0);

    const promptBubbles = React.useMemo(() => {
        const bubbles = Object.keys(interestMappings);
        return [...bubbles].sort(() => Math.random() - 0.5);
    }, []);

    useEffect(() => {
        if (promptBubbles.length === 0) return;
        const interval = setInterval(() => {
            setCurrentPrompt((prev) => (prev + 1) % promptBubbles.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [promptBubbles]);



    const textShadowStyle = {};
    const totalPrograms = programs.length || '200+';


    return (
        <>
            <Helmet>
                <title>Winona State Explorer | Winona State Degrees & Programs</title>
                <meta name="description" content="Explore details on 200+ Winona State University majors, minors, and degrees. Compare programs, view requirements, and find your perfect fit." />
                <link rel="canonical" href="https://explorewinona.vercel.app/" />
            </Helmet>
            <DynamicBackground className="relative isolate">
                <div className="min-h-[calc(65vh)] flex items-center justify-center spotlight relative z-10 px-6 py-20">
                    <div className="text-center w-full max-w-6xl">
                        <div className="mx-auto">
                            <h1 className="text-6xl font-bold tracking-tight text-gray-950 sm:text-7xl lg:text-8xl animate-fade-in-up leading-[1.1]">
                                Major Decisions,<br />
                                Made Simpler.
                            </h1>

                            <p className="mt-12 text-xl sm:text-2xl leading-relaxed text-gray-800 font-medium max-w-4xl mx-auto animate-fade-in" style={{ animationDelay: '200ms' }}>
                                We did the research so you don't have to. Discover programs, compare side-by-side, and get AI powered insights to help you navigate your options with ease.
                            </p>

                            <div className="mt-12 flex items-center justify-center animate-fade-in" style={{ animationDelay: '400ms' }}>
                                <Link
                                    to="/explore"
                                    className="font-body w-full sm:w-auto flex items-center justify-center gap-3 rounded-2xl bg-gray-900 px-12 py-5 text-xl font-bold text-white shadow-2xl hover:bg-gray-800 transition-all hover:scale-[1.05] active:scale-[0.98] ring-4 ring-gray-900/10"
                                >
                                    <Search size={24} strokeWidth={2.5} />
                                    Start Exploring
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </DynamicBackground>

            <div className="bg-white py-24 sm:py-32">
                <div className="container mx-auto px-4 space-y-24 lg:space-y-32">
                    <div className="text-center">
                        <h2 className="text-4xl font-bold tracking-tight sm:text-5xl text-gray-900">Different tools for different questions.</h2>
                    </div>

                    <FeatureBlock
                        orientation="left"
                        title="Explore your options"
                        description="See what’s available, how programs are structured, and where they lead. No more jumping between departments and pages."
                        linkTo="/explore"
                        linkText="Start Exploring"
                        stat={<FeatureStatCard value={String(totalPrograms)} label="Programs & Pathways" gradient="bg-gradient-to-br from-cyan-600 to-blue-800" />}
                    />

                    <FeatureBlock
                        orientation="right"
                        title="Compare what actually matters"
                        description="Put options side by side to see differences in coursework, commitment, outcomes, and direction — all in one view."
                        linkTo="/compare"
                        linkText="Compare Programs"
                        stat={<FeatureStatCard value="4" label="Programs at once" gradient="bg-gradient-to-br from-purple-500 to-indigo-600" />}
                    />

                    <FeatureBlock
                        orientation="left"
                        title="Get clarity when you’re stuck"
                        description="Ask questions, sanity-check options, and get explanations when things feel unclear."
                        linkTo="/advisor"
                        linkText="Ask the Advisor"
                        stat={<FeatureStatCard value="24/7" label="AI Support" gradient="bg-gradient-to-br from-rose-500 to-red-600" />}
                    />
                </div>
            </div>
        </>
    );
};

export default LandingPage;