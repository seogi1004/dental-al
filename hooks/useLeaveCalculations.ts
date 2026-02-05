import { useCallback } from 'react';
import { Staff, StaffData, LeaveItem, LeaveType, OffItem } from '@/types';
import { parseLeaveDate, isValidDate, getTodayString } from '@/lib/date';

interface UseLeaveCalculationsReturn {
  getCurrentMonthLeaves: () => LeaveItem[];
  getTodayLeaves: () => (Staff & { leaveType: LeaveType; original: string })[];
  getInvalidLeaves: () => { name: string; original: string; reason: string }[];
  getSundayLeaves: () => { name: string; original: string; date: string; reason: string }[];
  getTodayOffs: () => { name: string; memo?: string; type?: 'AM' | 'PM' }[];
  getCurrentMonthOffs: () => OffItem[];
  getSundayOffs: () => { name: string; date: string; reason: string }[];
  getOverlapLeaves: () => { name: string; date: string; reason: string }[];
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

  const getTodayOffs = useCallback(() => {
    const todayStr = getTodayString();
    const list: { name: string; memo?: string; type?: 'AM' | 'PM' }[] = [];
    
    staffData.forEach(staff => {
      if (staff.offs) {
        staff.offs.forEach(off => {
          if (off.dateParsed === todayStr) {
            let type: 'AM' | 'PM' | undefined;
            if (off.date.toUpperCase().includes('AM')) type = 'AM';
            else if (off.date.toUpperCase().includes('PM')) type = 'PM';
            else if (off.date.includes('오전')) type = 'AM';
            else if (off.date.includes('오후')) type = 'PM';

            list.push({ name: staff.name, memo: off.memo, type });
          }
        });
      }
    });
    return list;
  }, [staffData]);

  const getCurrentMonthOffs = useCallback((): OffItem[] => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const offsList: OffItem[] = [];
    staffData.forEach(staff => {
      if (staff.offs) {
        staff.offs.forEach(off => {
          const d = new Date(off.dateParsed);
          // 날짜 유효성 체크
          if (!isNaN(d.getTime()) && d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            
            let type: 'AM' | 'PM' | undefined;
            if (off.date.toUpperCase().includes('AM')) type = 'AM';
            else if (off.date.toUpperCase().includes('PM')) type = 'PM';
            else if (off.date.includes('오전')) type = 'AM';
            else if (off.date.includes('오후')) type = 'PM';

            offsList.push({
              name: staff.name,
              date: off.dateParsed,
              dateObj: d,
              memo: off.memo,
              type: type
            });
          }
        });
      }
    });
    return offsList.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  }, [staffData]);

  const getSundayOffs = useCallback(() => {
    const sundayList: { name: string; date: string; reason: string }[] = [];
    staffData.forEach(staff => {
      if (staff.offs) {
        staff.offs.forEach(off => {
          const d = new Date(off.dateParsed);
          // 날짜 유효성 체크 && 일요일(0) 체크
          if (!isNaN(d.getTime()) && d.getDay() === 0) {
            sundayList.push({
              name: staff.name,
              date: off.dateParsed,
              reason: '일요일에 오프가 등록되었습니다.'
            });
          }
        });
      }
    });
    return sundayList;
  }, [staffData]);

  const getOverlapLeaves = useCallback(() => {
    const overlapList: { name: string; date: string; reason: string }[] = [];
    staffData.forEach(staff => {
      const offMap = new Map<string, 'AM' | 'PM' | 'FULL'>();
      if (staff.offs) {
        staff.offs.forEach(off => {
            if(off.dateParsed) {
               let type: 'AM' | 'PM' | 'FULL' = 'FULL';
               if (off.date.toUpperCase().includes('AM')) type = 'AM';
               else if (off.date.toUpperCase().includes('PM')) type = 'PM';
               else if (off.date.includes('오전')) type = 'AM';
               else if (off.date.includes('오후')) type = 'PM';
               offMap.set(off.dateParsed, type);
            }
        });
      }
      
      if (staff.leaves && offMap.size > 0) {
        staff.leaves.forEach(leafObj => {
          const { date, type: leaveType } = parseLeaveDate(leafObj.parsed);
          if (date && offMap.has(date)) {
             const offType = offMap.get(date);
             // 중복 조건: 둘 중 하나라도 FULL이거나, 둘 다 같은 타입(AM/AM, PM/PM)인 경우
             if (offType === 'FULL' || leaveType === 'FULL' || offType === leaveType) {
                const offTypeStr = offType === 'FULL' ? '종일' : offType;
                const leaveTypeStr = leaveType === 'FULL' ? '종일' : leaveType;
                overlapList.push({
                  name: staff.name,
                  date: date,
                  reason: `연차(${leaveTypeStr})와 오프(${offTypeStr})가 중복 등록되었습니다.`
                });
             }
          }
        });
      }
    });
    return overlapList;
  }, [staffData]);

  return {
    getCurrentMonthLeaves,
    getTodayLeaves,
    getInvalidLeaves,
    getSundayLeaves,
    getTodayOffs,
    getCurrentMonthOffs,
    getSundayOffs,
    getOverlapLeaves
  };
};
