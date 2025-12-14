import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col font-sans">
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 text-2xl font-bold tracking-tighter">
          <span className="text-3xl">♟️</span>
          <span>ChessOpenings</span>
        </div>
        <div className="flex gap-4">
          <Link to="/login" className="px-4 py-2 hover:text-blue-300 transition-colors">Sign In</Link>
          <Link to="/signup" className="px-5 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-all">Get Started</Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          Master Your Repertoire.
        </h1>
        <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mb-12 leading-relaxed">
          Build, visualize, and memorize your chess openings. A simple, distraction-free tool for serious improvement.
        </p>

        <div className="flex flex-col sm:flex-row gap-6">
          <Link 
            to="/signup" 
            className="px-8 py-4 bg-white text-slate-900 rounded-xl font-bold text-lg hover:bg-gray-100 transition-transform hover:scale-105 shadow-xl"
          >
            Create Free Account
          </Link>
          <Link 
            to="/dashboard?mode=guest" 
            className="px-8 py-4 bg-slate-700/50 backdrop-blur-sm border border-slate-600 rounded-xl font-bold text-lg hover:bg-slate-700 transition-all hover:border-slate-500"
          >
            Try as Guest
          </Link>
        </div>
        
        <p className="mt-8 text-sm text-gray-500">
          No credit card required. Guest mode allows viewing public openings.
        </p>
      </main>

      <footer className="p-8 text-center text-gray-600 border-t border-slate-800/50">
        © 2025 Chess Openings Tracker.
      </footer>
    </div>
  );
};

export default LandingPage;