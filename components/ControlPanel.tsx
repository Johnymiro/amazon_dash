'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { API_BASE } from '@/utils/api';
import { Globe, AlertTriangle } from 'lucide-react';

// ==================== Profile Context ====================

interface Profile {
  profile_id: string;
  country_code: string;
  name: string;
  type: string;
  currency_code?: string;
}

interface ShadowStatus {
  active: boolean;
  session_id?: number;
  days_elapsed?: number;
}

interface ProfileContextType {
  profiles: Profile[];
  currentProfileId: string;
  currentProfile: Profile | null;
  shadowStatus: ShadowStatus;
  loading: boolean;
  switching: boolean;
  error: string | null;
  apiUrl: string;
  switchProfile: (profileId: string) => Promise<void>;
  toggleShadow: () => Promise<void>;
  refreshData: () => void;
  dataVersion: number;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within ProfileProvider');
  }
  return context;
}

const countryFlags: Record<string, string> = {
  DE: '🇩🇪', UK: '🇬🇧', FR: '🇫🇷', IT: '🇮🇹', ES: '🇪🇸',
  NL: '🇳🇱', SE: '🇸🇪', PL: '🇵🇱', BE: '🇧🇪', IE: '🇮🇪',
  AE: '🇦🇪', SA: '🇸🇦', JP: '🇯🇵', AU: '🇦🇺', US: '🇺🇸',
  CA: '🇨🇦', MX: '🇲🇽', BR: '🇧🇷', IN: '🇮🇳', SG: '🇸🇬',
};

// ==================== Profile Provider ====================

interface ProfileProviderProps {
  children: ReactNode;
  apiUrl?: string;
}

export function ProfileProvider({ children, apiUrl = '' }: ProfileProviderProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentProfileId, setCurrentProfileId] = useState<string>('');
  const [shadowStatus, setShadowStatus] = useState<ShadowStatus>({ active: false });
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataVersion, setDataVersion] = useState(0);

  const baseUrl = apiUrl || API_BASE;

  const fetchProfiles = useCallback(async () => {
    try {
      const response = await fetch(`${baseUrl}/amazon/profiles`, { credentials: 'include' });
      const data = await response.json();

      if (data.profiles) {
        setProfiles(data.profiles);
        setCurrentProfileId(data.current_profile_id || '');
      }
      if (data.error) {
        setError(data.error);
      }
    } catch (e) {
      // Silently skip if backend is unreachable
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  const fetchShadowStatus = useCallback(async () => {
    try {
      const response = await fetch(`${baseUrl}/shadow/status`, { credentials: 'include' });
      const data = await response.json();
      setShadowStatus({
        active: data.active || false,
        session_id: data.session_id,
        days_elapsed: data.days_elapsed,
      });
    } catch (e) {
      console.error('Failed to fetch shadow status');
    }
  }, [baseUrl]);

  useEffect(() => {
    fetchProfiles();
    fetchShadowStatus();
  }, [fetchProfiles, fetchShadowStatus]);

  const refreshData = useCallback(() => {
    setDataVersion(v => v + 1);
  }, []);

  const switchProfile = useCallback(async (profileId: string) => {
    if (profileId === currentProfileId || switching) return;

    setSwitching(true);
    setError(null);

    try {
      const response = await fetch(`${baseUrl}/amazon/profile/switch?profile_id=${profileId}`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setCurrentProfileId(profileId);
        setDataVersion(v => v + 1);
      } else {
        setError(data.detail || 'Failed to switch profile');
      }
    } catch (e) {
      setError('Failed to switch profile');
    } finally {
      setSwitching(false);
    }
  }, [baseUrl, currentProfileId, switching]);

  const toggleShadow = useCallback(async () => {
    try {
      if (shadowStatus.active) {
        const response = await fetch(`${baseUrl}/shadow/stop`, { method: 'POST', credentials: 'include' });
        if (response.ok) {
          setShadowStatus({ active: false });
        }
      } else {
        const response = await fetch(`${baseUrl}/shadow/start`, { method: 'POST', credentials: 'include' });
        const data = await response.json();
        if (data.session_id) {
          setShadowStatus({
            active: true,
            session_id: data.session_id,
            days_elapsed: 0,
          });
        }
      }
      setDataVersion(v => v + 1);
    } catch (e) {
      setError('Failed to toggle shadow mode');
    }
  }, [baseUrl, shadowStatus.active]);

  const currentProfile = profiles.find(p => p.profile_id === currentProfileId) || null;

  return (
    <ProfileContext.Provider value={{
      profiles,
      currentProfileId,
      currentProfile,
      shadowStatus,
      loading,
      switching,
      error,
      apiUrl: baseUrl,
      switchProfile,
      toggleShadow,
      refreshData,
      dataVersion,
    }}>
      {children}
    </ProfileContext.Provider>
  );
}

// ==================== Control Panel UI ====================

export default function ControlPanel() {
  const {
    profiles,
    currentProfileId,
    currentProfile,
    shadowStatus,
    loading,
    switching,
    error,
    switchProfile,
    toggleShadow,
  } = useProfile();

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.02] p-4 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">

        {/* Country Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm font-medium">
            <Globe className="h-4 w-4" />
            <span>Country:</span>
          </div>
          <div className="relative">
            <select
              value={currentProfileId}
              onChange={(e) => switchProfile(e.target.value)}
              disabled={loading || switching || profiles.length === 0}
              className="appearance-none h-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 pr-8 text-gray-900 dark:text-white text-sm font-medium focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 focus:border-brand-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-w-[180px]"
            >
              {loading ? (
                <option>Loading...</option>
              ) : profiles.length === 0 ? (
                <option>No profiles</option>
              ) : (
                profiles.map(profile => (
                  <option key={profile.profile_id} value={profile.profile_id}>
                    {countryFlags[profile.country_code] || '🌐'} {profile.country_code} - {profile.name}
                  </option>
                ))
              )}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 dark:text-gray-500">
              {switching ? (
                <div className="animate-spin h-3.5 w-3.5 border-2 border-gray-400 border-t-transparent rounded-full"></div>
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
              )}
            </div>
          </div>
          {currentProfile && (
            <span className="text-theme-xs text-gray-400 dark:text-gray-500 font-medium">
              {currentProfile.currency_code}
            </span>
          )}
        </div>

        {/* Shadow Mode Toggle */}
        <div className="flex items-center gap-3">
          <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">Shadow Mode:</span>
          <button
            onClick={toggleShadow}
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 ${shadowStatus.active
              ? 'bg-success-500'
              : 'bg-gray-700'
              }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-theme-xs transition-transform ${shadowStatus.active ? 'translate-x-8' : 'translate-x-1'
                }`}
            />
          </button>
          <span className={`text-sm font-medium ${shadowStatus.active ? 'text-success-400' : 'text-gray-400 dark:text-gray-500'}`}>
            {shadowStatus.active ? 'ON' : 'OFF'}
          </span>
          {shadowStatus.active && shadowStatus.days_elapsed !== undefined && (
            <span className="text-theme-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md border border-gray-300 dark:border-gray-700">
              Day {shadowStatus.days_elapsed}/14
            </span>
          )}
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          {error ? (
            <span className="text-error-400 text-sm flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" /> {error}
            </span>
          ) : switching ? (
            <span className="text-warning-400 text-sm flex items-center gap-1.5">
              <div className="animate-spin h-3.5 w-3.5 border-2 border-warning-400 border-t-transparent rounded-full"></div>
              Switching...
            </span>
          ) : (
            <span className="text-success-400 text-sm flex items-center gap-1.5">
              <span className="w-2 h-2 bg-success-400 rounded-full animate-pulse" />
              Connected
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
