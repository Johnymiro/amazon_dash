'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { API_BASE } from '@/utils/api';

// ==================== Profile Context ====================
// Provides global state for the selected profile across all components

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
  dataVersion: number; // Increments when data should refresh
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within ProfileProvider');
  }
  return context;
}

// Country flag emojis
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
      setError('Failed to load profiles');
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
        // Trigger data refresh in all consuming components
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
      // Refresh data after toggle
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
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-4 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">

        {/* Country Selector */}
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-sm font-medium">🌍 Country:</span>
          <div className="relative">
            <select
              value={currentProfileId}
              onChange={(e) => switchProfile(e.target.value)}
              disabled={loading || switching || profiles.length === 0}
              className="appearance-none bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 pr-8 text-white font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-w-[180px]"
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
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              {switching ? '⏳' : '▼'}
            </div>
          </div>
          {currentProfile && (
            <span className="text-xs text-slate-500">
              {currentProfile.currency_code}
            </span>
          )}
        </div>

        {/* Shadow Mode Toggle */}
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-sm font-medium">Shadow Mode:</span>
          <button
            onClick={toggleShadow}
            className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${shadowStatus.active
              ? 'bg-gradient-to-r from-green-600 to-green-500'
              : 'bg-slate-700'
              }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${shadowStatus.active ? 'translate-x-9' : 'translate-x-1'
                }`}
            />
          </button>
          <span className={`text-sm font-medium ${shadowStatus.active ? 'text-green-400' : 'text-slate-500'}`}>
            {shadowStatus.active ? '● ON' : '○ OFF'}
          </span>
          {shadowStatus.active && shadowStatus.days_elapsed !== undefined && (
            <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">
              Day {shadowStatus.days_elapsed}/14
            </span>
          )}
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          {error ? (
            <span className="text-red-400 text-sm">⚠️ {error}</span>
          ) : switching ? (
            <span className="text-yellow-400 text-sm flex items-center gap-1">
              <span className="animate-spin">⏳</span>
              Switching...
            </span>
          ) : (
            <span className="text-green-400 text-sm flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Connected
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
