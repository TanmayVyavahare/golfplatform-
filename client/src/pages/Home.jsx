import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Target, Gem } from 'lucide-react';

const Home = () => {
  return (
    <div className="space-y-20 py-10">
      
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center gap-8 justify-between bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="space-y-6 md:w-1/2">
          <div className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">Premium Charity Platform</div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
            Turn Your Scores Into <span className="text-blue-600">Real Impact.</span>
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed">
            The subscription platform that turns your performance ranking into guaranteed monthly charity donations and cash prize draws. No golf clichés. Just impact.
          </p>
          <div className="pt-4">
            <Link to="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold text-lg shadow-md transition-all">Start Your Journey</Link>
          </div>
        </div>
        <div className="md:w-1/2 flex justify-center">
            <img src="https://imgs.search.brave.com/Q7DpARfOEgebtK3T2JTthdTAfLx4Gd5qnAeFjXNlXA8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9jZG4u/cGl4YWJheS5jb20v/cGhvdG8vMjAxNS8w/NS8yOC8xMC8xMi9n/b2xmLTc4NzgyNl82/NDAuanBn" alt="Community Charity" className="w-full max-w-sm border-4 border-white shadow-xl rounded-2xl object-cover" />
        </div>
      </section>

      {/* How It Works - Cards */}
      <section className="space-y-10 text-center">
        <div>
           <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
           <p className="text-gray-500 mt-2">A simple 3-step engine making every score count.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="card space-y-4 hover:shadow-md transition">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center text-blue-600 mx-auto"><Heart size={24} /></div>
            <h3 className="text-xl font-bold">1. Subscribe</h3>
            <p className="text-gray-600">Join the platform. Minimum 10% of your fee goes instantly to your chosen charity.</p>
          </div>
          <div className="card space-y-4 hover:shadow-md transition">
            <div className="bg-amber-100 w-12 h-12 rounded-full flex items-center justify-center text-amber-600 mx-auto"><Target size={24} /></div>
            <h3 className="text-xl font-bold">2. Log Scores</h3>
            <p className="text-gray-600">Keep your 5 most recent Stableford scores active in the system to determine entries.</p>
          </div>
          <div className="card space-y-4 hover:shadow-md transition">
            <div className="bg-emerald-100 w-12 h-12 rounded-full flex items-center justify-center text-emerald-600 mx-auto"><Gem size={24} /></div>
            <h3 className="text-xl font-bold">3. Win Prizes</h3>
            <p className="text-gray-600">Monthly draws match numbers automatically. Win from a tiered shared prize pool.</p>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
