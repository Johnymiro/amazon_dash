'use client';

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Zap } from 'lucide-react';

function PasswordStrength({ password }: { password: string }) {
    const getStrength = () => {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;
        return strength;
    };

    const strength = getStrength();
    const colors = [
        'bg-error-500',
        'bg-orange-500',
        'bg-warning-500',
        'bg-blue-light-500',
        'bg-success-500',
    ];
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];

    if (!password) return null;

    return (
        <div className="mt-2">
            <div className="flex gap-1 mb-1">
                {[0, 1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < strength ? colors[strength - 1] : 'bg-gray-200 dark:bg-gray-700'
                            }`}
                    />
                ))}
            </div>
            <p className={`text-xs font-medium ${strength >= 3 ? 'text-success-500' : 'text-gray-500 dark:text-gray-400'}`}>
                {labels[strength - 1] || 'Enter password'}
            </p>
        </div>
    );
}

export default function RegisterForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { register } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        if (!/[0-9]/.test(password)) {
            setError('Password must contain at least one number');
            return;
        }

        if (!/[A-Z]/.test(password)) {
            setError('Password must contain at least one uppercase letter');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);

        try {
            await register(email, password);
            router.push('/');
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail;
            if (Array.isArray(errorMessage)) {
                setError(errorMessage[0]?.msg || 'Registration failed');
            } else {
                setError(errorMessage || 'Registration failed');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen w-full bg-white dark:bg-gray-900">
            {/* Left Side - Form */}
            <div className="flex flex-col lg:w-1/2 w-full px-6 sm:px-0">
                <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
                    <div>
                        {/* Header */}
                        <div className="mb-5 sm:mb-8">
                            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                                Create Account
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Enter your details to get started!
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 rounded-lg border border-error-300 bg-error-50 p-4 dark:border-error-500/30 dark:bg-error-500/10">
                                <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-5">
                                {/* Email */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                                        Email <span className="text-error-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder:text-gray-500 dark:focus:border-brand-800"
                                        placeholder="you@example.com"
                                    />
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                                        Password <span className="text-error-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder:text-gray-500 dark:focus:border-brand-800"
                                            placeholder="Min. 8 characters"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
                                        >
                                            {showPassword ? (
                                                <Eye className="h-5 w-5" />
                                            ) : (
                                                <EyeOff className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>
                                    <PasswordStrength password={password} />
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                                        Confirm Password <span className="text-error-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder:text-gray-500 dark:focus:border-brand-800"
                                            placeholder="Re-enter your password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
                                        >
                                            {showConfirmPassword ? (
                                                <Eye className="h-5 w-5" />
                                            ) : (
                                                <EyeOff className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Submit */}
                                <div>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="inline-flex items-center justify-center w-full gap-2 px-5 py-3.5 text-sm font-medium text-white transition-all rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Creating account...
                                            </>
                                        ) : (
                                            'Create Account'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>

                        {/* Footer */}
                        <div className="mt-5">
                            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                                Already have an account?{' '}
                                <Link
                                    href="/login"
                                    className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                                >
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Branding */}
            <div className="lg:w-1/2 w-full h-full bg-brand-950 dark:bg-white/5 lg:grid items-center hidden fixed right-0 top-0 bottom-0">
                <div className="relative flex flex-col items-center justify-center z-1">
                    {/* Grid pattern background */}
                    <div className="absolute inset-0 auth-grid-shape opacity-30"></div>

                    <div className="flex flex-col items-center max-w-xs relative">
                        <div className="text-6xl mb-6">
                            <Zap className="h-16 w-16 text-brand-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-3">Cybernetic Command</h2>
                        <p className="text-center text-gray-400 dark:text-white/60">
                            AI-Powered Amazon PPC Automation Dashboard with Shadow Mode Testing
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
