import { Head } from '@inertiajs/react';
import { Award, Users, Target, TrendingUp, CheckCircle, Shield } from 'lucide-react';
import CustomLayout from '@/layouts/app/custom-layout';

export default function About() {
    return (
        <CustomLayout>
            <Head title="About Us" />

            <div className="min-h-screen bg-white">
                {/* Hero Section */}
                <section className="relative bg-blue-600 text-white overflow-hidden py-12">
                    <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                    <div className="absolute inset-0 bg-[url('/img/hero1.png')] opacity-5 bg-cover bg-center mix-blend-overlay"></div>

                    <div className="mx-auto w-[98%] md:w-[88%] max-w-[1600px] px-2 sm:px-4 md:px-8 relative z-10 text-center">
                        <span className="inline-block bg-white/20 text-white text-xl font-dancing font-bold px-5 py-1.5 rounded-full mb-4 backdrop-blur-sm border border-white/30">Our Story</span>
                        <h1 className="text-3xl md:text-4xl font-extrabold mb-3 tracking-tight">About Jopo Juniours Co. Ltd</h1>
                        <p className="text-sm text-white/85 max-w-2xl mx-auto font-normal leading-relaxed">
                            Delivering excellence in products and services since our establishment. Your trusted partner for quality goods and exceptional customer service.
                        </p>
                    </div>
                </section>

                <div className="w-[98%] md:w-[88%] max-w-[1600px] mx-auto px-2 sm:px-4 md:px-8 py-16">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mb-20">
                        <div className="space-y-6">
                            <div>
                                <p className="text-sm font-bold text-red-600 uppercase tracking-widest mb-2">Who We Are</p>
                                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6 leading-tight">Technology and Packaging, Delivered Right.</h2>
                                <p className="text-base text-slate-700 leading-relaxed mb-4">
                                    Jopo Juniours Co. Ltd is a solutions-driven company operating at the intersection of technology and packaging. The company focuses on delivering practical, high-quality products and services that improve how businesses present, promote, and manage their products in modern markets.
                                </p>
                                <p className="text-base text-slate-700 leading-relaxed mb-8">
                                    With a strong emphasis on functionality, reliability, and innovation, Jopo Juniours Co. Ltd supports clients across retail, commercial, and industrial sectors by combining design, production, and emerging technologies into scalable solutions.
                                </p>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 hover:shadow-md transition-all">
                                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center mb-3">
                                        <TrendingUp className="w-4 h-4 text-white" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">Vision</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        To build a reputable African company delivering reliable technology and packaging solutions that meet international standards.
                                    </p>
                                </div>
                                <div className="bg-red-50 p-6 rounded-2xl border border-red-100 hover:shadow-md transition-all">
                                    <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center mb-3">
                                        <Target className="w-4 h-4 text-white" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">Mission</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        To provide well-designed, practical, and technology-driven solutions that help businesses strengthen their brands and operate more effectively.
                                    </p>
                                </div>
                            </div>
                            <p className="text-base text-slate-700 font-medium leading-relaxed mt-4">
                                We work with businesses to develop solutions that are not only visually effective, but also operationally efficient and aligned with market needs.
                            </p>
                        </div>

                        <div className="space-y-8">
                            <div className="relative">
                                <img src="/img/medani_auth_bg.png" alt="Jopo Juniours Co. Ltd Operations" className="rounded-3xl border border-slate-200 shadow-xl w-full object-cover h-[300px]" />
                                <div className="absolute top-4 left-4 inline-flex items-center gap-2 bg-slate-900/90 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-lg backdrop-blur-md">
                                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
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
                                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 ${i % 2 === 0 ? 'bg-blue-50 border border-blue-100' : 'bg-red-50 border border-red-100'}`}>
                                                <div className={`w-2.5 h-2.5 rounded-full ${i % 2 === 0 ? 'bg-blue-600' : 'bg-red-600'}`}></div>
                                            </div>
                                            <span className="text-slate-700 font-medium pt-1 leading-snug">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Key Statistics */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
                        {[
                            { number: '15+', label: 'Years in Business', icon: Award, color: 'blue' },
                            { number: '50K+', label: 'Satisfied Customers', icon: Users, color: 'red' },
                            { number: '12', label: 'Branch Locations', icon: Target, color: 'blue' },
                            { number: '1000+', label: 'Product Categories', icon: TrendingUp, color: 'red' },
                        ].map((stat, idx) => {
                            const Icon = stat.icon;
                            const isBlue = stat.color === 'blue';
                            return (
                                <div key={idx} className={`rounded-2xl p-8 text-center border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all ${isBlue ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200' : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'}`}>
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 ${isBlue ? 'bg-blue-600' : 'bg-red-600'}`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="text-3xl font-black text-slate-900 mb-2">{stat.number}</div>
                                    <div className="text-sm font-semibold text-slate-600">{stat.label}</div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Core Values */}
                    <div className="mb-20">
                        <p className="text-sm font-bold text-red-600 uppercase tracking-widest text-center mb-2">What Drives Us</p>
                        <h2 className="text-3xl font-bold text-slate-900 mb-10 text-center">Our Core Values</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {[
                                { title: 'Quality First', description: 'Every product is carefully selected and tested to meet our high standards.', icon: CheckCircle, color: 'blue' },
                                { title: 'Customer Focus', description: 'Your satisfaction is our priority. We listen and constantly improve.', icon: Users, color: 'red' },
                                { title: 'Integrity & Trust', description: 'Honest dealings, transparent pricing, and long-term relationships.', icon: Shield, color: 'blue' },
                                { title: 'Innovation', description: 'Modern solutions to enhance efficiency and deliver better value.', icon: TrendingUp, color: 'red' },
                                { title: 'Sustainability', description: 'Committed to responsible practices and positive community impact.', icon: Award, color: 'blue' },
                                { title: 'Excellence', description: 'Striving for excellence in product quality and customer service.', icon: Target, color: 'red' },
                            ].map((value, idx) => {
                                const Icon = value.icon;
                                const isBlue = value.color === 'blue';
                                return (
                                    <div key={idx} className={`bg-white rounded-xl p-5 border shadow-sm hover:shadow-lg transition-all flex flex-col hover:-translate-y-1 ${isBlue ? 'hover:border-blue-200' : 'hover:border-red-200'}`}>
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 shrink-0 ${isBlue ? 'bg-blue-600' : 'bg-red-600'}`}>
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
                    <div className="w-full bg-red-600 rounded-2xl p-12 text-center text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                        <div className="relative z-10">
                            <h2 className="text-3xl font-bold mb-4">Ready to Experience the Difference?</h2>
                            <p className="text-white/80 mb-8 text-lg max-w-2xl mx-auto">
                                Join thousands of satisfied customers who trust Jopo Juniours Co. Ltd for quality products and exceptional service.
                            </p>
                            <a
                                href="/shop"
                                className="inline-block bg-white text-blue-700 font-bold py-4 px-10 rounded-xl hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95"
                            >
                                Start Shopping Today
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </CustomLayout>
    );
}
