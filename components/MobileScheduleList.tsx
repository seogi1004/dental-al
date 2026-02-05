'use client';

import { CalendarDays, Plus, X } from 'lucide-react';
import { OffItem } from '@/types/off';
import { formatDate } from '@/lib/date';
import { updateOff, deleteOff } from '@/services/off';
import { signOut } from "next-auth/react";
import { WarningBanner } from './DesktopCalendar';
import { MESSAGES } from '@/lib/messages';
import { useState, useEffect } from 'react';

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
  sundayLeaves: Array<{ name: string; original: string }>;
  overlapLeaves?: Array<{ name: string; date: string }>;
  onLeaveAdd?: () => void;
  onOffAdd?: () => void;
  isAdmin?: boolean;
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
  sundayLeaves,
  overlapLeaves = [],
  onLeaveAdd,
  onOffAdd,
  isAdmin = false
}: MobileScheduleListProps) {
  const [showPastItems, setShowPastItems] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('showPastItems');
    if (saved !== null) {
      setShowPastItems(saved === 'true');
    }
  }, []);

  const handleTogglePastItems = () => {
    const newValue = !showPastItems;
    setShowPastItems(newValue);
    localStorage.setItem('showPastItems', String(newValue));
  };

  type CombinedItem = {
    name: string;
    role?: string;
    date: string;
    dateObj: Date;
    original: string;
    type: 'AM' | 'PM' | 'FULL' | 'OFF';
    listType: 'LEAVE' | 'OFF';
    isDuplicate?: boolean;
    isOverlap?: boolean;
    warning?: string | null;
    memo?: string;
  };

  const today = getTodayString();
  
  const combinedList: CombinedItem[] = [
    ...leaves.map(item => ({
      ...item,
      dateObj: new Date(item.date),
      listType: 'LEAVE' as const,
      isOverlap: overlapLeaves.some(o => o.name === item.name && o.date === item.date)
    })),
    ...monthOffs.map(item => ({
      name: item.name,
      role: undefined,
      date: item.date,
      dateObj: item.dateObj,
      original: item.date,
      type: (item.type || 'OFF') as 'AM' | 'PM' | 'OFF',
      listType: 'OFF' as const,
      memo: item.memo,
      isOverlap: overlapLeaves.some(o => o.name === item.name && o.date === item.date)
    }))
  ]
  .filter(item => showPastItems ? true : item.date >= today)
  .sort((a, b) => {
    const dateCompare = a.dateObj.getTime() - b.dateObj.getTime();
    if (dateCompare !== 0) return dateCompare;
    
    // 같은 날짜일 때: 오전(AM) -> 종일(FULL/OFF) -> 오후(PM) 순서
    const getOrder = (type: string) => {
      if (type === 'AM') return 1;
      if (type === 'FULL' || type === 'OFF') return 2;
      if (type === 'PM') return 3;
      return 2;
    };
    
    const typeA = a.listType === 'LEAVE' ? a.type : (a.type || 'OFF');
    const typeB = b.listType === 'LEAVE' ? b.type : (b.type || 'OFF');
    
    const orderA = getOrder(typeA);
    const orderB = getOrder(typeB);
    
    if (orderA !== orderB) return orderA - orderB;
    
    // 타입도 같으면 연차 -> 오프 순
    return a.listType === 'LEAVE' ? -1 : 1;
  });

  const handleOffClick = async (name: string, date: string, memo?: string) => {
    if (!isAdmin) return;

    let displayDate = date;
    try {
      const [y, m, d] = date.split('-');
      if (y && m && d) displayDate = `${parseInt(m, 10)}/${parseInt(d, 10)}`;
    } catch(e) {}

    const newDateInput = prompt(MESSAGES.off.edit.mobilePrompt, displayDate);
    
    if (!newDateInput || newDateInput === displayDate) return;

    const datePattern = /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12][0-9]|3[01])(\s+(AM|PM|오전|오후))?$/i;
    if (!datePattern.test(newDateInput.trim())) {
      alert(MESSAGES.validation.invalidOffDate);
      return;
    }
      
    try {
      await updateOff(name, date, newDateInput.trim(), memo);
      alert(MESSAGES.off.edit.success);
      onRefresh();
    } catch (error: any) {
      if (!handleApiError(error)) {
        alert(MESSAGES.off.edit.failure(error.message));
      }
    }
  };

  const handleOffDelete = async (name: string, date: string) => {
    if (!isAdmin) return;
    if (!confirm(MESSAGES.off.delete.confirm(name, date))) return;

    try {
      await deleteOff(name, date);
      alert(MESSAGES.off.delete.success);
      onRefresh();
    } catch (error: any) {
      if (!handleApiError(error)) {
        alert(MESSAGES.off.delete.failure(error.message));
      }
    }
  };

  return (
    <div className="bg-white dark:bg-[#1E1E1E] p-5 rounded-2xl shadow-sm border border-[#F0EAE4] dark:border-[#333333] mb-6 transition-colors duration-300">
      <h3 className="text-[#5C5552] dark:text-[#E0E0E0] font-bold mb-4 flex items-center justify-between text-lg">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-[#8D7B68] dark:text-[#A4907C]"/> {todayMonth}월 일정
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button 
              onClick={onOffAdd}
              className="px-1 py-0.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-500 dark:text-blue-400 text-[10px] font-bold leading-none border border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-all"
              title="오프 추가"
            >
              OFF
            </button>
            <button 
              onClick={onLeaveAdd}
              className="p-0.5 rounded hover:bg-[#EBE5DD] dark:hover:bg-[#3D3D3D] text-[#8D7B68] dark:text-[#A4907C] border border-transparent hover:border-[#D7C8B8] dark:hover:border-[#444444] transition-all"
              title="연차 추가"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </h3>

      <div className="mb-4">
        <label className="flex items-center gap-2.5 cursor-pointer select-none group w-fit">
          <div className="relative">
            <input
              type="checkbox"
              checked={showPastItems}
              onChange={handleTogglePastItems}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-gray-200 dark:bg-gray-700 rounded-full peer transition-colors peer-checked:bg-[#8D7B68] dark:peer-checked:bg-[#A4907C] peer-focus:ring-2 peer-focus:ring-[#8D7B68]/20 dark:peer-focus:ring-[#A4907C]/20"></div>
            <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5 shadow-sm"></div>
          </div>
          <span className="text-sm font-medium text-[#5C5552] dark:text-[#E0E0E0] group-hover:text-[#8D7B68] dark:group-hover:text-[#A4907C] transition-colors">
            지난 일정 보기
          </span>
        </label>
      </div>
      
      <WarningBanner session={session} invalidLeaves={invalidLeaves} sundayLeaves={sundayLeaves} overlapLeaves={overlapLeaves} />
      
      {combinedList.length === 0 ? (
        <div className="text-center py-6 text-[#A4907C] dark:text-[#8D7B68] text-sm bg-[#FDFBF7] dark:bg-[#121212] rounded-xl transition-colors duration-300">
          이번 달 예정된 일정이 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {combinedList.map((item, idx) => {
            const isOff = item.listType === 'OFF';
            const isPast = item.date < today;
            
              const containerClass = isPast
                ? 'bg-gray-100 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 opacity-60'
                : item.isOverlap
                  ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-400 dark:border-red-600'
                : isOff
                  ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                  : item.isDuplicate 
                    ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700' 
                    : 'bg-[#FDFBF7] dark:bg-[#121212] border border-[#EBE5DD] dark:border-[#444444]';

              const dateTextClass = isPast
                ? 'text-gray-500 dark:text-gray-400'
                : item.isOverlap
                  ? 'text-red-700 dark:text-red-300'
                : isOff
                  ? 'text-blue-700 dark:text-blue-300'
                  : item.isDuplicate 
                    ? 'text-red-700 dark:text-red-300' 
                    : 'text-[#8D7B68] dark:text-[#A4907C]';

              const nameTextClass = isPast
                ? 'text-gray-500 dark:text-gray-400'
                : item.isOverlap
                  ? 'text-red-700 dark:text-red-300'
                : isOff
                  ? 'text-blue-800 dark:text-blue-200'
                  : item.isDuplicate 
                    ? 'text-red-700 dark:text-red-300' 
                    : 'text-[#5C5552] dark:text-[#E0E0E0]';

            const badgeColor = isPast
              ? 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              : item.type === 'AM' 
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' 
                : item.type === 'PM' 
                  ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200' 
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
            
              return (
                <div key={`${item.listType}-${idx}`} 
                  className={`flex items-center justify-between p-3 rounded-xl transition-colors duration-300 ${containerClass}`}
                >
                    <div 
                    onClick={() => isOff 
                      ? handleOffClick(item.name, item.date, item.memo) 
                      : onLeaveClick(item.name, item.original, item.date)
                    }
                    className={`flex items-center gap-3 flex-1 min-w-0 transition-opacity ${
                      (isOff ? isAdmin : true) ? 'cursor-pointer hover:opacity-70' : 'cursor-default'
                    }`}
                    title={isOff ? item.memo : (item.warning || undefined)}
                  >
                    <span className={`text-sm font-bold ${dateTextClass}`}>
                    {formatDate(item.date)}
                  </span>
                  <div className={`h-4 w-[1px] ${isPast ? 'bg-gray-300 dark:bg-gray-600' : isOff ? 'bg-blue-200 dark:bg-blue-700' : 'bg-[#EBE5DD] dark:bg-[#444444]'}`}></div>
                  <span className={`font-medium ${nameTextClass}`}>{item.name}</span>
                  {(item.listType === 'OFF' ? (item.type === 'AM' || item.type === 'PM') : item.type !== 'FULL') && (
                     <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${badgeColor}`}>
                       {item.listType === 'OFF' ? item.type : item.type}
                     </span>
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
                  {isAdmin && (
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        isOff ? handleOffDelete(item.name, item.date) : onLeaveDelete(item.name, item.original); 
                      }}
                      className={`p-1.5 rounded-full transition-colors ${
                        isOff
                        ? 'hover:bg-blue-200 dark:hover:bg-blue-800/50 text-blue-400 hover:text-blue-600 dark:hover:text-blue-300'
                        : item.isOverlap
                          ? 'hover:bg-red-200 dark:hover:bg-red-800/50 text-red-500 hover:text-red-600'
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
