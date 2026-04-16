import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants';

type Member = {
  role: 'Mentor' | 'Leader' | 'Member';
  name: string;
  studentId: string;
  image: string;
};

const teamMembers: Member[] = [
  {
    role: 'Mentor',
    name: 'Mentor Name',
    studentId: 'N/A',
    image: '/images/logo.jpg',
  },
  {
    role: 'Leader',
    name: 'Trần Trịnh Hiến',
    studentId: 'SE000001',
    image: '/images/building.jpg',
  },
  {
    role: 'Member',
    name: 'Phan Thanh Tùng',
    studentId: 'DE170779',
    image: '/images/tung1.jpg',
  },
  {
    role: 'Member',
    name: 'Phạm Thanh Tùng',
    studentId: 'SE000003',
    image: '/images/building%201.jpg',
  },
  {
    role: 'Member',
    name: 'Phạm Ngọc Lâm',
    studentId: 'SE000004',
    image: '/images/building%202.jpg',
  },
];

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-[#FFFBF7] text-gray-900">
      <nav className="flex items-center justify-between px-8 py-4 bg-white sticky top-0 z-50 shadow-sm">
        <Link to={ROUTES.LANDING} className="flex items-center gap-2">
          <img src="/images/logo.png" alt="DMS logo" className="w-12 h-12 rounded-lg object-cover" />
          <span className="text-xl font-bold tracking-tight">DMS</span>
        </Link>
        <Link
          to={ROUTES.SIGN_IN}
          className="bg-[#F37021] text-white font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          Sign In
        </Link>
      </nav>

      <section className="container mx-auto px-8 py-16">
        <div className="max-w-3xl mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">About Us</h1>
          <p className="text-gray-600 mt-4 text-lg">
            Team DMS includes 1 mentor, 1 leader and 3 members. We build a modern dormitory management
            system focused on students, managers, and campus operations.
          </p>
        </div>

        <div className="flex justify-center mb-16">
          {teamMembers.filter(m => m.role === 'Mentor').map((member) => (
            <div key={member.name} className="w-full max-w-sm bg-white rounded-3xl shadow-xl border-2 border-[#F37021] p-8 text-center transform hover:-translate-y-2 transition-all duration-300">
              <img
                src={member.image}
                alt={member.name}
                className="w-48 h-48 mx-auto object-cover rounded-full mb-6 shadow-md border-4 border-orange-50"
              />
              <div className="inline-block text-sm font-bold uppercase tracking-wider px-6 py-2 rounded-full bg-[#F37021] text-white">
                Project {member.role}
              </div>
              <h3 className="text-2xl font-black text-gray-800 mt-5">{member.name}</h3>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {teamMembers.filter(m => m.role !== 'Mentor').map((member) => (
            <div key={member.studentId} className="w-full bg-white rounded-3xl shadow-xl border-2 border-orange-100 hover:border-[#F37021] p-8 text-center transform hover:-translate-y-2 transition-all duration-300">
              <img
                src={member.image}
                alt={member.name}
                className="w-40 h-40 mx-auto object-cover rounded-full mb-6 shadow-md border-4 border-orange-50"
              />
              <div className="inline-block text-sm font-bold uppercase tracking-wider px-6 py-2 rounded-full bg-orange-100 text-[#F37021]">
                {member.role}
              </div>
              <h3 className="text-xl font-black text-gray-800 mt-5">{member.name}</h3>
              <p className="text-sm font-medium text-gray-500 mt-2">{member.studentId}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
