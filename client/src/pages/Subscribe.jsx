import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import api from '../api';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_dummy');

const Subscribe = () => {
    const [plan, setPlan] = useState('monthly');
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    // Check for "canceled=true" in the URL after Stripe redirection
    useEffect(() => {
        const query = new URLSearchParams(window.location.search);
        if (query.get('canceled')) {
            alert('Checkout canceled. You can try again when you are ready.');
            // Clear the query params
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    const handleSubscribe = async () => {
        if (!user) {
            alert("You must be logged in to subscribe");
            navigate('/login');
            return;
        }

        try {
            // 1. Create a dynamic checkout session on your Express server
            const res = await api.post('/subscriptions/create-checkout-session', { plan });
            
            // 2. Redirect to Stripe Checkout directly via the URL returned from backend
            if (res.data.url) {
                window.location.href = res.data.url;
            } else {
                throw new Error("No checkout URL returned from server.");
            }
        } catch (error) {
            alert('Stripe Initialization Error: ' + (error.response?.data?.error || error.message));
        }
    };

    return (
        <div className="space-y-12 py-10">
            <div className="text-center space-y-4">
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">Choose Your Impact</h1>
                <p className="text-gray-500 text-lg">Every subscription actively funds charity. Select your billing cycle.</p>
            </div>

            <div className="flex justify-center mb-10">
                <div className="bg-gray-200 p-1 rounded-full flex gap-1">
                    <button 
                       onClick={() => setPlan('monthly')} 
                       className={`px-6 py-2 rounded-full font-bold text-sm ${plan === 'monthly' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        Monthly
                    </button>
                    <button 
                       onClick={() => setPlan('yearly')} 
                       className={`px-6 py-2 rounded-full font-bold text-sm flex gap-2 items-center ${plan === 'yearly' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        Yearly <span className="text-[10px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full uppercase tracking-widest">Save 17%</span>
                    </button>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <div className="card space-y-6 flex flex-col items-start bg-gray-50">
                    <div className="w-full">
                        <h3 className="text-xl font-bold text-gray-800">Basic View</h3>
                        <p className="text-gray-500 text-sm mt-1">View draws and list of charities.</p>
                    </div>
                    <div className="text-4xl font-extrabold text-gray-900">Free</div>
                    <ul className="space-y-3 text-gray-600 text-sm w-full font-medium">
                        <li className="flex gap-2">✔ View published draws</li>
                        <li className="flex gap-2">✔ Explore charity directory</li>
                        <li className="flex gap-2 text-gray-400">✖ No active score entry</li>
                        <li className="flex gap-2 text-gray-400">✖ No monthly draw participation</li>
                    </ul>
                    <button className="btn-secondary w-full mt-auto" disabled>Current Plan</button>
                </div>

                <div className="card space-y-6 flex flex-col items-start border-blue-200 ring-2 ring-blue-500 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-widest">Premium</div>
                    <div className="w-full">
                        <h3 className="text-xl font-bold text-gray-900">Impact Subscriber</h3>
                        <p className="text-gray-500 text-sm mt-1">Unlock the draw engine and prizes.</p>
                    </div>
                    <div className="text-4xl font-extrabold text-blue-600">
                        {plan === 'yearly' ? '₹9,900' : '₹999'}
                        <span className="text-lg text-gray-400 font-medium">/{plan === 'yearly' ? 'year' : 'mo'}</span>
                    </div>
                    <ul className="space-y-3 text-gray-700 text-sm w-full font-medium">
                        <li className="flex gap-2 text-blue-800">✔ Automatically contribute min 10% to charity</li>
                        <li className="flex gap-2 text-gray-900">✔ Log up to 5 Stableford scores</li>
                        <li className="flex gap-2 text-gray-900">✔ Guaranteed monthly draw engine entry</li>
                        <li className="flex gap-2 text-emerald-600 font-bold">✔ Win cash prizes from the tiered pool</li>
                    </ul>
                    <button onClick={handleSubscribe} className="btn-primary w-full mt-auto text-lg py-3 shadow border border-blue-700">Subscribe with Stripe</button>
                </div>
            </div>
        </div>
    );
};

export default Subscribe;
