import { Head, router } from '@inertiajs/react';
import { Mail, Phone, MessageSquare, Clock, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CustomLayout from '@/layouts/app/custom-layout';

export default function HelpDesk() {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        subject: '',
        message: '',
    });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        router.post('/help/desk/save', formData, {
            onSuccess: () => {
                setSubmitted(true);
                setFormData({
                    name: '',
                    phone: '',
                    subject: '',
                    message: '',
                });
                setTimeout(() => setSubmitted(false), 5000);
            },
            onFinish: () => setLoading(false),
        });
    };

    return (
        <CustomLayout>
            <Head title="Help Desk & Support" />

            <div className="min-h-screen bg-white">
                {/* Hero Section */}
                <section className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden py-8">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-slate-700/20 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-700/20 rounded-full blur-3xl"></div>

                    <div className="container mx-auto px-4 relative z-10 text-center">
                        <div className="max-w-3xl mx-auto">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300 mb-2">
                                We're Here to Help
                            </p>
                            <h1 className="text-2xl md:text-3xl font-extrabold mb-2 tracking-tight">
                                Help Desk & Support
                            </h1>
                            <p className="text-xs text-slate-200 max-w-2xl mx-auto font-normal">
                                Have questions or need assistance? Our support team is ready to help you. Connect with us anytime.
                            </p>
                        </div>
                    </div>
                </section>

                <div className="container mx-auto px-4 md:px-6 py-16">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
                        {/* Contact Info Cards */}
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 border border-slate-200">
                            <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center mb-4">
                                <Phone className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Phone Support</h3>
                            <p className="text-slate-600 mb-4">Call us during business hours</p>
                            <p className="text-sm font-semibold text-slate-900">+255 XXX XXX XXX</p>
                            <p className="text-xs text-slate-500 mt-2">Monday - Friday, 9:00 AM - 6:00 PM</p>
                        </div>

                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 border border-slate-200">
                            <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center mb-4">
                                <Mail className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Email Support</h3>
                            <p className="text-slate-600 mb-4">Send us an email anytime</p>
                            <p className="text-sm font-semibold text-slate-900">support@hdgroup.co.tz</p>
                            <p className="text-xs text-slate-500 mt-2">We'll respond within 24 hours</p>
                        </div>

                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 border border-slate-200">
                            <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center mb-4">
                                <Clock className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Response Time</h3>
                            <p className="text-slate-600 mb-4">Quick and reliable support</p>
                            <p className="text-sm font-semibold text-slate-900">Average 2-4 hours</p>
                            <p className="text-xs text-slate-500 mt-2">Fast resolution for all inquiries</p>
                        </div>
                    </div>

                    {/* Support Form */}
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 md:p-12 border border-slate-200">
                            <div className="flex items-center gap-3 mb-8">
                                <MessageSquare className="w-8 h-8 text-amber-500" />
                                <h2 className="text-3xl font-bold text-slate-900">Get in Touch</h2>
                            </div>

                            {submitted && (
                                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-emerald-900">Message Sent Successfully!</p>
                                        <p className="text-sm text-emerald-700">Thank you for contacting us. We'll get back to you soon.</p>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-900 mb-2">
                                            Your Name
                                        </label>
                                        <Input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="John Doe"
                                            className="w-full bg-white border-slate-300 rounded-lg"
                                            required
                                        />
                                    </div>

                                    {/* Phone */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-900 mb-2">
                                            Phone Number
                                        </label>
                                        <Input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="+255 XXX XXX XXX"
                                            className="w-full bg-white border-slate-300 rounded-lg"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Subject */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                                        Subject
                                    </label>
                                    <Input
                                        type="text"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        placeholder="What is this about?"
                                        className="w-full bg-white border-slate-300 rounded-lg"
                                        required
                                    />
                                </div>

                                {/* Message */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                                        Message
                                    </label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        placeholder="Tell us how we can help..."
                                        rows={6}
                                        className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                                        required
                                    ></textarea>
                                </div>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-lg transition-all duration-300"
                                >
                                    {loading ? 'Sending...' : 'Send Message'}
                                </Button>
                            </form>

                            <p className="text-xs text-slate-500 text-center mt-6">
                                We typically respond within 24 hours. Your message is important to us.
                            </p>
                        </div>
                    </div>

                    {/* FAQ Section */}
                    <div className="max-w-3xl mx-auto mt-20">
                        <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Frequently Asked Questions</h2>

                        <div className="space-y-4">
                            {[
                                {
                                    q: 'What payment methods do you accept?',
                                    a: 'We accept bank transfers, mobile money (M-Pesa, Airtel Money), credit cards, and cash on delivery.'
                                },
                                {
                                    q: 'How long does shipping take?',
                                    a: 'Standard delivery takes 2-5 business days within the Dar es Salaam area. Express delivery is available for an additional fee.'
                                },
                                {
                                    q: 'What is your return policy?',
                                    a: 'We offer 30-day returns for products in original condition. Contact our support team to initiate a return.'
                                },
                                {
                                    q: 'Do you offer bulk discounts?',
                                    a: 'Yes! For orders over 1,000 units, we provide special wholesale pricing. Contact us for a custom quote.'
                                },
                                {
                                    q: 'How can I track my order?',
                                    a: 'After placing an order, you\'ll receive tracking information via SMS and email. You can also check your order status in your account dashboard.'
                                },
                                {
                                    q: 'Is my payment information secure?',
                                    a: 'Yes, we use industry-standard SSL encryption and PCI-DSS compliance to protect all payment information.'
                                },
                            ].map((faq, idx) => (
                                <details
                                    key={idx}
                                    className="group bg-slate-50 border border-slate-200 rounded-lg p-6 cursor-pointer hover:bg-slate-100 transition-all"
                                >
                                    <summary className="flex items-center justify-between font-semibold text-slate-900">
                                        {faq.q}
                                        <span className="transform group-open:rotate-180 transition-transform">
                                            ▼
                                        </span>
                                    </summary>
                                    <p className="text-slate-600 mt-4 leading-relaxed">
                                        {faq.a}
                                    </p>
                                </details>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </CustomLayout>
    );
}
