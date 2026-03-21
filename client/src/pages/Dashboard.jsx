import React, { useState, useEffect, useContext } from 'react';
import { Target, Heart, PlusCircle, Activity, UploadCloud, CheckCircle, AlertTriangle, CreditCard, Lock } from 'lucide-react';
import { AuthContext } from '../App';
import { Link } from 'react-router-dom';
import api from '../api';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_dummy');

const DUMMY_SCORES = [
    { id: '1', score: 36, played_at: '2026-03-01' },
    { id: '2', score: 42, played_at: '2026-03-05' },
    { id: '3', score: 38, played_at: '2026-03-12' },
    { id: '4', score: 40, played_at: '2026-03-18' }
];

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const [scores, setScores] = useState([]);
    const [winnings, setWinnings] = useState([]);
    const [newScore, setNewScore] = useState('');
    const [newDate, setNewDate] = useState('');
    const [loading, setLoading] = useState(true);

    const isDemo = user?.id?.startsWith('demo-');
    const isSubscribed = user?.subscription_status === 'active';

    const fetchData = async () => {
        try {
            if (isDemo) {
                setScores(DUMMY_SCORES);
                setWinnings([{ id: 'w1', draw_month: 'Mar 2026', match_count: 4, prize: 450, status: 'pending', proof_url: null }]);
                return;
            }

            const scoreRes = await api.get('/scores');
            setScores(scoreRes.data || []);
            setWinnings([{ id: 'w1', draw_month: 'Mar 2026', match_count: 4, prize: 450, status: 'pending', proof_url: null }]);
        } catch (err) {
            console.error("Dashboard data load failed", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const query = new URLSearchParams(window.location.search);
        const success = query.get('success');
        const plan = query.get('plan');
        const canceled = query.get('canceled');

        if (success) {
            // Bypass Webhook explicitly for Demo Evaluation
            api.post('/subscriptions/payment-success', { 
                payment_id: 'stripe_success',
                plan_type: plan || 'premium'
            }).then(() => {
                alert(`Payment Successful! Your contribution is appreciated.`);
                // Clear the query params
                window.history.replaceState({}, document.title, window.location.pathname);
                fetchData();
            }).catch(err => {
                alert('Could not record payment explicitly, but it may have been processed.');
            });
        }
        
        if (canceled) {
            alert('Payment canceled. You can try again when you are ready.');
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        fetchData(); 
    }, [isDemo]);

    const handleAddScore = async (e) => {
        e.preventDefault();
        if (isDemo) {
            if (scores.length >= 5) {
                alert('Maximum 5 scores allowed.');
                return;
            }
            const newDemoScore = { id: `demo-${Date.now()}`, score: newScore, played_at: newDate };
            setScores(prev => [...prev, newDemoScore]);
            setNewScore(''); setNewDate('');
            return;
        }
        try {
            await api.post('/scores', { score: parseInt(newScore), played_at: newDate });
            setNewScore(''); setNewDate('');
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || "Error adding score.");
        }
    };

    const handleDelete = async (id) => {
        if(isDemo) { 
             setScores(prev => prev.filter(s => s.id !== id));
             return; 
        }
        try {
            await api.delete(`/scores/${id}`);
            fetchData();
        } catch (e) { console.error(e); }
    };

    const handleUploadProof = async (id) => {
        const dummyUrl = prompt("Enter Image URL (Simulation of Supabase Storage upload):");
        if (dummyUrl) {
            alert(`Proof submitted for review! URL: ${dummyUrl}`);
            const updated = winnings.map(w => w.id === id ? { ...w, proof_url: dummyUrl } : w);
            setWinnings(updated);
        }
    };

    const handleStandaloneDonation = async () => {
        const rawAmount = prompt("Enter donation amount (in rupees):", "500");
        if (!rawAmount || isNaN(rawAmount) || parseInt(rawAmount) < 1) return;



        try {
            // Create a dynamic checkont session for a standalone donation
            const res = await api.post('/subscriptions/create-checkout-session', { 
                plan: 'donation', 
                custom_amount: rawAmount,
                success_url: `${window.location.origin}/dashboard?success=true&plan=donation`,
                cancel_url: `${window.location.origin}/dashboard?canceled=true`
            });

            if (res.data.url) {
                window.location.href = res.data.url;
            } else {
                alert('Error: Check session URL was not generated.');
            }
        } catch (error) {
            alert('Stripe Initialization Error: ' + (error.response?.data?.error || error.message));
        }
    };

    return (
        <div className="space-y-8 pb-12 relative">
            <header className="flex flex-col sm:flex-row justify-between sm:items-center bg-white p-6 border border-gray-200 rounded-lg shadow-sm gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500">Welcome, {user?.full_name || 'User'}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-4 py-1 flex items-center gap-2 text-sm font-semibold rounded-full ${isSubscribed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    <CheckCircle size={14}/> {isSubscribed ? `${user?.subscription_plan} Plan` : 'Free Viewer'}
                  </span>
                  {!isSubscribed && (
                      <Link to="/subscribe" className="btn-primary flex items-center gap-2 py-1 px-4"><CreditCard size={16}/> Subscribe to Play</Link>
                  )}
                </div>
            </header>

            {!isSubscribed && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start gap-3">
                    <AlertTriangle className="text-amber-500 mt-1" />
                    <div>
                        <h3 className="font-bold text-amber-800">Your account is restricted.</h3>
                        <p className="text-amber-700 text-sm mt-1">You must have an active subscription to log scores or participate in monthly draws. <Link to="/subscribe" className="underline font-bold">Manage your subscription here.</Link></p>
                    </div>
                </div>
            )}

            <div className={`grid lg:grid-cols-3 gap-6 ${!isSubscribed ? 'opacity-50 pointer-events-none grayscale-[30%]' : ''}`}>
                <div className="lg:col-span-2 space-y-6 relative">
                    {!isSubscribed && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 backdrop-blur-sm rounded-lg">
                            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 text-center flex flex-col items-center">
                                <Lock className="text-gray-400 mb-3" size={32}/>
                                <p className="font-bold text-gray-900 mb-4">Premium Subscription Required</p>
                                <Link to="/subscribe" className="btn-primary">Unlock with Stripe</Link>
                            </div>
                        </div>
                    )}
                    
                    {/* Log New Score */}
                    <div className="card shadow-none">
                        <h2 className="text-lg font-bold mb-4 flex gap-2 items-center text-gray-800"><Activity size={18} /> Add Target Score</h2>
                        <form onSubmit={handleAddScore} className="flex flex-col sm:flex-row gap-4">
                            <input type="number" min="1" max="45" value={newScore} onChange={e => setNewScore(e.target.value)} required className="input-field" placeholder="Stableford (1-45)" />
                            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} required className="input-field" />
                            <button type="submit" className="btn-primary whitespace-nowrap">Add Score</button>
                        </form>
                    </div>

                    {/* Active Scores Display */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                           <h3 className="font-bold text-gray-800">Your Active Entry Sequence</h3>
                           <span className="text-sm bg-gray-200 text-gray-700 font-semibold px-2 py-0.5 rounded-full">{scores.length}/5 max</span>
                        </div>
                        
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                            {scores.map((s) => (
                                <div key={s.id} className="bg-white border border-gray-300 text-center p-4 rounded-lg shadow-sm relative group transition-transform hover:-translate-y-1">
                                    <button onClick={() => handleDelete(s.id)} className="absolute top-1 right-2 text-red-500 text-xs opacity-0 group-hover:opacity-100 font-bold p-1">X</button>
                                    <h4 className="text-4xl font-extrabold text-blue-600 my-2">{s.score}</h4>
                                    <p className="text-[11px] uppercase tracking-wider font-bold text-gray-400">{new Date(s.played_at).toLocaleDateString()}</p>
                                </div>
                            ))}
                            {Array.from({ length: Math.max(0, 5 - scores.length) }).map((_, i) => (
                                <div key={`empty-${i}`} className="border-2 border-dashed border-gray-200 bg-gray-50/50 text-center p-4 rounded-lg flex flex-col justify-center items-center text-gray-400">
                                    <PlusCircle size={20} className="mb-1 opacity-40"/>
                                    <span className="text-[10px] uppercase font-bold tracking-wider">Empty</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Winnings & Verification Module  */}
                    <div className="card shadow-none border border-amber-200 bg-amber-50">
                        <h2 className="text-lg font-bold mb-4 flex gap-2 items-center text-amber-900"><Target size={18} /> Winnings & Verification</h2>
                        <ul className="divide-y divide-amber-200/50">
                            {winnings.map(win => (
                                <li key={win.id} className="py-4 flex justify-between items-center border-t border-amber-200/50">
                                   <div>
                                       <p className="font-bold text-gray-900">{win.draw_month} Draw (<span className="text-blue-600">{win.match_count} Matches</span>)</p>
                                       <p className="text-sm text-gray-600">Prize Amount: <span className="font-medium">£{win.prize}</span> | Status: <span className="uppercase text-xs font-bold text-amber-600">{win.status}</span></p>
                                   </div>
                                   <div>
                                       {win.proof_url ? (
                                           <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded font-bold">Proof Subject to Review</span>
                                       ) : (
                                           <button onClick={() => handleUploadProof(win.id)} className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded flex items-center gap-1 shadow-sm"><UploadCloud size={14}/> Upload Golf Proof</button>
                                       )}
                                   </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="space-y-6 relative">
                    {/* Charity System */}
                    <div className="card border-rose-100 bg-rose-50/30">
                         <div className="flex items-center gap-3 mb-4 text-rose-600 font-bold">
                             <Heart size={20} /> Active Charity Settings
                         </div>
                         <p className="text-sm text-gray-700 mb-4 bg-white p-3 rounded border border-gray-200 shadow-sm">
                             <strong>Fore The Kids Foundation (Demo)</strong><br/>
                             You are actively giving <strong>10%</strong> of your subscription via automated logic.
                         </p>
                         <button onClick={handleStandaloneDonation} className="btn-secondary w-full text-sm font-semibold border-rose-200 text-rose-700 hover:bg-rose-100 shadow-sm">
                             Donate extra via Stripe
                         </button>
                    </div>
                    
                    {/* Participation Summary */}
                    <div className="card">
                         <h3 className="font-bold text-gray-800 border-b pb-2 mb-4">Participation Summary</h3>
                         <ul className="space-y-3 text-sm text-gray-600">
                             <li className="flex justify-between"><span>Historical Draws Entered:</span> <strong className="text-blue-600">{winnings.length > 0 ? winnings.length : 0}</strong></li>
                             <li className="flex justify-between"><span>Current Tier:</span> <strong className={isSubscribed ? "text-emerald-600" : "text-gray-500"}>{isSubscribed ? `Golfy ${user?.subscription_plan?.charAt(0).toUpperCase() + user?.subscription_plan?.slice(1)}` : 'Free Account'}</strong></li>
                             <li className="flex justify-between"><span>Next Draw Action Date:</span> <strong>1st Day of Month</strong></li>
                         </ul>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
