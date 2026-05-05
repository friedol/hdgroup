import { Head } from '@inertiajs/react';
import { Award, Users, Target, TrendingUp, CheckCircle, Shield } from 'lucide-react';
import CustomLayout from '@/layouts/app/custom-layout';

export default function About() {
    return (
        <CustomLayout>
            <Head title="About Us" />

            <div className="min-h-screen bg-white">
                {/* Hero Section */}
                <section className="relative bg-amber-400 text-slate-900 overflow-hidden py-8">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-300/50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-300/50 rounded-full blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2"></div>

                    <div className="mx-auto w-[96%] max-w-[1920px] px-4 relative z-10 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-800 mb-2">Our Story</p>
                        <h1 className="text-2xl md:text-3xl font-extrabold mb-2 tracking-tight">About HD Group</h1>
                        <p className="text-xs text-slate-800 max-w-2xl mx-auto font-normal">
                            Delivering excellence in products and services since our establishment. Your trusted partner for quality goods and exceptional customer service.
                        </p>
                    </div>
                </section>

                <div className="w-[96%] max-w-[1920px] mx-auto px-4 py-16">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mb-20">
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6">Technology and Packaging, Delivered Right.</h2>
                                <p className="text-base text-slate-700 leading-relaxed mb-4">
                                    HD Group is a solutions-driven company operating at the intersection of technology and packaging. The company focuses on delivering practical, high-quality products and services that improve how businesses present, promote, and manage their products in modern markets.
                                </p>
                                <p className="text-base text-slate-700 leading-relaxed mb-8">
                                    With a strong emphasis on functionality, reliability, and innovation, HD Group supports clients across retail, commercial, and industrial sectors by combining design, production, and emerging technologies into scalable solutions.
                                </p>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">Vision</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        To build a reputable African company delivering reliable technology and packaging solutions that meet international standards.
                                    </p>
                                </div>
                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">Mission</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        To provide well-designed, practical, and technology-driven solutions that help businesses strengthen their brands, improve product presentation, and operate more effectively.
                                    </p>
                                </div>
                            </div>
                            <p className="text-base text-slate-700 font-medium leading-relaxed mt-4">
                                We work with businesses to develop solutions that are not only visually effective, but also operationally efficient and aligned with market needs.
                            </p>
                        </div>
                        
                        <div className="space-y-8">
                            <div className="relative">
                                <img src="/img/medani_auth_bg.png" alt="HD Group Operations" className="rounded-3xl border border-slate-200 shadow-xl w-full object-cover h-[300px]" />
                                <div className="absolute top-4 left-4 inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-lg backdrop-blur-md bg-opacity-90">
                                    <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                                    Reliable Solutions for Modern Brands
                                </div>
                            </div>

                            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 md:p-8">
                                <h3 className="text-xl font-bold text-slate-900 mb-6">Core Areas of Operation</h3>
                                <ul className="space-y-4">
                                    {[
                                        "Advanced promotional and display technologies",
                                        "Smart packaging and product presentation solutions",
                                        "Commercial printing and production services",
                                        "Digital integration (QR, NFC, and interactive systems)"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-4">
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center mt-0.5">
                                                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                                            </div>
                                            <span className="text-slate-700 font-medium pt-1 leading-snug">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Key Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
                        {[
                            { number: '15+', label: 'Years in Business', icon: Award },
                            { number: '50K+', label: 'Satisfied Customers', icon: Users },
                            { number: '12', label: 'Branch Locations', icon: Target },
                            { number: '1000+', label: 'Product Categories', icon: TrendingUp },
                        ].map((stat, idx) => {
                            const Icon = stat.icon;

                            return (
                                <div key={idx} className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-8 text-center border border-slate-200">
                                    <Icon className="w-8 h-8 text-amber-500 mx-auto mb-4" />
                                    <div className="text-3xl font-black text-slate-900 mb-2">{stat.number}</div>
                                    <div className="text-sm font-semibold text-slate-600">{stat.label}</div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Core Values */}
                    <div className="mb-20">
                        <h2 className="text-3xl font-bold text-slate-900 mb-10 text-center">Our Core Values</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {[
                                {
                                    title: 'Quality First',
                                    description: 'Every product is carefully selected and tested to meet our high standards.',
                                    icon: CheckCircle
                                },
                                {
                                    title: 'Customer Focus',
                                    description: 'Your satisfaction is our priority. We listen and constantly improve.',
                                    icon: Users
                                },
                                {
                                    title: 'Integrity & Trust',
                                    description: 'Honest dealings, transparent pricing, and long-term relationships.',
                                    icon: Shield
                                },
                                {
                                    title: 'Innovation',
                                    description: 'Modern solutions to enhance efficiency and deliver better value.',
                                    icon: TrendingUp
                                },
                                {
                                    title: 'Sustainability',
                                    description: 'Committed to responsible practices and positive community impact.',
                                    icon: Award
                                },
                                {
                                    title: 'Excellence',
                                    description: 'Striving for excellence in product quality and customer service.',
                                    icon: Target
                                },
                            ].map((value, idx) => {
                                const Icon = value.icon;

                                return (
                                    <div key={idx} className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5 border border-slate-200 hover:shadow-lg hover:border-amber-200 transition-all flex flex-col">
                                        <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center mb-3 shrink-0">
                                            <Icon className="w-5 h-5 text-white" />
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-900 mb-2">{value.title}</h3>
                                        <p className="text-slate-500 leading-relaxed text-xs">{value.description}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>


                    {/* Call to Action */}
                    <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-12 text-center">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to Experience the Difference?</h2>
                        <p className="text-slate-600 mb-8 text-lg max-w-2xl mx-auto">
                            Join thousands of satisfied customers who trust HD Group for quality products and exceptional service.
                        </p>
                        <a
                            href="/shop"
                            className="inline-block bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold py-4 px-8 rounded-lg transition-all duration-300 shadow-sm"
                        >
                            Start Shopping Today
                        </a>
                    </div>
                </div>
            </div>
        </CustomLayout>
    );
}
