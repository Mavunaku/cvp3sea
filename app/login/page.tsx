'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lock, ShieldCheck, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';

export default function LoginPage() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const router = useRouter();
    const { setUserId, loadFromDatabase } = useStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(false);

        if (password === 'admin123') {
            try {
                // Set cookie for middleware
                document.cookie = "auth-token=true; path=/; max-age=86400";

                // Set userId and load data from Supabase
                // We use a static UUID because the DB expects UUID type, not 'admin' string
                const ADMIN_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
                setUserId(ADMIN_UUID);
                await loadFromDatabase(ADMIN_UUID);

                // Redirect to dashboard
                router.push('/');
            } catch (err) {
                console.error('Failed to load user data:', err);
                setError(true);
                setLoading(false);
            }
        } else {
            setError(true);
            setLoading(false);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const x = (clientX / window.innerWidth - 0.5) * 20;
        const y = (clientY / window.innerHeight - 0.5) * 20;
        setMousePos({ x, y });
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4 font-inter relative overflow-hidden bg-black"
            onMouseMove={handleMouseMove}
        >
            {/* Interactive Parallax Background Image */}
            <div
                className="absolute inset-0 z-0 transition-transform duration-75 agreement-out scale-110"
                style={{
                    backgroundImage: 'url("https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=2070&auto=format&fit=crop")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    transform: `translate(${mousePos.x}px, ${mousePos.y}px) scale(1.1)`,
                }}
            >
                {/* Luxury Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#1b4332]/40 via-black/20 to-black/60" />
            </div>

            <div className="w-full max-w-md z-10 animate-in fade-in zoom-in-95 duration-1000">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2.5rem] bg-white/10 backdrop-blur-md border border-white/20 text-white mb-8 shadow-2xl ring-8 ring-white/5">
                        <Lock className="h-12 w-12" />
                    </div>
                    <h1 className="text-5xl font-extrabold text-white tracking-tighter mb-2 drop-shadow-lg">Tax Ledger</h1>
                    <div className="inline-block px-4 py-1.5 rounded-full bg-[#2a9d8f]/20 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-[0.25em] border border-white/10">
                        Administrative Access Only
                    </div>
                </div>

                <Card className="border-white/20 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] bg-white/10 backdrop-blur-[60px] rounded-[2.5rem] ring-1 ring-white/20 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />

                    <CardHeader className="text-center pt-8 pb-2 relative z-10">
                        <CardTitle className="text-3xl font-black text-white tracking-tight">System Login</CardTitle>
                        <CardDescription className="text-white/40 font-semibold text-sm">Encrypted Administrative Gateway</CardDescription>
                    </CardHeader>

                    <CardContent className="pt-6 pb-10 relative z-10">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[11px] font-bold text-white/50 uppercase tracking-widest px-1">Access Key</label>
                                <div className="relative group">
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        autoFocus
                                        className={cn(
                                            "w-full px-6 py-5 rounded-2xl border bg-white/5 text-white placeholder:text-white/10 outline-none transition-all duration-500",
                                            "focus:ring-[12px] focus:ring-[#2a9d8f]/20 focus:border-[#2a9d8f] focus:bg-white/10 shadow-inner",
                                            error ? "border-red-500 bg-red-500/10" : "border-white/10 group-hover:border-white/30"
                                        )}
                                    />
                                    <ShieldCheck className={cn(
                                        "absolute right-6 top-5.5 h-6 w-6 transition-all duration-500",
                                        password.length > 0 ? "text-[#2a9d8f] scale-110" : "text-white/10 scale-100"
                                    )} />
                                </div>
                                {error && (
                                    <p className="text-[11px] text-red-400 font-bold flex items-center gap-2 px-1 animate-in slide-in-from-top-1">
                                        <AlertCircle className="h-4 w-4" />
                                        Access Denied. Verification Required.
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={cn(
                                    "w-full py-5 rounded-2xl bg-[#2a9d8f] text-white font-black text-lg tracking-tight shadow-[0_20px_40px_-10px_rgba(42,157,143,0.3)]",
                                    "hover:bg-[#1a7a6e] hover:shadow-[0_25px_50px_-12px_rgba(26,122,110,0.5)] hover:-translate-y-1 active:scale-[0.97] transition-all duration-500 disabled:opacity-50",
                                    "flex items-center justify-center gap-3",
                                    loading && "cursor-wait"
                                )}
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Verifying...</span>
                                    </>
                                ) : "Enter Secure Vault"}
                            </button>
                        </form>

                        <div className="mt-10 pt-8 border-t border-white/5 text-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] text-[9px] uppercase tracking-[0.3em] text-white/30 font-black">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#2a9d8f] animate-pulse" />
                                Secure Session Active
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <p className="text-center mt-12 text-[11px] text-white/20 font-bold tracking-widest">
                    &copy; 2026 CVP PROPERTIES 4.0 BBKEEPING PROJECT. ALL RIGHTS RESERVED.
                </p>
            </div>
        </div>
    );
}
