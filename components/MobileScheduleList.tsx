'use client';

import { CalendarDays, X } from 'lucide-react';
import { LeaveItem } from '@/types';
import { OffItem } from '@/types/off';
import { formatDate } from '@/lib/date';
import { updateOff, deleteOff } from '@/services/off';
import { signOut } from "next-auth/react";
import { WarningBanner } from './DesktopCalendar';

const handleApiError = (e: any) => {
  if (e.message && (e.message.includes('invalid authentication') || e.message.includes('credentials'))) {
    signOut({ callbackUrl: '/' });
    return true;
  }
  return false;
};

interface MobileScheduleListProps {
  leaves: Array<{
    name: string;
    role: string;
    date: string;
    original: string;
    type: 'AM' | 'PM' | 'FULL';
    isDuplicate?: boolean;
    warning?: string | null;
  }>;
  monthOffs: OffItem[];
  onLeaveClick: (name: string, original: string, date: string) => void;
  onLeaveDelete: (name: string, original: string) => void;
  onRefresh: () => void;
  session: {
    isAdmin: boolean;
  } | null;
  getTodayString: () => string;
  formatDate: (dateStr: string) => string;
  todayMonth: number;
  invalidLeaves: Array<{ name: string; original: string }>;
  sundayLeaves: Array<{ name: string; original: string; date?: string }>;
}

export default function MobileScheduleList({
  leaves, 
  monthOffs,
  onLeaveClick, 
  onLeaveDelete, 
  onRefresh,
  session, 
  getTodayString,
  formatDate,
  todayMonth,
  invalidLeaves,
  sundayLeaves
}: MobileScheduleListProps) {
  type CombinedItem = {
    name: string;
    role?: string;
    date: string;
    dateObj: Date;
    original: string;
    type: 'AM' | 'PM' | 'FULL' | 'OFF';
    listType: 'LEAVE' | 'OFF';
    isDuplicate?: boolean;
    warning?: string | null;
    memo?: string;
  };

  const combinedList: CombinedItem[] = [
    ...leaves.map(item => ({
      ...item,
      dateObj: new Date(item.date),
      listType: 'LEAVE' as const
    })),
    ...monthOffs.map(item => ({
      name: item.name,
      role: undefined,
      date: item.date,
      dateObj: item.dateObj,
      original: item.date,
      type: 'OFF' as const,
      listType: 'OFF' as const,
      memo: item.memo
    }))
  ].sort((a, b) => {
    const dateCompare = a.dateObj.getTime() - b.dateObj.getTime();
    if (dateCompare !== 0) return dateCompare;
    return a.listType === 'LEAVE' ? -1 : 1;
  });

  const handleOffClick = async (name: string, date: string, memo?: string) => {
    if (!session?.isAdmin) return;

    let displayDate = date;
    try {
      const [y, m, d] = date.split('-');
      if (y && m && d) displayDate = `${parseInt(m, 10)}/${parseInt(d, 10)}`;
    } catch(e) {}

    const newDateInput = prompt(`오프 날짜를 수정하세요 (M/D 형식):
예: 1/15`, displayDate);
    
    if (!newDateInput || newDateInput === displayDate) return;

    const datePattern = /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12][0-9]|3[01])$/;
    if (!datePattern.test(newDateInput.trim())) {
      alert(`올바른 날짜 형식으로 입력해주세요. (M/D)
예: 1/15`);
      return;
    }
      
    try {
      await updateOff(name, date, newDateInput.trim(), memo);
      alert('오프가 수정되었습니다.');
      onRefresh();
    } catch (error: any) {
      if (!handleApiError(error)) {
        alert(error.message || '오프 수정에 실패했습니다.');
      }
    }
  };

  const handleOffDelete = async (name: string, date: string) => {
    if (!session?.isAdmin) return;
    if (!confirm(`${name}의 ${date} 오프를 삭제하시겠습니까?`)) return;

    try {
      await deleteOff(name, date);
      alert('오프가 삭제되었습니다.');
      onRefresh();
    } catch (error: any) {
      if (!handleApiError(error)) {
        alert(error.message || '오프 삭제에 실패했습니다.');
      }
    }
  };

  return (
    <div className="bg-white dark:bg-[#1E1E1E] p-5 rounded-2xl shadow-sm border border-[#F0EAE4] dark:border-[#333333] mb-6 transition-colors duration-300">
      <h3 className="text-[#5C5552] dark:text-[#E0E0E0] font-bold mb-4 flex items-center gap-2 text-lg">
        <CalendarDays className="w-5 h-5 text-[#8D7B68] dark:text-[#A4907C]"/> {todayMonth}월 일정
      </h3>
      
      <WarningBanner session={session} invalidLeaves={invalidLeaves} sundayLeaves={sundayLeaves} />
      
      {combinedList.length === 0 ? (
        <div className="text-center py-6 text-[#A4907C] dark:text-[#8D7B68] text-sm bg-[#FDFBF7] dark:bg-[#121212] rounded-xl transition-colors duration-300">
          이번 달 예정된 일정이 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {combinedList.map((item, idx) => {
            const isPast = item.date < getTodayString();
            const isOff = item.listType === 'OFF';
            
            const containerClass = isOff
              ? isPast
                ? 'bg-gray-100 dark:bg-gray-900/20 opacity-60 border border-gray-300 dark:border-gray-700'
                : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
              : item.isDuplicate 
                ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700' 
                : isPast 
                  ? 'bg-[#F5F5F5] dark:bg-[#2A2A2A] opacity-60' 
                  : 'bg-[#FDFBF7] dark:bg-[#121212] border border-[#EBE5DD] dark:border-[#444444]';

            const dateTextClass = isOff
              ? isPast
                ? 'text-gray-500 dark:text-gray-400'
                : 'text-blue-700 dark:text-blue-300'
              : item.isDuplicate 
                ? 'text-red-700 dark:text-red-300' 
                : isPast 
                  ? 'text-gray-500 dark:text-gray-400' 
                  : 'text-[#8D7B68] dark:text-[#A4907C]';

            const nameTextClass = isOff
              ? isPast
                ? 'text-gray-600 dark:text-gray-400'
                : 'text-blue-800 dark:text-blue-200'
              : item.isDuplicate 
                ? 'text-red-700 dark:text-red-300' 
                : 'text-[#5C5552] dark:text-[#E0E0E0]';

            const badgeColor = item.type === 'AM' 
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' 
              : item.type === 'PM' 
                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200' 
                : item.type === 'OFF'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                  : 'bg-[#EBE5DD] dark:bg-[#2C2C2C] text-[#8D7B68] dark:text-[#A4907C]';
            
              return (
                <div key={`${item.listType}-${idx}`} 
                  className={`flex items-center justify-between p-3 rounded-xl transition-colors duration-300 ${containerClass}`}
                >
                  <div 
                    onClick={() => isOff 
                      ? handleOffClick(item.name, item.date, item.memo) 
                      : onLeaveClick(item.name, item.original, item.date)
                    }
                    className={`flex items-center gap-3 flex-1 transition-opacity ${
                      (isOff ? session?.isAdmin : true) ? 'cursor-pointer hover:opacity-70' : 'cursor-default'
                    }`}
                    title={isOff ? item.memo : (item.warning || undefined)}
                  >
                    <span className={`text-sm font-bold ${dateTextClass}`}>
                    {formatDate(item.date)}
                  </span>
                  <div className={`h-4 w-[1px] ${isOff ? 'bg-blue-200 dark:bg-blue-700' : 'bg-[#EBE5DD] dark:bg-[#444444]'}`}></div>
                  <span className={`font-medium ${nameTextClass}`}>{item.name}</span>
                  {item.type === 'OFF' ? (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${badgeColor}`}>OFF</span>
                  ) : item.type !== 'FULL' && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${badgeColor}`}>{item.type}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {item.date === getTodayString() && (
                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                      isOff 
                        ? 'bg-blue-600 dark:bg-blue-700 text-white' 
                        : 'bg-[#8D7B68] dark:bg-[#5C4A3A] text-white'
                    }`}>Today</span>
                  )}
                  {session?.isAdmin && (
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        isOff ? handleOffDelete(item.name, item.date) : onLeaveDelete(item.name, item.original); 
                      }}
                      className={`p-1.5 rounded-full transition-colors ${
                        isOff
                          ? 'hover:bg-blue-200 dark:hover:bg-blue-800/50 text-blue-400 hover:text-blue-600 dark:hover:text-blue-300'
                          : item.isDuplicate
                            ? 'hover:bg-red-200 dark:hover:bg-red-800/50 text-red-500 hover:text-red-600'
                            : 'hover:bg-red-100 dark:hover:bg-red-900/30 text-[#DBCCC0] hover:text-red-500 dark:hover:text-red-400'
                      }`}
                      title="삭제"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
