import {
  Home,
  CreditCard,
  MessageSquare,
  BarChart3,
  ShieldCheck,
  Clock,
  ChevronRight,
  Facebook,
  Twitter,
  Linkedin
} from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen font-sans text-gray-900 bg-[#FFFBF7]">
      {/* 1. NAVIGATION BAR */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-[#FF5C00] p-1.5 rounded-lg">
            <span className="text-white font-bold text-xl">D</span>
          </div>
          <span className="text-xl font-bold tracking-tight">DormFlow</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <a href="#" className="hover:text-[#FF5C00]">Features</a>
          <a href="#" className="hover:text-[#FF5C00]">Pricing</a>
          <a href="#" className="hover:text-[#FF5C00]">About Us</a>
          <a href="#" className="hover:text-[#FF5C00]">Contact</a>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/signin" className="text-[#FF5C00] font-semibold px-4 py-2 hover:bg-orange-50 rounded-lg">Sign In</Link>
          <button className="bg-[#FF5C00] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[#e65300] transition-colors">
            Try For Free
          </button>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="container mx-auto px-8 py-16 flex flex-col md:flex-row items-center justify-between">
        <div className="md:w-1/2 space-y-6">
          <div className="inline-block bg-orange-100 text-[#FF5C00] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            ✨ Modern dormitory management solution
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight">
            Dormitory Management <br />
            <span className="text-gray-800">Smart & Efficient</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-lg">
            DormFlow helps students and dormitory managers connect easily. Manage rooms, payments, and requests all in one app.
          </p>
          <div className="flex items-center gap-4 pt-4">
            <button className="bg-[#FF5C00] text-white px-8 py-3.5 rounded-lg font-bold flex items-center gap-2 hover:bg-[#e65300]">
              Get Started <ChevronRight size={20} />
            </button>
            <button className="border-2 border-orange-200 text-[#FF5C00] px-8 py-3 rounded-lg font-bold hover:bg-orange-50 transition-colors">
              View Demo
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-8 pt-10 border-t border-gray-100">
            <div><p className="text-2xl font-bold text-[#FF5C00]">500+</p><p className="text-sm text-gray-500">Dormitories</p></div>
            <div><p className="text-2xl font-bold text-[#FF5C00]">50K+</p><p className="text-sm text-gray-500">Students</p></div>
            <div><p className="text-2xl font-bold text-[#FF5C00]">4.9/5</p><p className="text-sm text-gray-500">Rating</p></div>
          </div>
        </div>

        <div className="md:w-1/2 mt-12 md:mt-0 relative flex justify-center items-center">
          <div className="w-full max-w-[500px] aspect-square bg-[#FF5C00] rounded-[60px] shadow-2xl flex flex-col items-center justify-center text-white p-12 transform hover:scale-105 transition-transform duration-300">
            <div className="bg-white/20 p-6 rounded-3xl mb-8">
              <Home size={60} strokeWidth={1.5} />
            </div>
            <h3 className="text-3xl font-bold mb-3 text-center">Management App</h3>
            <p className="text-orange-100 text-center text-lg opacity-90">
              Easy to use & modern
            </p>
          </div>
        </div>
      </section>

      {/* 3. FEATURES SECTION */}
      <section className="bg-white py-20 px-8">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-gray-500">All the tools you need to manage your dormitory efficiently</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Home className="text-white" />, title: "Room Management", desc: "Easily manage room information, layouts, and availability" },
              { icon: <CreditCard className="text-white" />, title: "Digital Payments", desc: "Multiple payment methods with maximum security" },
              { icon: <MessageSquare className="text-white" />, title: "Direct Communication", desc: "Chat with managers and dormitory staff instantly" },
              { icon: <BarChart3 className="text-white" />, title: "Detailed Reports", desc: "Complete statistics dashboard for management" },
              { icon: <ShieldCheck className="text-white" />, title: "High Security", desc: "Data is encrypted and safely protected" },
              { icon: <Clock className="text-white" />, title: "24/7 Support", desc: "Support team always ready to help you" },
            ].map((item, index) => (
              <div key={index} className="p-8 rounded-2xl bg-[#FFFBF7] hover:shadow-lg transition-shadow border border-orange-50 group">
                <div className="bg-[#FF5C00] w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-orange-200 shadow-lg">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. CTA SECTION */}
      <section className="container mx-auto px-8 py-20">
        <div className="bg-[#FF5C00] rounded-[40px] p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold">Ready to Upgrade Your Dormitory?</h2>
            <p className="text-orange-100 text-lg">
              Start your digital transformation journey today. Free 30-day trial, no credit card required.
            </p>
            <button className="bg-white text-[#FF5C00] px-10 py-4 rounded-xl font-bold text-lg hover:bg-orange-50 transition-colors inline-flex items-center gap-2">
              Try For Free <ChevronRight size={20} />
            </button>
          </div>
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-10 -mb-10"></div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="bg-[#111827] text-gray-400 py-16 px-8">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-white">
              <div className="bg-[#FF5C00] p-1.5 rounded-lg">
                <span className="font-bold text-lg">D</span>
              </div>
              <span className="text-xl font-bold">DormFlow</span>
            </div>
            <p className="text-sm leading-relaxed">
              Smart dormitory management solution for the digital student generation.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Product</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-white">Features</a></li>
              <li><a href="#" className="hover:text-white">Pricing</a></li>
              <li><a href="#" className="hover:text-white">Security</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Company</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-white">About Us</a></li>
              <li><a href="#" className="hover:text-white">Blog</a></li>
              <li><a href="#" className="hover:text-white">Careers</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Legal</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-white">Terms</a></li>
              <li><a href="#" className="hover:text-white">Privacy</a></li>
              <li><a href="#" className="hover:text-white">Support</a></li>
            </ul>
          </div>
        </div>
        
        <div className="container mx-auto mt-16 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm">© 2026 DormFlow. All rights reserved.</p>
          <div className="flex gap-4">
            <div className="bg-gray-800 p-2 rounded-full hover:bg-gray-700 cursor-pointer"><Facebook size={18} /></div>
            <div className="bg-gray-800 p-2 rounded-full hover:bg-gray-700 cursor-pointer"><Twitter size={18} /></div>
            <div className="bg-gray-800 p-2 rounded-full hover:bg-gray-700 cursor-pointer"><Linkedin size={18} /></div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;