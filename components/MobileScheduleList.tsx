'use client';

import { CalendarDays, X } from 'lucide-react';
import { LeaveItem } from '@/types';
import { formatDate } from '@/lib/date';

interface WarningBannerProps {
  session: {
    isAdmin: boolean;
  } | null;
  invalidLeaves: Array<{ name: string; original: string }>;
  sundayLeaves: Array<{ name: string; original: string }>;
}

const WarningBanner = ({ session, invalidLeaves, sundayLeaves }: WarningBannerProps) => {
  if (!session?.isAdmin || (invalidLeaves.length === 0 && sundayLeaves.length === 0)) return null;

  return (
    <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-xl">
      <div className="flex items-start gap-3 text-amber-800 dark:text-amber-300">
        <span className="text-xl shrink-0">⚠️</span>
        <div className="flex-1">
          {invalidLeaves.length > 0 && (
            <div className="mb-3">
              <p className="font-bold text-sm mb-2">잘못된 날짜 형식이 감지되었습니다</p>
              <ul className="text-xs space-y-1 mb-2">
                {invalidLeaves.slice(0, 5).map((item, idx) => (
                  <li key={idx}>
                    • <strong>{item.name}</strong>: <code className="px-1 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded text-[10px]">"{item.original}"</code>
                  </li>
                ))}
                {invalidLeaves.length > 5 && (
                  <li className="opacity-70">... 외 {invalidLeaves.length - 5}건</li>
                )}
              </ul>
            </div>
          )}
          {sundayLeaves.length > 0 && (
            <div>
              <p className="font-bold text-sm mb-2">일요일 연차가 감지되었습니다</p>
              <ul className="text-xs space-y-1 mb-2">
                {sundayLeaves.slice(0, 5).map((item, idx) => (
                  <li key={idx}>
                    • <strong>{item.name}</strong>: <code className="px-1 py-0.5 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 rounded text-[10px]">"{item.original}"</code>
                  </li>
                ))}
                {sundayLeaves.length > 5 && (
                  <li className="opacity-70">... 외 {sundayLeaves.length - 5}건</li>
                )}
              </ul>
            </div>
          )}
          <p className="text-xs opacity-80">💡 항목을 클릭하여 수정하거나 삭제할 수 있습니다.</p>
        </div>
      </div>
    </div>
  );
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
  onLeaveClick: (name: string, original: string, date: string) => void;
  onLeaveDelete: (name: string, original: string) => void;
  session: {
    isAdmin: boolean;
  } | null;
  getTodayString: () => string;
  formatDate: (dateStr: string) => string;
  todayMonth: number;
  invalidLeaves: Array<{ name: string; original: string }>;
  sundayLeaves: Array<{ name: string; original: string }>;
}

export default function MobileScheduleList({ 
  leaves, 
  onLeaveClick, 
  onLeaveDelete, 
  session, 
  getTodayString,
  formatDate,
  todayMonth,
  invalidLeaves,
  sundayLeaves
}: MobileScheduleListProps) {
  return (
    <div className="bg-white dark:bg-[#1E1E1E] p-5 rounded-2xl shadow-sm border border-[#F0EAE4] dark:border-[#333333] mb-6 transition-colors duration-300">
      <h3 className="text-[#5C5552] dark:text-[#E0E0E0] font-bold mb-4 flex items-center gap-2 text-lg">
        <CalendarDays className="w-5 h-5 text-[#8D7B68] dark:text-[#A4907C]"/> {todayMonth}월 연차 일정
      </h3>
      
      <WarningBanner session={session} invalidLeaves={invalidLeaves} sundayLeaves={sundayLeaves} />
      
      {leaves.length === 0 ? (
        <div className="text-center py-6 text-[#A4907C] dark:text-[#8D7B68] text-sm bg-[#FDFBF7] dark:bg-[#121212] rounded-xl transition-colors duration-300">
          이번 달 예정된 연차가 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {leaves.map((item, idx) => {
            const isPast = item.date < getTodayString();
            const badgeColor = item.type === 'AM' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' : item.type === 'PM' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200' : 'bg-[#EBE5DD] dark:bg-[#2C2C2C] text-[#8D7B68] dark:text-[#A4907C]';
            
            return (
              <div key={idx} 
                className={`flex items-center justify-between p-3 rounded-xl transition-colors duration-300 ${
                  item.isDuplicate 
                    ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700' 
                    : isPast 
                      ? 'bg-[#F5F5F5] dark:bg-[#2A2A2A] opacity-60' 
                      : 'bg-[#FDFBF7] dark:bg-[#121212] border border-[#EBE5DD] dark:border-[#444444]'
                }`}
              >
                <div 
                  onClick={() => onLeaveClick(item.name, item.original, item.date)}
                  className="flex items-center gap-3 flex-1 cursor-pointer hover:opacity-70 transition-opacity"
                  title={item.warning || undefined}
                >
                  <span className={`text-sm font-bold ${item.isDuplicate ? 'text-red-700 dark:text-red-300' : isPast ? 'text-gray-500 dark:text-gray-400' : 'text-[#8D7B68] dark:text-[#A4907C]'}`}>
                    {formatDate(item.original)}
                  </span>
                  <div className="h-4 w-[1px] bg-[#EBE5DD] dark:bg-[#444444]"></div>
                  <span className={`font-medium ${item.isDuplicate ? 'text-red-700 dark:text-red-300' : 'text-[#5C5552] dark:text-[#E0E0E0]'}`}>{item.name}</span>
                  <span className="text-xs text-[#A4907C] dark:text-[#C4B09C] bg-white dark:bg-[#2C2C2C] px-1.5 py-0.5 rounded border border-[#EBE5DD] dark:border-[#444444]">{item.role}</span>
                  {item.type !== 'FULL' && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${badgeColor}`}>{item.type}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {item.date === getTodayString() && (
                    <span className="text-xs bg-[#8D7B68] dark:bg-[#5C4A3A] text-white px-2 py-1 rounded-full font-bold">Today</span>
                  )}
                  {session?.isAdmin && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onLeaveDelete(item.name, item.original); }}
                      className={`p-1.5 rounded-full transition-colors ${
                        item.isDuplicate
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
