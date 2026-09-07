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

            <div className="min-h-screen bg-slate-50">
                {/* Hero Section */}
                <section className="bg-blue-600 py-12 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                    <div className="w-[98%] md:w-[88%] max-w-[1600px] mx-auto px-2 sm:px-4 md:px-8 relative z-10 text-center">
                        <span className="inline-block bg-white/20 text-white text-xl font-dancing font-bold px-5 py-1.5 rounded-full mb-4 backdrop-blur-sm border border-white/30">Connect With Us</span>
                        <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">Contact Jopo Juniours Co. Ltd</h1>
                        <p className="text-sm text-white/85 max-w-2xl mx-auto leading-relaxed">
                            Whether you're looking for wholesale manufacturing, custom supply chain needs, or general inquiries, our team is ready to connect.
                        </p>
                    </div>
                </section>

                {/* Contact / In Touch Section */}
                <section className="py-20 relative">
                    <div className="w-[98%] md:w-[88%] max-w-[1600px] mx-auto px-2 sm:px-4 md:px-8 relative z-10">
                        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl shadow-blue-100/50 overflow-hidden flex flex-col lg:flex-row border border-blue-100">
                            {/* Left side */}
                            <div className="bg-blue-600 p-10 md:p-14 lg:w-2/5 text-white flex flex-col justify-between relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                                <div>
                                    <div className="w-8 h-1 bg-white/60 mb-8 rounded-full"></div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 mb-2">SUPPORT NODE</p>
                                    <h2 className="text-3xl md:text-4xl font-bold mb-12 tracking-tight">Get in Touch</h2>

                                    <div className="space-y-8 relative z-10">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30 flex-shrink-0">
                                                <MapPin className="w-4 h-4 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-bold uppercase tracking-widest text-white/60 mb-1">HQ LOCATION</p>
                                                <p className="text-sm font-bold leading-relaxed text-white">{contactInfo.address}</p>
                                            </div>
                                        </div>

                                        {contactInfo.phones.map((phone, index) => (
                                            <div key={`${phone}-${index}`} className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30 flex-shrink-0">
                                                    <Phone className="w-4 h-4 text-white" />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/60 mb-1">CONNECT DIRECTLY</p>
                                                    <p className="text-sm font-bold leading-relaxed text-white">{phone}</p>
                                                </div>
                                            </div>
                                        ))}

                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30 flex-shrink-0">
                                                <Mail className="w-4 h-4 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-bold uppercase tracking-widest text-white/60 mb-1">DIGITAL QUERY</p>
                                                <p className="text-sm font-bold leading-relaxed text-white block">{contactInfo.email}</p>
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
                                                className="w-full bg-transparent border-0 border-b border-slate-100 hover:border-slate-300 focus:border-blue-600 focus:ring-0 px-0 py-3 text-sm font-bold text-slate-900 outline-none transition-colors"
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
                                                className="w-full bg-transparent border-0 border-b border-slate-100 hover:border-slate-300 focus:border-blue-600 focus:ring-0 px-0 py-3 text-sm font-bold text-slate-900 outline-none transition-colors"
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
                                            className="w-full bg-transparent border-0 border-b border-slate-100 hover:border-slate-300 focus:border-blue-600 focus:ring-0 px-0 py-3 text-sm font-bold text-slate-900 outline-none transition-colors"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">MESSAGE</label>
                                        <textarea
                                            placeholder="Briefly describe your requirements..."
                                            rows={3}
                                            value={data.message}
                                            onChange={(e) => setData('message', e.target.value)}
                                            className="w-full bg-transparent border-0 border-b border-slate-100 hover:border-slate-300 focus:border-blue-600 focus:ring-0 px-0 py-3 text-sm font-bold text-slate-900 resize-none outline-none transition-colors"
                                        />
                                        {errors.message && <p className="text-xs text-red-600">{errors.message}</p>}
                                    </div>

                                    <button disabled={processing} className="bg-red-600 text-white rounded-xl px-8 py-4 text-[10px] font-bold uppercase tracking-widest flex items-center gap-3 hover:bg-red-700 transition-all shadow-lg shadow-red-200 mt-2 disabled:opacity-60 active:scale-95">
                                        DISPATCH INQUIRY <Send className="w-4 h-4 ml-1" />
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Visit Us */}
                <section className="py-16 md:py-24 bg-white/80 border-t border-blue-100 relative overflow-hidden">
                    <div className="w-[99%] max-w-[1920px] mx-auto px-2 sm:px-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div className="space-y-6">
                                <p className="text-sm font-bold text-red-600 uppercase tracking-widest">Find Us</p>
                                <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">Visit Us</h2>
                                <p className="text-sm md:text-base text-slate-600 leading-relaxed max-w-lg">
                                    Experience precision manufacturing firsthand. Our factory integrates advanced supply chain mechanics.
                                </p>
                            </div>

                            <div className="relative">
                                <div className="w-full aspect-video md:aspect-[16/10] lg:aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-blue-100/70 border border-blue-200 bg-blue-50 p-2">
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
