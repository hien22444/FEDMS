import {
  Home,
  CreditCard,
  MessageSquare,
  BarChart3,
  ShieldCheck,
  Clock,
  ChevronLeft,
  ChevronRight,
  Facebook,
  Twitter,
  Linkedin
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants';
import { fetchDashboardStats } from '@/lib/actions/admin';

const LandingPage = () => {
  const heroImages = ['/images/building.jpg', '/images/building%201.jpg', '/images/building%202.jpg'];
  const [currentImage, setCurrentImage] = useState(0);
  const [heroStats, setHeroStats] = useState([
    { label: 'Dorms', value: '10+' },
    { label: 'Rooms', value: '1000+' },
    { label: 'Beds', value: '5000+' },
  ]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
    }, 4000);

    return () => window.clearInterval(intervalId);
  }, [heroImages.length]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetchDashboardStats()
      .then((stats) => {
        setHeroStats([
          { label: 'Dorms', value: `${stats.totalDorms}+` },
          { label: 'Rooms', value: `${stats.totalRooms}+` },
          { label: 'Beds', value: `${stats.totalBeds}+` },
        ]);
      })
      .catch(() => {
        // Keep fallback values for public users when stats endpoint is unavailable.
      });
  }, []);

  const goToPrevImage = () => {
    setCurrentImage((prev) => (prev - 1 + heroImages.length) % heroImages.length);
  };

  const goToNextImage = () => {
    setCurrentImage((prev) => (prev + 1) % heroImages.length);
  };

  return (
    <div className="min-h-screen font-sans text-gray-900 bg-[#FFFBF7]">
      {/* 1. NAVIGATION BAR */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white sticky top-0 z-50 shadow-sm">
        <Link to={ROUTES.LANDING} className="flex items-center gap-2 group">
          <img
            src="/images/logo.png"
            alt="DMS logo"
            className="w-12 h-12 rounded-lg object-cover"
          />
          <span className="text-xl font-bold tracking-tight transition-colors group-hover:text-[#F37021]">DMS</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link to={ROUTES.ABOUT_US} className="text-gray-700 font-semibold px-2 py-2 hover:text-[#F37021]">
            About Us
          </Link>
          <Link
            to={ROUTES.SIGN_IN}
            className="bg-[#F37021] text-white font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="container mx-auto px-8 py-16 flex flex-col md:flex-row items-center justify-between">
        <div className="md:w-1/2 space-y-6">
          <div className="inline-block bg-orange-100 text-[#F36F21] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Exclusive for FPT University Students
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight">
            Smart FPT Dormitory <br />
            <span className="text-gray-800">Experience</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-xl leading-relaxed">
            FPT Da Nang DMS helps students and Dormitory Management effortlessly track room allocation, pay utility overages, and report maintenance issues transparently and efficiently.
          </p>
          <div className="flex gap-4 pt-2">
            <Link
              to={ROUTES.SIGN_IN}
              className="bg-[#F37021] text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
            >
              Login Now
            </Link>
            <button
              className="bg-white text-[#F37021] border border-[#F37021] font-semibold px-6 py-3 rounded-lg hover:bg-orange-50 transition-colors"
            >
              User Guide
            </button>
          </div>
          <div className="grid grid-cols-3 gap-8 pt-10 border-t border-gray-100">
            {heroStats.map((item) => (
              <div key={item.label}>
                <p className="text-2xl font-bold text-[#F36F21]">{item.value}</p>
                <p className="text-sm text-gray-500">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="md:w-1/2 mt-12 md:mt-0 relative flex justify-center items-center">
          <div className="relative w-full max-w-[500px] aspect-square rounded-[60px] shadow-2xl overflow-hidden group">
            <div
              className="flex h-full transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentImage * 100}%)` }}
            >
              {heroImages.map((image, index) => (
                <img
                  key={image}
                  src={image}
                  alt={`Dormitory building ${index + 1}`}
                  className="w-full h-full object-cover flex-shrink-0"
                />
              ))}
            </div>

            <button
              type="button"
              onClick={goToPrevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/35 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={goToNextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/35 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>

            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
              {heroImages.map((_, index) => (
                <button
                  key={`dot-${index}`}
                  type="button"
                  onClick={() => setCurrentImage(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${currentImage === index ? 'bg-white' : 'bg-white/50'
                    }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
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
              { icon: <Home className="text-white" />, title: "Room Allocation", desc: "Smoothly manage check-ins, check-outs, and Dom transfers" },
              { icon: <CreditCard className="text-white" />, title: "Utility Payments", desc: "Easily pay monthly electricity and water overflow quotas" },
              { icon: <MessageSquare className="text-white" />, title: "Fix Requests", desc: "Report AC, lighting, or furniture issues directly to SRO" },
              { icon: <BarChart3 className="text-white" />, title: "Usage Tracking", desc: "Track electricity and water consumption seamlessly" },
              { icon: <ShieldCheck className="text-white" />, title: "Violation Rules", desc: "Keep track of penalty points and maintain campus security" },
              { icon: <Clock className="text-white" />, title: "24/7 Support", desc: "Access the dormitory support team anytime you need" },
            ].map((item, index) => (
              <div key={index} className="p-8 rounded-2xl bg-[#FFFBF7] hover:shadow-lg transition-shadow border border-orange-50 group">
                <div className="bg-[#F36F21] w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-orange-200 shadow-lg">
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
        <div className="bg-[#F36F21] rounded-[40px] p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold">Ready for the New Semester at FPT Dorm?</h2>
            <p className="text-orange-100 text-lg">
              Login to the system to book your room, submit requests, and get the latest announcements from the management board.
            </p>
            <div className="pt-4">
              <Link
                to={ROUTES.SIGN_IN}
                className="inline-block bg-white text-[#F36F21] font-bold px-8 py-4 rounded-xl hover:bg-orange-50 transition-colors"
              >
                Login to DMS
              </Link>
            </div>
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
              <img
                src="/images/logo.png"
                alt="DMS logo"
                className="w-8 h-8 rounded-lg object-cover"
              />
              <span className="text-xl font-bold">DMS</span>
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
          <p className="text-sm">© 2026 DMS. All rights reserved.</p>
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
