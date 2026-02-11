'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { Zap } from 'lucide-react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="text-center animate-fade-in">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-brand-500/10 mb-4">
                        <Zap className="h-8 w-8 text-brand-400 animate-pulse" />
                    </div>
                    <p className="text-gray-400 font-medium text-sm">Authenticating...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return <>{children}</>;
}
