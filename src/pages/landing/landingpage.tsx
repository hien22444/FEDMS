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
          <a href="#" className="hover:text-[#FF5C00]">Tính Năng</a>
          <a href="#" className="hover:text-[#FF5C00]">Giá Cả</a>
          <a href="#" className="hover:text-[#FF5C00]">Về Chúng Tôi</a>
          <a href="#" className="hover:text-[#FF5C00]">Liên Hệ</a>
        </div>

        <div className="flex items-center gap-4">
          <button className="text-[#FF5C00] font-semibold px-4 py-2 hover:bg-orange-50 rounded-lg">Đăng Nhập</button>
          <button className="bg-[#FF5C00] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[#e65300] transition-colors">
            Dùng Thử Miễn Phí
          </button>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="container mx-auto px-8 py-16 flex flex-col md:flex-row items-center justify-between">
        <div className="md:w-1/2 space-y-6">
          <div className="inline-block bg-orange-100 text-[#FF5C00] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            ✨ Giải pháp quản lý ký túc xá hiện đại
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight">
            Quản Lý Ký Túc Xá <br />
            <span className="text-gray-800">Thông Minh & Hiệu Quả</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-lg">
            DormFlow giúp sinh viên và quản lý ký túc xá kết nối dễ dàng. Quản lý phòng, thanh toán, và các yêu cầu chỉ trong một ứng dụng.
          </p>
          <div className="flex items-center gap-4 pt-4">
            <button className="bg-[#FF5C00] text-white px-8 py-3.5 rounded-lg font-bold flex items-center gap-2 hover:bg-[#e65300]">
              Bắt Đầu Ngay <ChevronRight size={20} />
            </button>
            <button className="border-2 border-orange-200 text-[#FF5C00] px-8 py-3 rounded-lg font-bold hover:bg-orange-50 transition-colors">
              Xem Demo
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-8 pt-10 border-t border-gray-100">
            <div><p className="text-2xl font-bold text-[#FF5C00]">500+</p><p className="text-sm text-gray-500">Ký túc xá</p></div>
            <div><p className="text-2xl font-bold text-[#FF5C00]">50K+</p><p className="text-sm text-gray-500">Sinh viên</p></div>
            <div><p className="text-2xl font-bold text-[#FF5C00]">4.9/5</p><p className="text-sm text-gray-500">Rating</p></div>
          </div>
        </div>

        <div className="md:w-1/2 mt-12 md:mt-0 relative flex justify-center items-center">
          <div className="w-full max-w-[500px] aspect-square bg-[#FF5C00] rounded-[60px] shadow-2xl flex flex-col items-center justify-center text-white p-12 transform hover:scale-105 transition-transform duration-300">
            <div className="bg-white/20 p-6 rounded-3xl mb-8">
              <Home size={60} strokeWidth={1.5} />
            </div>
            <h3 className="text-3xl font-bold mb-3 text-center">Ứng dụng quản lý</h3>
            <p className="text-orange-100 text-center text-lg opacity-90">
              Dễ sử dụng & hiện đại
            </p>
          </div>
        </div>
      </section>

      {/* 3. FEATURES SECTION */}
      <section className="bg-white py-20 px-8">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Tính Năng Mạnh Mẽ</h2>
            <p className="text-gray-500">Mọi công cụ bạn cần để quản lý ký túc xá hiệu quả</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Home className="text-white" />, title: "Quản Lý Phòng", desc: "Quản lý thông tin phòng, bố trí, và tình trạng một cách dễ dàng" },
              { icon: <CreditCard className="text-white" />, title: "Thanh Toán Điện Tử", desc: "Hỗ trợ multiple payment methods với bảo mật tối đa" },
              { icon: <MessageSquare className="text-white" />, title: "Liên Lạc Trực Tiếp", desc: "Chat với quản lý và nhân viên ký túc xá ngay lập tức" },
              { icon: <BarChart3 className="text-white" />, title: "Báo Cáo Chi Tiết", desc: "Dashboard thống kê hoàn chỉnh cho quản lý" },
              { icon: <ShieldCheck className="text-white" />, title: "Bảo Mật Cao", desc: "Dữ liệu được mã hóa và bảo vệ an toàn" },
              { icon: <Clock className="text-white" />, title: "Hỗ Trợ 24/7", desc: "Đội ngũ hỗ trợ luôn sẵn sàng giúp bạn" },
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
            <h2 className="text-4xl md:text-5xl font-bold">Sẵn Sàng Nâng Cấp Ký Túc Xá?</h2>
            <p className="text-orange-100 text-lg">
              Hãy bắt đầu hành trình chuyển đổi số hôm nay. Dùng thử miễn phí 30 ngày, không cần thẻ tín dụng.
            </p>
            <button className="bg-white text-[#FF5C00] px-10 py-4 rounded-xl font-bold text-lg hover:bg-orange-50 transition-colors inline-flex items-center gap-2">
              Dùng Thử Miễn Phí <ChevronRight size={20} />
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
              Giải pháp quản lý ký túc xá thông minh cho thế hệ sinh viên số.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-6">Sản Phẩm</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-white">Tính Năng</a></li>
              <li><a href="#" className="hover:text-white">Giá Cả</a></li>
              <li><a href="#" className="hover:text-white">Bảo Mật</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Công Ty</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-white">Về Chúng Tôi</a></li>
              <li><a href="#" className="hover:text-white">Blog</a></li>
              <li><a href="#" className="hover:text-white">Tuyển Dụng</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Pháp Lý</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-white">Điều Khoản</a></li>
              <li><a href="#" className="hover:text-white">Riêng Tư</a></li>
              <li><a href="#" className="hover:text-white">Hỗ Trợ</a></li>
            </ul>
          </div>
        </div>
        
        <div className="container mx-auto mt-16 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm">© 2026 DormFlow. Tất cả quyền lợi được bảo lưu.</p>
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