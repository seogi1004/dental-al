import { useState, useCallback, useEffect } from 'react';
import { StaffData } from '@/types';
import { signOut } from 'next-auth/react';

interface UseSheetDataReturn {
  staffData: StaffData;
  setStaffData: (data: StaffData) => void;
  loading: boolean;
  statusMsg: string;
  fetchSheetData: () => Promise<void>;
  saveSheetData: (newData?: StaffData) => Promise<void>;
  handleUpdate: (index: number, field: string, value: string | number) => void;
  handleBlur: () => void;
}

export const useSheetData = (session: any): UseSheetDataReturn => {
  const [staffData, setStaffData] = useState<StaffData>([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  const fetchSheetData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sheets'); 
      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`);
      }
      const data = await res.json();
      setStaffData(data && data.length > 0 ? data : []);
      setStatusMsg('동기화 완료');
    } catch (error) {
      console.error("Fetch Error:", error);
      setStaffData([]);
      setStatusMsg('데이터 로드 실패');
    } finally {
      setLoading(false);
      setTimeout(() => setStatusMsg(''), 3000);
    }
  }, []);

  useEffect(() => {
    fetchSheetData();
  }, [fetchSheetData]);

  const saveSheetData = useCallback(async (newData?: StaffData) => {
    if (!session) {
        alert("로그인이 필요합니다.");
        return;
    }
    setStatusMsg('저장 중...');
    try {
      const res = await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData || staffData),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || 'Failed to save');
      }
      
      setStatusMsg('저장됨');
      setTimeout(() => setStatusMsg(''), 2000);
    } catch (error: any) {
      console.error("Save Error:", error);
      if (error.message && (error.message.includes('invalid authentication') || error.message.includes('credentials') || error.message.includes('access token'))) {
        alert("세션이 만료되었습니다. 다시 로그인해주세요.");
        signOut();
        return;
      }
      setStatusMsg('저장 실패');
    }
  }, [session, staffData]);

  const handleUpdate = useCallback((index: number, field: string, value: string | number) => {
    if (!session?.isAdmin) return; 

    const newData = [...staffData];
    (newData[index] as any)[field] = value;
    
    if (field === 'date' && value) {
      const joinDate = new Date(value as string);
      const today = new Date();
      let years = today.getFullYear() - joinDate.getFullYear();
      const m = today.getMonth() - joinDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < joinDate.getDate())) years--;

      let leave = years < 1 ? 11 : (15 + Math.floor((years - 1) / 2));
      if (leave > 25) leave = 25;
      newData[index].total = leave;
    }

    setStaffData(newData);

    if (saveTimeout) clearTimeout(saveTimeout);
    const timeoutId = setTimeout(() => {
      saveSheetData(newData);
    }, 1000);
    setSaveTimeout(timeoutId);
  }, [session?.isAdmin, staffData, saveTimeout, saveSheetData]);

  const handleBlur = useCallback(() => {
    if (!session?.isAdmin) return;

    let finalData = staffData;
    if (staffData.some(staff => staff.isNew)) {
      const updatedData = staffData.map(staff => {
        if (staff.isNew) {
          const { isNew, ...rest } = staff;
          return rest;
        }
        return staff;
      });
      setStaffData(updatedData);
      finalData = updatedData;
    }

    if (saveTimeout) clearTimeout(saveTimeout);
    saveSheetData(finalData);
  }, [session?.isAdmin, staffData, saveTimeout, saveSheetData]);

  return {
    staffData,
    setStaffData,
    loading,
    statusMsg,
    fetchSheetData,
    saveSheetData,
    handleUpdate,
    handleBlur
  };
};
