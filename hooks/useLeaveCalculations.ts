import { useCallback } from 'react';
import { Staff, StaffData, LeaveItem, LeaveType } from '@/types';
import { parseLeaveDate, isValidDate, getTodayString } from '@/lib/date';

interface UseLeaveCalculationsReturn {
  getCurrentMonthLeaves: () => LeaveItem[];
  getTodayLeaves: () => (Staff & { leaveType: LeaveType; original: string })[];
  getInvalidLeaves: () => { name: string; original: string; reason: string }[];
  getSundayLeaves: () => { name: string; original: string; date: string; reason: string }[];
}

export const useLeaveCalculations = (staffData: StaffData): UseLeaveCalculationsReturn => {
  const getCurrentMonthLeaves = useCallback((): LeaveItem[] => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const leavesList: LeaveItem[] = [];
    staffData.forEach(staff => {
      if (staff.leaves && Array.isArray(staff.leaves)) {
        staff.leaves.forEach(leafObj => {
          const rawDateStr = leafObj.parsed;
          const { date, type } = parseLeaveDate(rawDateStr);
          
          if (date && isValidDate(date)) {
            const d = new Date(date);
            if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
              leavesList.push({
                original: leafObj.original,
                date: date,
                type: type,
                dateObj: d,
                name: staff.name,
                role: staff.role
              });
            }
          }
        });
      }
    });
    
    const sortedList = leavesList.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
    
    const nameDateCounts: Record<string, number> = {};
    sortedList.forEach(item => {
      const key = `${item.name}_${item.date}`;
      nameDateCounts[key] = (nameDateCounts[key] || 0) + 1;
    });
    
    return sortedList.map(item => {
      const key = `${item.name}_${item.date}`;
      return {
        ...item,
        isDuplicate: nameDateCounts[key] > 1,
        warning: nameDateCounts[key] > 1 
          ? `${item.name}님이 이 날짜에 ${nameDateCounts[key]}번 등록되어 있습니다.` 
          : null
      };
    });
  }, [staffData]);

  const getTodayLeaves = useCallback(() => {
    const todayStr = getTodayString();
    const list: (Staff & { leaveType: LeaveType; original: string })[] = [];
    
    staffData.forEach(staff => {
        if (staff.leaves) {
            staff.leaves.forEach(leafObj => {
                const leaf = leafObj.parsed;
                const { date, type } = parseLeaveDate(leaf);
                if (date === todayStr) {
                    list.push({ ...staff, leaveType: type, original: leafObj.original });
                }
            });
        }
    });
    return list;
  }, [staffData]);

  const getInvalidLeaves = useCallback(() => {
    const invalidList: { name: string; original: string; reason: string }[] = [];
    staffData.forEach(staff => {
      if (staff.leaves) {
        staff.leaves.forEach(leafObj => {
          const { date } = parseLeaveDate(leafObj.parsed);
          if (!date || !isValidDate(date)) {
            invalidList.push({
              name: staff.name,
              original: leafObj.original,
              reason: '날짜 형식이 잘못되었습니다.'
            });
          }
        });
      }
    });
    return invalidList;
  }, [staffData]);

  const getSundayLeaves = useCallback(() => {
    const sundayList: { name: string; original: string; date: string; reason: string }[] = [];
    staffData.forEach(staff => {
      if (staff.leaves) {
        staff.leaves.forEach(leafObj => {
          const { date } = parseLeaveDate(leafObj.parsed);
          if (date && isValidDate(date)) {
            const d = new Date(date);
            if (d.getDay() === 0) {
              sundayList.push({
                name: staff.name,
                original: leafObj.original,
                date: date,
                reason: '일요일에 연차가 등록되었습니다.'
              });
            }
          }
        });
      }
    });
    return sundayList;
  }, [staffData]);

  return {
    getCurrentMonthLeaves,
    getTodayLeaves,
    getInvalidLeaves,
    getSundayLeaves
  };
};
