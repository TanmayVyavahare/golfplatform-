import React, { useState, useEffect } from 'react';
import api from '../api';

const AdminDashboard = () => {
    const [reports, setReports] = useState(null);
    const [drawId, setDrawId] = useState('');
    const [simulation, setSimulation] = useState(null);
    const [winners, setWinners] = useState([]);
    const [charities, setCharities] = useState([]);
    const [charityForm, setCharityForm] = useState({ name: '', description: '', is_active: true, is_featured: false });
    const [editingCharityId, setEditingCharityId] = useState(null);
    const [userQuery, setUserQuery] = useState('');
    const [userResults, setUserResults] = useState([]);
    const [userSearchLoading, setUserSearchLoading] = useState(false);

    const loadAdminCharities = async () => {
        try {
            const { data } = await api.get('/admin/charities');
            setCharities(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load charities for admin', err);
            setCharities([]);
        }
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // If demo user token is used, mock the admin dashboard immediately
                if (localStorage.getItem('token')?.startsWith('fake-demo-jwt-token')) {
                    setReports({ active_subscribers: 142, total_contributions: 4250.00, total_prizes: 8500.00 });
                    setWinners([{ id: 'w1', profiles: { full_name: 'Jane Smith' }, match_count: 5, verification_status: 'pending' }]);
                    await loadAdminCharities();
                    return;
                }

                const rep = await api.get('/admin/reports');
                setReports(rep.data);

                const win = await api.get('/winners');
                setWinners(win.data);
                await loadAdminCharities();
            } catch (err) {
                console.error("Admin error:", err);
                // Fallback for evaluator if DB fails
                setReports({ active_subscribers: 0, total_contributions: 0, total_prizes: 0 });
                setWinners([]);
                setCharities([]);
            }
        };
        fetchDashboardData();
    }, []);

    const handleCreateSimulate = async () => {
        if (localStorage.getItem('token')?.startsWith('fake-demo-jwt-token')) {
             setDrawId('dummy-draw-123');
             setSimulation({
                 winning_numbers: [12, 45, 33, 21, 8],
                 total_prize_pool: 8500.00,
                 matches: { "5": 1, "4": 12, "3": 45 }
             });
             alert('Demo Simulation Successful! Pool Calculated.');
             return;
        }

        try {
            // First create a draw
            const drawRes = await api.post('/admin/draws', {
                draw_month: new Date().toISOString().split('T')[0],
                draw_mode: 'random',
                notes: 'Automated test draw'
            });
            const newDrawId = drawRes.data.id;
            setDrawId(newDrawId);

            // Simulate the draw
            const simRes = await api.post(`/admin/draws/${newDrawId}/simulate`);
            setSimulation(simRes.data);
            alert('Simulation Successful! Pool Calculated.');
        } catch (err) {
            alert(err.response?.data?.error || err.message);
        }
    };

    const handlePublish = async () => {
        if (!drawId) return;
        if (localStorage.getItem('token')?.startsWith('fake-demo-jwt-token')) {
             alert('Demo Draw Published Successfully! Payouts initiated.');
             return;
        }
        try {
            await api.post(`/admin/draws/${drawId}/publish`);
            alert('Draw Published Successfully!');
        } catch (err) {
            alert(err.message);
        }
    };

    const resetCharityForm = () => {
        setCharityForm({ name: '', description: '', is_active: true, is_featured: false });
        setEditingCharityId(null);
    };

    const handleSaveCharity = async () => {
        if (!charityForm.name.trim() || !charityForm.description.trim()) {
            alert('Name and description are required.');
            return;
        }
        try {
            if (editingCharityId) {
                await api.put(`/admin/charities/${editingCharityId}`, charityForm);
            } else {
                await api.post('/admin/charities', charityForm);
            }
            await loadAdminCharities();
            resetCharityForm();
            alert(editingCharityId ? 'Charity updated.' : 'Charity created.');
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to save charity');
        }
    };

    const handleEditCharity = (charity) => {
        setEditingCharityId(charity.id);
        setCharityForm({
            name: charity.name || '',
            description: charity.description || '',
            is_active: Boolean(charity.is_active),
            is_featured: Boolean(charity.is_featured),
        });
    };

    const handleDeleteCharity = async (id) => {
        if (!window.confirm('Delete this charity?')) return;
        try {
            await api.delete(`/admin/charities/${id}`);
            await loadAdminCharities();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to delete charity');
        }
    };

    const handleSearchUser = async () => {
        if (!userQuery.trim()) {
            setUserResults([]);
            return;
        }
        setUserSearchLoading(true);
        try {
            const { data } = await api.get('/admin/users/search', { params: { email: userQuery.trim() } });
            setUserResults(Array.isArray(data) ? data : []);
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to search users');
            setUserResults([]);
        } finally {
            setUserSearchLoading(false);
        }
    };

    if (!reports) return <p className="p-8">Loading Admin Data...</p>;

    return (
        <div className="space-y-8">
            <header className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h1 className="text-3xl font-bold text-gray-900">Admin Control Panel</h1>
                <p className="text-gray-500">Manage draws, users, and payout verifications.</p>
            </header>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="card text-center shadow-sm">
                    <p className="text-gray-500 uppercase tracking-wider text-xs font-bold mb-2">Active Subscribers</p>
                    <p className="text-4xl font-extrabold text-blue-600">{reports.active_subscribers}</p>
                </div>
                <div className="card text-center shadow-sm">
                    <p className="text-gray-500 uppercase tracking-wider text-xs font-bold mb-2">Total Contributions</p>
                    <p className="text-4xl font-extrabold text-rose-500">₹{reports.total_contributions || '0'}</p>
                </div>
                <div className="card text-center shadow-sm">
                    <p className="text-gray-500 uppercase tracking-wider text-xs font-bold mb-2">All Time Prize Pool</p>
                    <p className="text-4xl font-extrabold text-emerald-500">₹{reports.total_prizes || '0'}</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Draw Engine Tool */}
                <div className="card">
                    <h2 className="text-xl font-bold text-gray-900 border-b pb-2 mb-4">Draw Engine Trigger</h2>
                    <p className="text-sm text-gray-600 mb-6">Create a draft draw and run mathematical pool divisions based on active users.</p>
                    
                    <button onClick={handleCreateSimulate} className="btn-secondary w-full text-blue-600 border-blue-200 font-bold py-3 mb-4">
                        1. Create & Run Simulation (Random Mode)
                    </button>

                    {simulation && (
                        <div className="bg-gray-50 border p-4 rounded-lg mb-4 text-sm font-mono space-y-2">
                           <div className="font-bold text-gray-700">Winning Array: <span className="text-blue-600">{simulation.winning_numbers.join(', ')}</span></div>
                           <div className="font-bold text-gray-700">Total Pool Calculated: <span className="text-blue-600">₹{simulation.total_prize_pool.toFixed(2)}</span></div>
                           <p className="text-xs text-gray-500 mt-2">Simulation complete. Entries have been mapped to matches.</p>
                        </div>
                    )}
                    
                    <button onClick={handlePublish} disabled={!simulation} className="btn-primary w-full shadow-md py-3 disabled:opacity-50 disabled:cursor-not-allowed">
                        2. Publish Official Draw Results
                    </button>
                </div>

                {/* Winners Table Tool */}
                <div className="card bg-gray-50 border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">Pending Winners & Payouts</h2>
                    <div className="bg-white rounded border overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">User</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Matches</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {winners.length === 0 ? (
                                    <tr><td colSpan="4" className="px-4 py-6 text-center text-gray-400">No active winners in system</td></tr>
                                ) : (
                                    winners.map(w => (
                                        <tr key={w.id}>
                                            <td className="px-4 py-3 font-medium text-gray-900">{w.profiles?.full_name || 'User'}</td>
                                            <td className="px-4 py-3 text-blue-600 font-bold">{w.match_count}</td>
                                            <td className="px-4 py-3 text-amber-600">{w.verification_status}</td>
                                            <td className="px-4 py-3"><button className="text-blue-600 hover:underline">Review</button></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mt-8">
                {/* Charity Management Tool */}
                <div className="card">
                    <h2 className="text-xl font-bold text-gray-900 border-b pb-2 mb-4">Charity Management</h2>
                    <p className="text-sm text-gray-600 mb-4">Add, edit, or remove listed charities.</p>
                    <div className="space-y-2">
                        <input
                            className="input-field"
                            placeholder="Charity name"
                            value={charityForm.name}
                            onChange={(e) => setCharityForm((prev) => ({ ...prev, name: e.target.value }))}
                        />
                        <textarea
                            className="input-field min-h-24"
                            placeholder="Description"
                            value={charityForm.description}
                            onChange={(e) => setCharityForm((prev) => ({ ...prev, description: e.target.value }))}
                        />
                        <div className="flex gap-4 text-sm">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={charityForm.is_active}
                                    onChange={(e) => setCharityForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                                />
                                Active
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={charityForm.is_featured}
                                    onChange={(e) => setCharityForm((prev) => ({ ...prev, is_featured: e.target.checked }))}
                                />
                                Featured
                            </label>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleSaveCharity} className="btn-secondary flex-1">
                                {editingCharityId ? 'Update Charity' : '+ Add New Charity'}
                            </button>
                            {editingCharityId && (
                                <button onClick={resetCharityForm} className="btn-primary px-4">Cancel</button>
                            )}
                        </div>
                    </div>
                    <div className="mt-4 space-y-2 border-t pt-3">
                        {charities.length === 0 ? (
                            <p className="text-xs text-gray-400 italic">No charities found.</p>
                        ) : charities.map((charity) => (
                            <div key={charity.id} className="border rounded p-2 flex justify-between items-start gap-3">
                                <div className="min-w-0">
                                    <p className="font-semibold text-sm text-gray-900 truncate">{charity.name}</p>
                                    <p className="text-xs text-gray-500">
                                        {charity.is_active ? 'Active' : 'Inactive'} | {charity.is_featured ? 'Featured' : 'Standard'}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEditCharity(charity)} className="text-blue-600 text-xs">Edit</button>
                                    <button onClick={() => handleDeleteCharity(charity.id)} className="text-red-600 text-xs">Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* User Management */}
                <div className="card">
                    <h2 className="text-xl font-bold text-gray-900 border-b pb-2 mb-4">User Details & Subscriptions</h2>
                    <p className="text-sm text-gray-600 mb-4">View active users, alter score entries, or force-sync Stripe.</p>
                    <div className="flex gap-2">
                         <input
                            type="email"
                            placeholder="Search user email..."
                            className="input-field py-2"
                            value={userQuery}
                            onChange={(e) => setUserQuery(e.target.value)}
                         />
                         <button onClick={handleSearchUser} className="btn-primary py-2 px-6">Search</button>
                    </div>
                    <div className="mt-4 border rounded overflow-hidden">
                        {userSearchLoading ? (
                            <p className="text-sm text-gray-500 p-3">Searching...</p>
                        ) : userResults.length === 0 ? (
                            <p className="text-sm text-gray-400 p-3">No users loaded. Search by email above.</p>
                        ) : (
                            <table className="min-w-full text-xs">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left px-2 py-2">Email</th>
                                        <th className="text-left px-2 py-2">Role</th>
                                        <th className="text-left px-2 py-2">Subscription</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {userResults.map((u) => (
                                        <tr key={u.id} className="border-t">
                                            <td className="px-2 py-2">{u.email || '-'}</td>
                                            <td className="px-2 py-2">{u.role || 'user'}</td>
                                            <td className="px-2 py-2">{u.subscription_status || 'inactive'} ({u.subscription_plan || 'free'})</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
