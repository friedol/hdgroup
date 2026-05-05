import { Head, useForm } from '@inertiajs/react';
import { MapPin, Phone, Mail, Send } from 'lucide-react';
import CustomLayout from '@/layouts/app/custom-layout';

interface ContactInfo {
    companyName: string;
    phones: string[];
    email: string;
    address: string;
    mapUrl: string;
}

export default function Contact({ contactInfo }: { contactInfo: ContactInfo }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        contact: '',
        subject: 'Website Inquiry',
        message: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/contact/message', {
            preserveScroll: true,
            onSuccess: () => reset('message'),
        });
    };

    return (
        <CustomLayout>
            <Head title="Contact Us" />

            <div className="min-h-screen bg-gradient-to-b from-amber-50 via-amber-50 to-amber-100/70">
                {/* Hero Section */}
                <section className="bg-amber-400 py-8 text-slate-900 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-300/50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-300/50 rounded-full blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2"></div>
                    
                    <div className="w-[99%] max-w-[1920px] mx-auto px-2 sm:px-4 relative z-10 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-800 mb-2">Connect With Us</p>
                        <h1 className="text-2xl md:text-3xl font-bold mb-2 tracking-tight">Contact HD Group</h1>
                        <p className="text-xs text-slate-800 max-w-2xl mx-auto font-bold">
                            Whether you're looking for wholesale manufacturing, custom supply chain needs, or general inquiries, our team is ready to connect.
                        </p>
                    </div>
                </section>

                {/* Contact / In Touch Section */}
                <section className="py-20 relative">
                    <div className="w-[99%] max-w-[1920px] mx-auto px-2 sm:px-4 relative z-10">
                        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl shadow-amber-100/70 overflow-hidden flex flex-col lg:flex-row border border-amber-100">
                            {/* Left side */}
                            <div className="bg-amber-400 p-10 md:p-14 lg:w-2/5 text-slate-900 flex flex-col justify-between relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-300/50 rounded-full blur-3xl opacity-70 -translate-y-1/2 translate-x-1/2"></div>
                                
                                <div>
                                    <div className="w-8 h-1 bg-amber-500 mb-8 rounded-full"></div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-700 mb-2">SUPPORT NODE</p>
                                    <h2 className="text-3xl md:text-4xl font-bold mb-12 tracking-tight">Get in Touch</h2>
                                    
                                    <div className="space-y-8 relative z-10">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-full bg-amber-300 flex items-center justify-center border border-amber-500/40 flex-shrink-0">
                                                <MapPin className="w-4 h-4 text-slate-800" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-700 mb-1">HQ LOCATION</p>
                                                <p className="text-sm font-bold leading-relaxed">{contactInfo.address}</p>
                                            </div>
                                        </div>
                                        
                                        {contactInfo.phones.map((phone, index) => (
                                            <div key={`${phone}-${index}`} className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-full bg-amber-300 flex items-center justify-center border border-amber-500/40 flex-shrink-0">
                                                    <Phone className="w-4 h-4 text-slate-800" />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-700 mb-1">CONNECT DIRECTLY</p>
                                                    <p className="text-sm font-bold leading-relaxed">{phone}</p>
                                                </div>
                                            </div>
                                        ))}

                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-full bg-amber-300 flex items-center justify-center border border-amber-500/40 flex-shrink-0">
                                                <Mail className="w-4 h-4 text-slate-800" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-700 mb-1">DIGITAL QUERY</p>
                                                <p className="text-sm font-bold leading-relaxed block">{contactInfo.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Right side form */}
                            <div className="p-10 md:p-14 lg:w-3/5 bg-white flex items-center">
                                <form className="w-full space-y-10" onSubmit={submit}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">IDENTITY</label>
                                            <input
                                                type="text"
                                                placeholder="Your Name"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                className="w-full bg-transparent border-0 border-b border-slate-100 hover:border-slate-300 focus:border-slate-900 focus:ring-0 px-0 py-3 text-sm font-bold text-slate-900 outline-none transition-colors"
                                            />
                                            {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">CONTACT</label>
                                            <input
                                                type="text"
                                                placeholder="Phone or Email"
                                                value={data.contact}
                                                onChange={(e) => setData('contact', e.target.value)}
                                                className="w-full bg-transparent border-0 border-b border-slate-100 hover:border-slate-300 focus:border-slate-900 focus:ring-0 px-0 py-3 text-sm font-bold text-slate-900 outline-none transition-colors"
                                            />
                                            {errors.contact && <p className="text-xs text-red-600">{errors.contact}</p>}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">SUBJECT</label>
                                        <input
                                            type="text"
                                            placeholder="Message Subject"
                                            value={data.subject}
                                            onChange={(e) => setData('subject', e.target.value)}
                                            className="w-full bg-transparent border-0 border-b border-slate-100 hover:border-slate-300 focus:border-slate-900 focus:ring-0 px-0 py-3 text-sm font-bold text-slate-900 outline-none transition-colors"
                                        />
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">MESSAGE</label>
                                        <textarea
                                            placeholder="Briefly describe your requirements..."
                                            rows={3}
                                            value={data.message}
                                            onChange={(e) => setData('message', e.target.value)}
                                            className="w-full bg-transparent border-0 border-b border-slate-100 hover:border-slate-300 focus:border-slate-900 focus:ring-0 px-0 py-3 text-sm font-bold text-slate-900 resize-none outline-none transition-colors"
                                        />
                                        {errors.message && <p className="text-xs text-red-600">{errors.message}</p>}
                                    </div>
                                    
                                    <button disabled={processing} className="bg-amber-400 text-slate-900 rounded-lg px-8 py-5 text-[10px] font-bold uppercase tracking-widest flex items-center gap-3 hover:bg-amber-500 transition-colors shadow-lg shadow-amber-200 mt-2 disabled:opacity-60">
                                        DISPATCH INQUIRY <Send className="w-4 h-4 ml-1" />
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Visit Manufacturing Center */}
                <section className="py-16 md:py-24 bg-white/80 border-t border-amber-100 relative overflow-hidden">
                    <div className="absolute left-0 bottom-0 w-full h-1/2 bg-slate-50/50 -z-10"></div>
                    <div className="w-[99%] max-w-[1920px] mx-auto px-2 sm:px-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div className="space-y-6">                            
                                <h2 className="text-3xl lg:text-1xl font-bold text-slate-900 tracking-tight">Visit Us</h2>
                                <p className="text-sm md:text-base text-slate-600 font-bold leading-relaxed max-w-lg">
                                    Experience precision manufacturing firsthand. Our factory integrates advanced supply chain mechanics.
                                </p>
                                
                                {/* <div className="pt-4">
                                    <a href={contactInfo.mapUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 bg-amber-50 border border-amber-200 text-slate-900 hover:bg-amber-100 hover:border-amber-300 font-bold px-6 py-4 rounded-lg text-[10px] uppercase tracking-[0.2em] transition-all shadow-sm active:scale-95">
                                        <MapPin className="w-4 h-4" />
                                        Open in Map
                                    </a>
                                </div> */}
                            </div>
                            
                            <div className="relative">
                                {/* Map View Container */}
                                <div className="w-full aspect-video md:aspect-[16/10] lg:aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-amber-100/70 border border-amber-200 bg-amber-50 p-2">
                                    <div className="w-full h-full rounded-xl overflow-hidden">
                                        <iframe 
                                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15847.6534!2d39.22!3d-6.78!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x185c4cfc686e06b9%3A0x8670c538a7c2e0f!2sSinza%2C%20Dar%20es%20Salaam%2C%20Tanzania!5e0!3m2!1sen!2s!4v1700000000000!5m2!1sen!2s" 
                                            className="w-full h-full border-0" 
                                            allowFullScreen 
                                            loading="lazy"
                                        ></iframe>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </CustomLayout>
    );
}
