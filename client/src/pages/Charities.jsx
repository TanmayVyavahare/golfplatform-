import React, { useState, useEffect } from 'react';
import { Heart, Search, Calendar } from 'lucide-react';
import api from '../api';

const DUMMY_CHARITIES = [
    { id: '1', name: 'Fore The Kids Foundation (Demo)', description: 'Providing youth programs and mentorship by using the rules of the game to teach life skills. Every subscription actively funds community youth outreach.', is_featured: true, total_contributions: 420.50 },
    { id: '2', name: 'Green Drives Initiative (Demo)', description: 'Dedicated to planting trees and maintaining ecological conservation across global community parks.', is_featured: false, total_contributions: 115.00 },
    { id: '3', name: 'Golfers Against Hunger (Demo)', description: 'A global initiative pooling resources to support local food banks and end hunger in underprivileged neighborhoods.', is_featured: false, total_contributions: 890.25 }
];

const Charities = () => {
    const [charities, setCharities] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/charities')
           .then(res => {
               if(res.data && res.data.length > 0) setCharities(res.data);
               else setCharities(DUMMY_CHARITIES);
           })
           .catch(() => setCharities(DUMMY_CHARITIES))
           .finally(() => setLoading(false));
    }, []);

    const filtered = charities.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-10 py-8">
            <header className="text-center space-y-4 max-w-2xl mx-auto">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center text-blue-600 mx-auto mb-6"><Heart size={32}/></div>
                <h1 className="text-4xl font-extrabold text-gray-900">Supported Causes</h1>
                <p className="text-gray-500 text-lg">Every subscription mathematically guarantees funding for these charities. Minimum 10% is routed directly to them.</p>
                
                <div className="relative pt-6">
                    <Search className="absolute left-4 top-9 text-gray-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search for charities, missions, or events..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field pl-12 py-3 shadow-sm border-gray-300"
                    />
                </div>
            </header>

            {loading ? (
                <p className="text-center text-gray-500">Loading Directory...</p>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filtered.map(charity => (
                        <div key={charity.id} className="card flex flex-col hover:border-blue-300 transition-colors cursor-pointer group">
                            {charity.is_featured && <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded inline-block w-fit mb-3">Featured Partner</span>}
                            <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{charity.name}</h2>
                            <p className="text-gray-500 text-sm mt-3 flex-1">{charity.description}</p>
                            
                            <div className="mt-6 pt-4 border-t border-gray-100 text-sm font-medium text-gray-700">
                                <span className="block text-xs uppercase tracking-wider text-gray-400 mb-1">Total Contributions Generated</span>
                                <span className="text-emerald-600 font-extrabold text-lg">£{charity.total_contributions || '0'}</span>
                            </div>
                            
                            <div className="mt-4 bg-gray-50 border rounded p-3">
                                <span className="text-xs uppercase font-bold text-gray-500 flex items-center gap-1 mb-2"><Calendar size={12}/> Upcoming Outreach</span>
                                <p className="text-xs text-gray-600 italic">No public events currently scheduled for this quarter. Subscription pools remain active.</p>
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && <p className="text-gray-500 text-center col-span-3">No charities found matching your search.</p>}
                </div>
            )}
        </div>
    );
};

export default Charities;
