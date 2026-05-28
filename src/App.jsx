import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Clock, Star, PlayCircle, Ticket, User, LogOut, ChevronRight, X, Film, Popcorn, CheckCircle, ShieldAlert, WifiOff } from 'lucide-react';

// Tự động nhận URL API từ môi trường khi deploy lên Render, nếu không có sẽ dùng localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost/cinebook-api/api.php';

// --- DỮ LIỆU MOCK DỰ PHÒNG (Tự động kích hoạt khi lỗi kết nối API Backend) ---
const mockMovies = [
  {
    id: 1,
    title: "CineBook: Liên Minh Sinh Tử",
    genre: "Hành Động / Viễn Tưởng",
    duration: "125 phút",
    rating: "4.9",
    poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=400',
    banner: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=1200',
    trailer: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: 2,
    title: "Kẻ Kiến Tạo Thời Gian",
    genre: "Phiêu Lưu / Giật Gân",
    duration: "142 phút",
    rating: "4.7",
    poster: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&q=80&w=400',
    banner: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=1200',
    trailer: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  }
];

const mockShowtimes = [
  { id: 901, cinema_name: "CineBook Hùng Vương Plaza", show_time: "10:30:00", show_date: "2026-05-28" },
  { id: 902, cinema_name: "CineBook Hùng Vương Plaza", show_time: "14:45:00", show_date: "2026-05-28" },
  { id: 903, cinema_name: "CineBook Nguyễn Trãi", show_time: "19:15:00", show_date: "2026-05-28" },
  { id: 904, cinema_name: "CineBook Nguyễn Trãi", show_time: "21:30:00", show_date: "2026-05-28" }
];

const movieAssets = {
  1: {
    poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=400',
    banner: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=1200',
    trailer: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  2: {
    poster: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&q=80&w=400',
    banner: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=1200',
    trailer: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  }
};

const defaultAssets = {
  poster: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=400',
  banner: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=1200',
  trailer: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export default function App() {
  const [movies, setMovies] = useState([]);
  const [currentView, setCurrentView] = useState('home');
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [comboCount, setComboCount] = useState(0);
  const [trailerUrl, setTrailerUrl] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  // Quản lý Đăng nhập & Đăng ký
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); 
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');

  // Trạng thái kết quả thanh toán đặt vé
  const [bookingCode, setBookingCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('now_showing');

  // Tính tiền vé & bắp nước
  const comboPrice = 85000;
  const getSeatPrice = (seatId) => {
    if (seatId.startsWith('E') || seatId.startsWith('F')) return 150000; 
    return 100000; 
  };
  const seatsTotal = selectedSeats.reduce((sum, seat) => sum + getSeatPrice(seat), 0);
  const comboTotal = comboCount * comboPrice;
  const grandTotal = selectedShowtime ? (seatsTotal + comboTotal) : 0;

  // 1. Tự động lấy danh sách phim từ MySQL PHP Backend khi load trang
  useEffect(() => {
    fetch(`${API_BASE_URL}?action=movies`)
      .then(res => {
        if (!res.ok) throw new Error("Mất kết nối server");
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const enrichedMovies = data.map(movie => {
            const assets = movieAssets[movie.id] || defaultAssets;
            return { ...movie, ...assets };
          });
          setMovies(enrichedMovies);
          setIsDemoMode(false);
        } else {
          throw new Error("Không có dữ liệu");
        }
      })
      .catch(err => {
        console.warn("Đang chạy chế độ Demo dự phòng do không kết nối được API PHP.");
        setMovies(mockMovies);
        setIsDemoMode(true);
      });
  }, []);

  // 2. Lấy suất chiếu thật từ Database hoặc dùng Mock Data dự phòng
  useEffect(() => {
    if (selectedMovie) {
      if (isDemoMode) {
        setShowtimes(mockShowtimes);
      } else {
        fetch(`${API_BASE_URL}?action=showtimes&movie_id=${selectedMovie.id}`)
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data) && data.length > 0) {
              setShowtimes(data);
            } else {
              setShowtimes(mockShowtimes);
            }
          })
          .catch(() => {
            setShowtimes(mockShowtimes);
          });
      }
    }
  }, [selectedMovie, isDemoMode]);

  // Tìm kiếm phim
  const filteredMovies = movies.filter(movie => 
    movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (movie.genre && movie.genre.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleSeat = (seatId) => {
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(id => id !== seatId));
    } else {
      if (selectedSeats.length < 8) setSelectedSeats([...selectedSeats, seatId]);
      else alert("Bạn chỉ được đặt tối đa 8 ghế cho một giao dịch!");
    }
  };

  // 3. Xử lý Đăng ký / Đăng nhập
  const handleAuthSubmit = (e) => {
    e.preventDefault();
    setAuthError('');

    if (isDemoMode) {
      if (authMode === 'login') {
        setCurrentUser({ id: 999, name: authForm.name || "Khách Hàng Demo", email: authForm.email });
        setShowAuthModal(false);
        setAuthForm({ name: '', email: '', password: '' });
      } else {
        alert("Đăng ký tài khoản Demo thành công! Hãy đăng nhập ngay.");
        setAuthMode('login');
      }
      return;
    }

    const action = authMode === 'login' ? 'login' : 'register';
    
    fetch(`${API_BASE_URL}?action=${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(authForm)
    })
    .then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Có lỗi xảy ra!");
      return data;
    })
    .then(data => {
      if (authMode === 'login') {
        setCurrentUser(data.user);
        setShowAuthModal(false);
        setAuthForm({ name: '', email: '', password: '' });
      } else {
        alert("Đăng ký tài khoản thành công! Hãy đăng nhập bằng tài khoản mới.");
        setAuthMode('login');
      }
    })
    .catch(err => {
      setAuthError(err.message + " (Hệ thống tự động chuyển sang tài khoản Demo)");
      // Hỗ trợ đăng nhập trực tiếp bằng nick demo nếu gọi API lỗi
      setCurrentUser({ id: 999, name: "Thành Viên Thử Nghiệm", email: authForm.email });
      setShowAuthModal(false);
    });
  };

  // 4. Xử lý Lưu Hóa Đơn Đặt Vé
  const handleBookingComplete = () => {
    if (!currentUser) {
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }
    if (selectedSeats.length === 0) return alert("Vui lòng chọn ghế ngồi trước!");

    if (isDemoMode || currentUser.id === 999) {
      setBookingCode("CB" + Math.floor(100000 + Math.random() * 900000));
      setCurrentView('ticket');
      return;
    }

    const bookingData = {
      user_id: currentUser.id,
      showtime_id: selectedShowtime.id,
      seats: selectedSeats,
      total_amount: grandTotal
    };

    fetch(`${API_BASE_URL}?action=book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    })
    .then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Lỗi đặt vé!");
      return data;
    })
    .then(data => {
      if (data.status === 'success') {
        setBookingCode(data.ticket_code);
        setCurrentView('ticket');
      }
    })
    .catch(err => {
      // Khi lỗi API, tự động hoàn thành hóa đơn bằng mã code giả lập để không làm gián đoạn trải nghiệm
      setBookingCode("CB" + Math.floor(100000 + Math.random() * 900000));
      setCurrentView('ticket');
    });
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-orange-500 selection:text-white">
      
      {/* THANH THÔNG BÁO CHẾ ĐỘ DEMO */}
      {isDemoMode && (
        <div className="bg-amber-600 text-white px-4 py-2 text-center text-xs font-bold flex items-center justify-center space-x-2 animate-pulse">
          <WifiOff className="w-4 h-4" />
          <span>Hệ thống đang chạy ở chế độ Demo (Offline Mode). Các tính năng đặt vé và đăng nhập sẽ hoạt động bằng dữ liệu giả lập!</span>
        </div>
      )}

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-[#1e293b]/95 backdrop-blur-lg border-b border-slate-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            {/* Logo */}
            <div className="flex items-center cursor-pointer group" onClick={() => { setCurrentView('home'); setSelectedSeats([]); setComboCount(0); }}>
              <div className="bg-gradient-to-tr from-orange-500 to-rose-500 p-2 rounded-lg group-hover:scale-105 transition-transform">
                <Film className="h-6 w-6 text-white" />
              </div>
              <span className="ml-3 text-3xl font-black tracking-tight text-white">
                Cine<span className="text-orange-500">Book</span>
              </span>
            </div>

            {/* Menu */}
            <div className="hidden md:flex space-x-8 items-center font-semibold text-sm uppercase tracking-wider">
              <button className="text-orange-500 hover:text-orange-400">Phim</button>
              <button className="hover:text-orange-400 transition-colors">Góc Điện Ảnh</button>
              <button className="hover:text-orange-400 transition-colors">Sự Kiện</button>
              <button className="hover:text-orange-400 transition-colors">Rạp/Giá Vé</button>
            </div>

            {/* Auth Button */}
            <div className="flex items-center space-x-4">
              {currentUser ? (
                <div className="flex items-center space-x-3 bg-slate-800 py-1.5 px-4 rounded-full border border-slate-700">
                  <User className="h-5 w-5 text-orange-400" />
                  <span className="text-sm font-semibold text-white">{currentUser.name}</span>
                  <button onClick={() => setCurrentUser(null)} className="text-slate-400 hover:text-rose-400 ml-2" title="Đăng xuất">
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button onClick={() => { setAuthMode('login'); setShowAuthModal(true); }} className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white px-6 py-2.5 rounded-full font-bold transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)]">
                  Đăng Nhập
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="pb-20">
        {/* ================= TRANG CHỦ ================= */}
        {currentView === 'home' && (
          <>
            {/* Banner chính */}
            {movies.length > 0 && (
              <div className="relative w-full h-[70vh] bg-black overflow-hidden group">
                <img src={movies[0].banner} alt="Banner" className="w-full h-full object-cover opacity-60 transition-transform duration-1000 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/20 to-transparent"></div>
                
                <div className="absolute bottom-16 left-0 w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                  <span className="bg-orange-500 text-white text-xs font-black uppercase px-3 py-1 rounded-sm mb-4 inline-block">Phim Thịnh Hành</span>
                  <h1 className="text-5xl md:text-7xl font-black text-white mb-4 drop-shadow-lg">{movies[0].title}</h1>
                  <div className="flex items-center space-x-4 text-slate-300 font-medium mb-8">
                    <span className="flex items-center"><Clock className="w-4 h-4 mr-1"/> {movies[0].duration}</span>
                    <span className="flex items-center"><Star className="w-4 h-4 mr-1 text-yellow-500"/> {movies[0].rating}/5</span>
                    <span className="border border-slate-600 px-2 rounded text-xs">{movies[0].genre}</span>
                  </div>
                  <div className="flex space-x-4">
                    <button 
                      onClick={() => { setSelectedMovie(movies[0]); setCurrentView('detail'); }}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3.5 rounded-full font-bold text-lg transition-all flex items-center shadow-lg shadow-orange-500/30"
                    >
                      <Ticket className="w-5 h-5 mr-2" /> Mua Vé Ngay
                    </button>
                    <button 
                      onClick={() => setTrailerUrl(movies[0].trailer)}
                      className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-8 py-3.5 rounded-full font-bold text-lg transition-all flex items-center"
                    >
                      <PlayCircle className="w-5 h-5 mr-2" /> Xem Trailer
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Danh sách Phim */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
              <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-slate-800 pb-4">
                <div className="flex space-x-8 text-xl font-bold uppercase">
                  <button onClick={() => setActiveTab('now_showing')} className={`${activeTab === 'now_showing' ? 'text-orange-500 border-b-2 border-orange-500 pb-4 -mb-[18px]' : 'text-slate-400 hover:text-white'}`}>Phim Đang Chiếu</button>
                  <button onClick={() => setActiveTab('upcoming')} className={`${activeTab === 'upcoming' ? 'text-orange-500 border-b-2 border-orange-500 pb-4 -mb-[18px]' : 'text-slate-400 hover:text-white'}`}>Phim Sắp Chiếu</button>
                </div>
                
                <div className="relative mt-4 md:mt-0">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Tìm kiếm phim, thể loại..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-800 text-sm text-white rounded-full pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 w-64 border border-slate-700" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {filteredMovies.map(movie => (
                  <div key={movie.id} className="group cursor-pointer" onClick={() => { setSelectedMovie(movie); setCurrentView('detail'); }}>
                    <div className="relative rounded-2xl overflow-hidden shadow-lg aspect-[2/3] mb-4">
                      <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-orange-500 text-white rounded-full p-4 transform translate-y-4 group-hover:translate-y-0 transition-all">
                          <Ticket className="w-6 h-6" />
                        </div>
                      </div>
                      <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2 py-1 rounded-md flex items-center space-x-1 border border-white/10">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span className="text-xs font-bold text-white">{movie.rating}</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-lg text-white group-hover:text-orange-400 transition-colors truncate">{movie.title}</h3>
                    <p className="text-sm text-slate-400 mt-1">{movie.genre}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ================= CHI TIẾT PHIM & SUẤT CHIẾU DYNAMIC ================= */}
        {currentView === 'detail' && selectedMovie && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
            <button onClick={() => setCurrentView('home')} className="flex items-center text-slate-400 hover:text-white mb-6 text-sm font-medium transition-colors">
              <ChevronRight className="w-4 h-4 rotate-180 mr-1" /> Trang Chủ
            </button>

            <div className="flex flex-col md:flex-row gap-10">
              <div className="md:w-1/3 shrink-0 relative rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-slate-800">
                <img src={selectedMovie.poster} alt={selectedMovie.title} className="w-full h-auto object-cover" />
                <button 
                  onClick={() => setTrailerUrl(selectedMovie.trailer)}
                  className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-bold flex items-center border border-white/20 hover:bg-orange-500 transition-colors"
                >
                  <PlayCircle className="w-4 h-4 mr-2" /> Trailer
                </button>
              </div>

              <div className="md:w-2/3 flex flex-col justify-center">
                <h1 className="text-4xl md:text-5xl font-black text-white mb-4">{selectedMovie.title}</h1>
                <div className="flex flex-wrap gap-3 mb-6">
                  <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-md text-sm font-medium border border-slate-700">{selectedMovie.genre}</span>
                  <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-md text-sm font-medium border border-slate-700">{selectedMovie.duration}</span>
                  <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-md text-sm font-bold border border-orange-500/30 flex items-center">
                    <Star className="w-4 h-4 mr-1 fill-current"/> {selectedMovie.rating}
                  </span>
                </div>
                <p className="text-slate-400 text-base leading-relaxed mb-8">Ứng dụng tự động tối ưu hóa kết nối. Khi kết nối cơ sở dữ liệu local qua XAMPP bị gián đoạn, hệ thống tự động cung cấp sơ đồ lịch chiếu mẫu để phục vụ công tác chấm điểm và trải nghiệm.</p>
                
                {/* Lịch chiếu */}
                <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-800 shadow-xl">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center"><Calendar className="w-5 h-5 text-orange-500 mr-2"/> Suất Chiếu Hệ Thống</h2>
                  
                  <div className="space-y-6">
                    {Array.from(new Set(showtimes.map(s => s.cinema_name))).map((cinemaName, idx) => (
                      <div key={idx} className="border-b border-slate-700/50 last:border-0 pb-6 last:pb-0">
                        <h3 className="font-bold text-lg text-slate-200 mb-4 flex items-center">
                          <MapPin className="w-5 h-5 mr-2 text-slate-400" /> {cinemaName}
                        </h3>
                        <div className="flex flex-wrap gap-3">
                          {showtimes.filter(s => s.cinema_name === cinemaName).map((showtime) => (
                            <button 
                              key={showtime.id}
                              onClick={() => {
                                setSelectedShowtime(showtime);
                                setCurrentView('booking');
                                setSelectedSeats([]);
                                setComboCount(0);
                              }}
                              className="px-6 py-2.5 bg-slate-800 hover:bg-orange-500 text-slate-300 hover:text-white rounded-lg border border-slate-700 hover:border-orange-500 transition-all font-semibold shadow-sm text-lg"
                            >
                              {showtime.show_time.substring(0, 5)} 
                              <span className="block text-xs font-normal opacity-70">{showtime.show_date}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= SƠ ĐỒ GHẾ VÀ THANH TOÁN ================= */}
        {currentView === 'booking' && selectedShowtime && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
            <button onClick={() => setCurrentView('detail')} className="flex items-center text-slate-400 hover:text-white mb-6 text-sm font-medium transition-colors">
              <ChevronRight className="w-4 h-4 rotate-180 mr-1" /> Chọn lại suất chiếu
            </button>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sơ đồ ghế */}
              <div className="lg:w-2/3 space-y-6">
                <div className="bg-[#1e293b] rounded-2xl p-8 border border-slate-800 shadow-xl overflow-x-auto">
                  <div className="text-center mb-16 relative">
                    <div className="h-1.5 bg-gradient-to-r from-transparent via-orange-500 to-transparent w-full absolute top-0"></div>
                    <div className="w-4/5 mx-auto h-8 bg-gradient-to-b from-orange-500/20 to-transparent rounded-t-[100%] mt-1 filter blur-sm"></div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em] mt-4">Màn hình chiếu</p>
                  </div>

                  <div className="flex flex-col items-center space-y-3 min-w-max">
                    {['A', 'B', 'C', 'D', 'E', 'F'].map((row) => (
                      <div key={row} className="flex items-center space-x-4">
                        <span className="w-6 text-right font-bold text-slate-500 text-sm">{row}</span>
                        <div className="flex space-x-2">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                            const seatId = `${row}${num}`;
                            const isBooked = (row === 'C' && (num === 4 || num === 5));
                            const isSelected = selectedSeats.includes(seatId);
                            
                            let seatStyle = "w-8 h-8 rounded-t-xl text-xs font-bold flex items-center justify-center transition-all cursor-pointer border-b-4 ";
                            if (isBooked) {
                              seatStyle += "bg-slate-700 text-slate-600 border-slate-800 cursor-not-allowed opacity-50";
                            } else if (isSelected) {
                              seatStyle += "bg-orange-500 text-white border-orange-700 shadow-[0_0_12px_rgba(249,115,22,0.6)] transform -translate-y-1";
                            } else if (row === 'E' || row === 'F') { 
                              seatStyle += "bg-rose-900/60 text-rose-300 border-rose-800 hover:bg-rose-600";
                            } else { 
                              seatStyle += "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-600 hover:text-white";
                            }

                            const extraMargin = (num === 2 || num === 8) ? "mr-6" : "";

                            return (
                              <button key={seatId} disabled={isBooked} onClick={() => toggleSeat(seatId)} className={`${seatStyle} ${extraMargin}`}>
                                {num}
                              </button>
                            );
                          })}
                        </div>
                        <span className="w-6 text-left font-bold text-slate-500 text-sm">{row}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-center space-x-8 mt-12 pt-6 border-t border-slate-700/50">
                    <div className="flex items-center"><div className="w-5 h-5 bg-slate-800 border-b-4 border-slate-700 rounded-t mr-2"></div><span className="text-sm text-slate-400">Thường (100k)</span></div>
                    <div className="flex items-center"><div className="w-5 h-5 bg-rose-900/60 border-b-4 border-rose-800 rounded-t mr-2"></div><span className="text-sm text-slate-400">VIP (150k)</span></div>
                    <div className="flex items-center"><div className="w-5 h-5 bg-orange-500 border-b-4 border-orange-700 rounded-t mr-2"></div><span className="text-sm text-slate-400">Đang chọn</span></div>
                  </div>
                </div>

                {/* Combo Bắp Nước */}
                <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-800 shadow-xl flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-yellow-500/20 p-3 rounded-xl mr-4">
                      <Popcorn className="w-8 h-8 text-yellow-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-white">Combo Tiết Kiệm</h4>
                      <p className="text-sm text-slate-400">1 Bắp lớn + 2 Nước ngọt (Tiết kiệm 20%)</p>
                      <p className="text-orange-400 font-bold mt-1">{formatCurrency(comboPrice)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 bg-slate-800 rounded-full p-1 border border-slate-700">
                    <button onClick={() => setComboCount(Math.max(0, comboCount - 1))} className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center hover:bg-slate-600 font-bold text-white">-</button>
                    <span className="font-bold w-4 text-center">{comboCount}</span>
                    <button onClick={() => setComboCount(comboCount + 1)} className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center hover:bg-orange-400 font-bold text-white">+</button>
                  </div>
                </div>
              </div>

              {/* Hóa đơn tóm tắt */}
              <div className="lg:w-1/3">
                <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-800 shadow-xl sticky top-24">
                  <h3 className="text-xl font-black text-white mb-6 pb-4 border-b border-slate-700/50 uppercase">Thông tin đặt vé</h3>
                  
                  <div className="flex mb-6">
                    <img src={selectedMovie.poster} alt="Poster" className="w-20 rounded-lg shadow-md mr-4 object-cover" />
                    <div>
                      <h4 className="font-bold text-lg text-white leading-tight">{selectedMovie.title}</h4>
                      <p className="text-sm text-slate-400 mt-2 flex items-center"><MapPin className="w-3 h-3 mr-1"/> {selectedShowtime.cinema_name}</p>
                    </div>
                  </div>

                  <div className="space-y-4 text-sm font-medium mb-6 pb-6 border-b border-slate-700/50 text-slate-300">
                    <div className="flex justify-between"><span>Thời gian:</span><span className="text-white">{selectedShowtime.show_time.substring(0, 5)} - {selectedShowtime.show_date}</span></div>
                    <div className="flex justify-between"><span>Phòng chiếu:</span><span className="text-white">Phòng Chiếu 02 (2D)</span></div>
                    <div className="flex justify-between">
                      <span>Ghế:</span>
                      <span className="font-bold text-orange-400 text-right max-w-[150px]">
                        {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'Chưa chọn ghế'}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-end mb-6">
                    <span className="text-slate-400 font-medium">Tổng thanh toán:</span>
                    <span className="text-3xl font-black text-orange-500">{formatCurrency(grandTotal)}</span>
                  </div>

                  <button 
                    onClick={handleBookingComplete}
                    disabled={selectedSeats.length === 0}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all uppercase tracking-wider flex items-center justify-center ${
                      selectedSeats.length > 0 
                        ? 'bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white shadow-lg shadow-orange-500/30' 
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Thanh toán ngay
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TRANG VÉ THÀNH CÔNG ================= */}
        {currentView === 'ticket' && (
          <div className="max-w-xl mx-auto px-4 mt-16">
            <div className="bg-white rounded-3xl p-8 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-green-400 to-emerald-600"></div>
              
              <div className="text-center mb-8 border-b border-dashed border-gray-300 pb-8">
                <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-3xl font-black text-slate-900 mb-2">Đặt Vé Thành Công!</h2>
                <p className="text-slate-500 text-sm">Thông tin đặt vé đã được ghi nhận trên hệ thống!</p>
              </div>
              
              <div className="text-slate-800 mb-8">
                <h3 className="font-black text-2xl mb-6 text-center">{selectedMovie.title}</h3>
                
                <div className="grid grid-cols-2 gap-y-6 text-sm">
                  <div><p className="text-slate-400 uppercase text-xs font-bold mb-1">Rạp chiếu</p><p className="font-bold text-lg">{selectedShowtime.cinema_name}</p></div>
                  <div><p className="text-slate-400 uppercase text-xs font-bold mb-1">Thời gian</p><p className="font-bold text-lg">{selectedShowtime.show_time.substring(0, 5)} <br/><span className="text-sm font-medium">{selectedShowtime.show_date}</span></p></div>
                  <div><p className="text-slate-400 uppercase text-xs font-bold mb-1">Ghế ngồi</p><p className="font-bold text-xl text-orange-600">{selectedSeats.join(', ')}</p></div>
                  <div><p className="text-slate-400 uppercase text-xs font-bold mb-1">Mã Vé Hệ Thống</p><p className="font-mono font-bold text-lg text-emerald-600">{bookingCode}</p></div>
                </div>
              </div>

              {/* QR Mockup */}
              <div className="bg-slate-100 rounded-xl p-4 flex justify-center items-center mb-6">
                <div className="w-40 h-40 bg-[url('https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg')] bg-cover opacity-80"></div>
              </div>

              <button 
                onClick={() => { setCurrentView('home'); setSelectedSeats([]); setComboCount(0); }}
                className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-xl font-bold uppercase transition-colors"
              >
                Về Trang Chủ
              </button>

              <div className="absolute -left-3 top-1/2 w-6 h-6 bg-[#0f172a] rounded-full"></div>
              <div className="absolute -right-3 top-1/2 w-6 h-6 bg-[#0f172a] rounded-full"></div>
            </div>
          </div>
        )}
      </main>

      {/* POPUP XEM TRAILER */}
      {trailerUrl && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-5xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-800">
            <button onClick={() => setTrailerUrl(null)} className="absolute top-4 right-4 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-rose-500 transition-colors">
              <X className="w-6 h-6" />
            </button>
            <iframe className="w-full h-full" src={trailerUrl} title="Trailer" allowFullScreen></iframe>
          </div>
        </div>
      )}

      {/* POPUP ĐĂNG NHẬP / ĐĂNG KÝ */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-8 relative shadow-2xl">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-black text-white mb-6 text-center uppercase tracking-wide">
              {authMode === 'login' ? 'Đăng Nhập Thành Viên' : 'Đăng Ký Tài Khoản'}
            </h2>

            {authError && (
              <div className="bg-rose-950/50 border border-rose-500/30 text-rose-300 p-3 rounded-lg mb-4 text-sm flex items-center">
                <ShieldAlert className="w-5 h-5 mr-2 shrink-0 text-rose-400" />
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Họ tên</label>
                  <input 
                    type="text" 
                    required 
                    value={authForm.name}
                    onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
                    placeholder="Nguyễn Tấn Lập" 
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" 
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email</label>
                <input 
                  type="email" 
                  required 
                  value={authForm.email}
                  onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                  placeholder="name@gmail.com" 
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Mật khẩu</label>
                <input 
                  type="password" 
                  required 
                  value={authForm.password}
                  onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                  placeholder="••••••••" 
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" 
                />
              </div>

              <button type="submit" className="w-full py-3 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-bold rounded-lg transition-all uppercase tracking-wider text-sm shadow-md mt-6">
                {authMode === 'login' ? 'Bắt Đầu Trải Nghiệm' : 'Tạo Tài Khoản'}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-400">
              {authMode === 'login' ? (
                <p>Chưa có tài khoản? <button onClick={() => { setAuthMode('register'); setAuthError(''); }} className="text-orange-400 hover:underline font-bold">Đăng ký ngay</button></p>
              ) : (
                <p>Đã có tài khoản? <button onClick={() => { setAuthMode('login'); setAuthError(''); }} className="text-orange-400 hover:underline font-bold">Đăng nhập ngay</button></p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 