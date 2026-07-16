import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';

// Types
export interface Medicine {
  id: string;
  name: string;
  expiration_date: string;
  quantity: number;
  category: string | null;
  description: string | null;
  notes: string | null;
  inventory_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Inventory {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
  created_at: string;
}

export interface ActiveMedication {
  id: string;
  medicine_id: string;
  dosage: string;
  frequency: string;
  times_of_day: string[];
  end_date: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Profile {
  full_name: string | null;
  age: number | null;
  gender: string | null;
  avatar_url: string | null;
  notify_expired: boolean;
  notify_expiring_soon: boolean;
  notify_expiring_days: number;
  notify_scheduled: boolean;
}

export interface Illness {
  id: string;
  name: string;
  created_at: string;
}

// Local storage helpers
const LOCAL_KEYS = {
  medicines: 'medtrack_medicines',
  inventories: 'medtrack_inventories',
  activeMedications: 'medtrack_active_medications',
  profile: 'medtrack_profile',
  illnesses: 'medtrack_illnesses',
};

function generateId(): string {
  return 'local_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function getLocalData(key: string): any {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }
  return null;
}

function setLocalData(key: string, data: any): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(data));
  }
}

// Storage Context
interface StorageContextType {
  medicines: Medicine[];
  inventories: Inventory[];
  activeMedications: ActiveMedication[];
  profile: Profile | null;
  illnesses: Illness[];
  loading: boolean;
  isLocal: boolean;
  refresh: () => Promise<void>;
  addMedicine: (medicine: Omit<Medicine, 'id' | 'created_at' | 'updated_at'>) => Promise<Medicine | null>;
  updateMedicine: (id: string, updates: Partial<Medicine>) => Promise<boolean>;
  deleteMedicine: (id: string) => Promise<boolean>;
  addInventory: (name: string, icon: string) => Promise<Inventory | null>;
  updateInventory: (id: string, updates: Partial<Inventory>) => Promise<boolean>;
  deleteInventory: (id: string) => Promise<boolean>;
  updateInventoriesOrder: (orderedIds: string[]) => Promise<boolean>;
  addActiveMedication: (med: Omit<ActiveMedication, 'id' | 'created_at'>) => Promise<ActiveMedication | null>;
  updateActiveMedication: (id: string, updates: Partial<ActiveMedication>) => Promise<boolean>;
  removeActiveMedication: (id: string) => Promise<boolean>;
  updateProfile: (updates: Partial<Profile>) => Promise<boolean>;
  addIllness: (name: string) => Promise<Illness | null>;
  deleteIllness: (id: string) => Promise<boolean>;
  syncToCloud: () => Promise<boolean>;
}

const StorageContext = createContext<StorageContextType | null>(null);

export function StorageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [activeMedications, setActiveMedications] = useState<ActiveMedication[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [illnesses, setIllnesses] = useState<Illness[]>([]);
  const [loading, setLoading] = useState(true);

  const inventoriesRef = useRef<Inventory[]>([]);
  inventoriesRef.current = inventories;
  const medicinesRef = useRef<Medicine[]>([]);
  medicinesRef.current = medicines;
  const activeMedicationsRef = useRef<ActiveMedication[]>([]);
  activeMedicationsRef.current = activeMedications;
  const illnessesRef = useRef<Illness[]>([]);
  illnessesRef.current = illnesses;
  const profileRef = useRef<Profile | null>(null);
  profileRef.current = profile;

  const isLocal = !user;

  const refresh = useCallback(async () => {
    setLoading(true);

    if (!user) {
      // Load from local storage
      setMedicines(getLocalData(LOCAL_KEYS.medicines) || []);
      setInventories(getLocalData(LOCAL_KEYS.inventories) || []);
      setActiveMedications(getLocalData(LOCAL_KEYS.activeMedications) || []);
      setIllnesses(getLocalData(LOCAL_KEYS.illnesses) || []);
      const localProfile = getLocalData(LOCAL_KEYS.profile);
      setProfile(localProfile || {
        full_name: null, age: null, gender: null, avatar_url: null,
        notify_expired: true, notify_expiring_soon: true, notify_expiring_days: 30, notify_scheduled: true,
      });
    } else {
      // Load from Supabase
      const [medRes, invRes, activeRes, profRes, illRes] = await Promise.all([
        supabase.from('medicines').select('*').order('expiration_date', { ascending: true }),
        supabase.from('inventories').select('*').order('sort_order', { ascending: true }),
        supabase.from('active_medications').select('*, medicines(id, name, category)').eq('is_active', true).order('created_at', { ascending: true }),
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('illnesses').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
      ]);

      if (medRes.data) setMedicines(medRes.data);
      if (invRes.data) setInventories(invRes.data);
      if (activeRes.data) setActiveMedications(activeRes.data);
      if (profRes.data) setProfile(profRes.data);
      else {
        // Create profile if not exists
        await supabase.from('profiles').insert({
          id: user.id,
          notify_expired: true,
          notify_expiring_soon: true,
          notify_expiring_days: 30,
        });
        setProfile({
          full_name: null, age: null, gender: null, avatar_url: null,
          notify_expired: true, notify_expiring_soon: true, notify_expiring_days: 30, notify_scheduled: true,
        });
      }
      if (illRes.data) setIllnesses(illRes.data);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Medicine operations
  const addMedicine = useCallback(async (medicineData: Omit<Medicine, 'id' | 'created_at' | 'updated_at'>): Promise<Medicine | null> => {
    const now = new Date().toISOString();
    const newMed: Medicine = {
      ...medicineData,
      id: user ? '' : generateId(),
      created_at: now,
      updated_at: now,
    };

    if (!user) {
      // Local storage
      newMed.id = generateId();
      const updated = [...medicinesRef.current, newMed];
      setMedicines(updated);
      setLocalData(LOCAL_KEYS.medicines, updated);
      return newMed;
    } else {
      // Supabase
      const { data, error } = await supabase.from('medicines').insert({
        user_id: user.id,
        ...medicineData,
      }).select().single();
      if (error) return null;
      setMedicines(prev => [...prev, data]);
      return data;
    }
  }, [user]);

  const updateMedicine = useCallback(async (id: string, updates: Partial<Medicine>): Promise<boolean> => {
    const now = new Date().toISOString();

    if (!user) {
      const updated = medicinesRef.current.map(m =>
        m.id === id ? { ...m, ...updates, updated_at: now } : m
      );
      setMedicines(updated);
      setLocalData(LOCAL_KEYS.medicines, updated);
      return true;
    } else {
      const { error } = await supabase.from('medicines').update({
        ...updates,
        updated_at: now,
      }).eq('id', id);
      if (error) return false;
      setMedicines(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
      return true;
    }
  }, [user]);

  const deleteMedicine = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      const updated = medicinesRef.current.filter(m => m.id !== id);
      setMedicines(updated);
      setLocalData(LOCAL_KEYS.medicines, updated);
      return true;
    } else {
      const { error } = await supabase.from('medicines').delete().eq('id', id);
      if (error) return false;
      setMedicines(prev => prev.filter(m => m.id !== id));
      return true;
    }
  }, [user]);

  // Inventory operations
  const addInventory = useCallback(async (name: string, icon: string): Promise<Inventory | null> => {
    const now = new Date().toISOString();
    const newInv: Inventory = {
      id: user ? '' : generateId(),
      name,
      icon,
      sort_order: inventories.length,
      created_at: now,
    };

    if (!user) {
      newInv.id = generateId();
      const updated = [...inventoriesRef.current, newInv];
      setInventories(updated);
      setLocalData(LOCAL_KEYS.inventories, updated);
      return newInv;
    } else {
      const { data, error } = await supabase.from('inventories').insert({
        user_id: user.id,
        name,
        icon,
        sort_order: inventories.length,
      }).select().single();
      if (error) return null;
      setInventories(prev => [...prev, data]);
      return data;
    }
  }, [user]);

  const updateInventory = useCallback(async (id: string, updates: Partial<Inventory>): Promise<boolean> => {
    if (!user) {
      const updated = inventoriesRef.current.map(inv => inv.id === id ? { ...inv, ...updates } : inv);
      setInventories(updated);
      setLocalData(LOCAL_KEYS.inventories, updated);
      return true;
    } else {
      const { error } = await supabase.from('inventories').update(updates).eq('id', id);
      if (error) return false;
      setInventories(prev => prev.map(inv => inv.id === id ? { ...inv, ...updates } : inv));
      return true;
    }
  }, [user]);

  const deleteInventory = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      const updated = inventoriesRef.current.filter(inv => inv.id !== id);
      setInventories(updated);
      setLocalData(LOCAL_KEYS.inventories, updated);
      // Remove inventory_id from medicines
      const medsUpdated = medicinesRef.current.map(m => m.inventory_id === id ? { ...m, inventory_id: null } : m);
      setMedicines(medsUpdated);
      setLocalData(LOCAL_KEYS.medicines, medsUpdated);
      return true;
    } else {
      const { error } = await supabase.from('inventories').delete().eq('id', id);
      if (error) return false;
      setInventories(prev => prev.filter(inv => inv.id !== id));
      return true;
    }
  }, [user]);

  const updateInventoriesOrder = useCallback(async (orderedIds: string[]): Promise<boolean> => {
    if (!user) {
      const updated = inventoriesRef.current.map(inv => ({
        ...inv,
        sort_order: orderedIds.indexOf(inv.id),
      })).sort((a, b) => a.sort_order - b.sort_order);
      setInventories(updated);
      setLocalData(LOCAL_KEYS.inventories, updated);
      return true;
    } else {
      const updates = orderedIds.map((id, index) =>
        supabase.from('inventories').update({ sort_order: index }).eq('id', id)
      );
      const results = await Promise.all(updates);
      if (results.some(r => r.error)) return false;
      setInventories(prev =>
        prev.map(inv => ({ ...inv, sort_order: orderedIds.indexOf(inv.id) })).sort((a, b) => a.sort_order - b.sort_order)
      );
      return true;
    }
  }, [user]);

  // Active Medication operations
  const addActiveMedication = useCallback(async (medData: Omit<ActiveMedication, 'id' | 'created_at'>): Promise<ActiveMedication | null> => {
    const now = new Date().toISOString();
    const newMed: ActiveMedication = {
      ...medData,
      id: user ? '' : generateId(),
      created_at: now,
    };

    if (!user) {
      newMed.id = generateId();
      const updated = [...activeMedicationsRef.current, newMed];
      setActiveMedications(updated);
      setLocalData(LOCAL_KEYS.activeMedications, updated);
      return newMed;
    } else {
      const { data, error } = await supabase.from('active_medications').insert({
        user_id: user.id,
        ...medData,
      }).select().single();
      if (error) return null;
      setActiveMedications(prev => [...prev, data]);
      return data;
    }
  }, [user]);

  const updateActiveMedication = useCallback(async (id: string, updates: Partial<ActiveMedication>): Promise<boolean> => {
    if (!user) {
      const updated = activeMedicationsRef.current.map(m => m.id === id ? { ...m, ...updates } : m);
      setActiveMedications(updated);
      setLocalData(LOCAL_KEYS.activeMedications, updated);
      return true;
    } else {
      const { error } = await supabase.from('active_medications').update(updates).eq('id', id);
      if (error) return false;
      setActiveMedications(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
      return true;
    }
  }, [user]);

  const removeActiveMedication = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      const updated = activeMedicationsRef.current.filter(m => m.id !== id);
      setActiveMedications(updated);
      setLocalData(LOCAL_KEYS.activeMedications, updated);
      return true;
    } else {
      const { error } = await supabase.from('active_medications').update({ is_active: false }).eq('id', id);
      if (error) return false;
      setActiveMedications(prev => prev.filter(m => m.id !== id));
      return true;
    }
  }, [user]);

  // Profile operations
  const updateProfile = useCallback(async (updates: Partial<Profile>): Promise<boolean> => {
    const newProfile = { ...profile, ...updates } as Profile;

    if (!user) {
      setProfile(newProfile);
      setLocalData(LOCAL_KEYS.profile, newProfile);
      return true;
    } else {
      const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
      if (error) return false;
      setProfile(newProfile);
      return true;
    }
  }, [user]);

  // Illness operations
  const addIllness = useCallback(async (name: string): Promise<Illness | null> => {
    const now = new Date().toISOString();
    const newIllness: Illness = {
      id: user ? '' : generateId(),
      name,
      created_at: now,
    };

    if (!user) {
      newIllness.id = generateId();
      const updated = [...illnessesRef.current, newIllness];
      setIllnesses(updated);
      setLocalData(LOCAL_KEYS.illnesses, updated);
      return newIllness;
    } else {
      const { data, error } = await supabase.from('illnesses').insert({
        user_id: user.id,
        name,
      }).select().single();
      if (error) return null;
      setIllnesses(prev => [...prev, data]);
      return data;
    }
  }, [user]);

  const deleteIllness = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      const updated = illnessesRef.current.filter(i => i.id !== id);
      setIllnesses(updated);
      setLocalData(LOCAL_KEYS.illnesses, updated);
      return true;
    } else {
      const { error } = await supabase.from('illnesses').delete().eq('id', id);
      if (error) return false;
      setIllnesses(prev => prev.filter(i => i.id !== id));
      return true;
    }
  }, [user]);

  // Sync local data to cloud when user signs in
  const syncToCloud = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    // Get local data
    const localMeds = getLocalData(LOCAL_KEYS.medicines) as Medicine[] || [];
    const localInvs = getLocalData(LOCAL_KEYS.inventories) as Inventory[] || [];
    const localActive = getLocalData(LOCAL_KEYS.activeMedications) as ActiveMedication[] || [];
    const localProfile = getLocalData(LOCAL_KEYS.profile) as Profile;
    const localIllnesses = getLocalData(LOCAL_KEYS.illnesses) as Illness[] || [];

    try {
      // Sync inventories first (medicines depend on them)
      const inventoryIdMap: Record<string, string> = {};
      for (const inv of localInvs) {
        const { data, error } = await supabase.from('inventories').insert({
          user_id: user.id,
          name: inv.name,
          icon: inv.icon,
          sort_order: inv.sort_order,
        }).select().single();
        if (!error && data) {
          inventoryIdMap[inv.id] = data.id;
        }
      }

      // Sync medicines
      for (const med of localMeds) {
        await supabase.from('medicines').insert({
          user_id: user.id,
          name: med.name,
          expiration_date: med.expiration_date,
          quantity: med.quantity,
          category: med.category,
          notes: med.notes,
          inventory_id: med.inventory_id ? (inventoryIdMap[med.inventory_id] || null) : null,
        });
      }

      // Sync illnesses
      for (const ill of localIllnesses) {
        await supabase.from('illnesses').insert({
          user_id: user.id,
          name: ill.name,
        });
      }

      // Sync profile
      if (localProfile) {
        await supabase.from('profiles').update({
          full_name: localProfile.full_name,
          age: localProfile.age,
          gender: localProfile.gender,
        }).eq('id', user.id);
      }

      // Clear local storage after sync
      Object.values(LOCAL_KEYS).forEach(key => {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          localStorage.removeItem(key);
        }
      });

      // Refresh from cloud
      await refresh();
      return true;
    } catch (e) {
      console.error('Sync failed:', e);
      return false;
    }
  }, [user, refresh]);

  return (
    <StorageContext.Provider value={{
      medicines,
      inventories,
      activeMedications,
      profile,
      illnesses,
      loading,
      isLocal,
      refresh,
      addMedicine,
      updateMedicine,
      deleteMedicine,
      addInventory,
      updateInventory,
      deleteInventory,
      updateInventoriesOrder,
      addActiveMedication,
      updateActiveMedication,
      removeActiveMedication,
      updateProfile,
      addIllness,
      deleteIllness,
      syncToCloud,
    }}>
      {children}
    </StorageContext.Provider>
  );
}

export function useStorage() {
  const ctx = useContext(StorageContext);
  if (!ctx) throw new Error('useStorage must be used within StorageProvider');
  return ctx;
}
