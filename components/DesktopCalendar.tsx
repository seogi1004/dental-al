'use client';

import { CalendarDays, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { Staff, Off } from '@/types';
import { parseLeaveDate, isValidDate } from '@/lib/date';
import { addOff, updateOff, deleteOff } from '@/services/off';

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

interface DesktopCalendarProps {
  viewDate: Date;
  setViewDate: (date: Date) => void;
  staffData: Staff[];
  session: {
    isAdmin: boolean;
  } | null;
  invalidLeaves: Array<{ name: string; original: string }>;
  sundayLeaves: Array<{ name: string; original: string }>;
  handlers: {
    handleLeaveClick: (name: string, original: string, date: string) => void;
    handleLeaveDelete: (name: string, original: string) => void;
    handleLeaveAdd: (dateStr: string) => void;
  };
  onRefresh: () => void;
}

export default function DesktopCalendar({ 
  viewDate, 
  setViewDate, 
  staffData, 
  session, 
  invalidLeaves, 
  sundayLeaves, 
  handlers,
  onRefresh
}: DesktopCalendarProps) {
  const { handleLeaveClick, handleLeaveDelete, handleLeaveAdd } = handlers;
  
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const moveMonth = (delta: number) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setViewDate(newDate);
  };

  const getLeavesForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const list: Array<{
      name: string;
      role: string;
      type: 'AM' | 'PM' | 'FULL';
      original: string;
      isDuplicate?: boolean;
      isSunday?: boolean;
      warning?: string | null;
    }> = [];
    const currentDayObj = new Date(year, month, day);
    const isSunday = currentDayObj.getDay() === 0;
    
    staffData.forEach(staff => {
      if (staff.leaves) {
        staff.leaves.forEach(leafObj => {
          const leaf = leafObj.parsed;
          const parsed = parseLeaveDate(leaf);
          
          if (parsed.date && isValidDate(parsed.date) && parsed.date === dateStr) {
            list.push({ 
              name: staff.name, 
              role: staff.role,
              type: parsed.type,
              original: leafObj.original
            });
          }
        });
      }
    });
    
    const nameCounts: Record<string, number> = {};
    list.forEach(item => {
      nameCounts[item.name] = (nameCounts[item.name] || 0) + 1;
    });
    
    return list.map(item => ({
      ...item,
      isDuplicate: nameCounts[item.name] > 1,
      isSunday: isSunday,
      warning: nameCounts[item.name] > 1 
        ? `${item.name}님이 이 날짜에 ${nameCounts[item.name]}번 등록되어 있습니다.` 
        : isSunday
          ? "일요일에 연차가 등록되었습니다."
          : null
    }));
  };

  const getOffsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const list: Array<{
      name: string;
      originalDate: string;
      memo?: string;
    }> = [];

    staffData.forEach(staff => {
      if (staff.offs) {
        staff.offs.forEach(off => {
          if (off.dateParsed === dateStr) {
            list.push({
              name: staff.name,
              originalDate: off.date,
              memo: off.memo
            });
          }
        });
      }
    });
    return list;
  };

  const handleOffClick = async (name: string, originalDate: string, dateStr: string) => {
    if (!session?.isAdmin) return;

    const action = prompt(`${name}님의 오프 (${originalDate}) 관리\n\n1. 수정\n2. 삭제`, "1");
    if (!action) return;

    if (action === "2") {
      if (confirm(`${name}님의 오프를 삭제하시겠습니까?`)) {
        try {
          await deleteOff(name, originalDate);
          onRefresh();
        } catch (e: any) {
          alert("삭제 실패: " + e.message);
        }
      }
    } else if (action === "1") {
      const newDate = prompt("수정할 날짜 (MM/DD):", originalDate);
      if (!newDate || newDate === originalDate) return;
      try {
        await updateOff(name, originalDate, newDate);
        onRefresh();
      } catch (e: any) {
        alert("수정 실패: " + e.message);
      }
    }
  };

  const handleDateClick = async (dateStr: string) => {
    if (!session?.isAdmin) return;

    const type = prompt("추가할 일정을 선택하세요:\n\n1. 연차 (Leave)\n2. 오프 (Off)", "1");
    if (!type) return;

    if (type === "1" || type.toLowerCase() === "leave") {
      handleLeaveAdd(dateStr);
    } else if (type === "2" || type.toLowerCase() === "off") {
      const staffNames = staffData.map(s => s.name).join(', ');
      const name = prompt(`오프를 추가할 직원 이름:\n\n${staffNames}`);
      if (!name) return;
      
      const staff = staffData.find(s => s.name === name.trim());
      if (!staff) {
        alert("존재하지 않는 직원입니다.");
        return;
      }

      const d = new Date(dateStr);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const defaultDate = `${mm}/${dd}`;

      try {
        await addOff(staff.name, defaultDate);
        onRefresh();
      } catch (e: any) {
        alert("오프 추가 실패: " + e.message);
      }
    }
  };

  const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  return (
    <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-2xl shadow-sm border border-[#F0EAE4] dark:border-[#333333] mb-6 transition-colors duration-300">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-[#5C5552] dark:text-[#E0E0E0] flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-[#8D7B68] dark:text-[#A4907C]"/> 
          {year}년 {month + 1}월 일정
        </h3>
        <div className="flex gap-2">
          <button onClick={() => moveMonth(-1)} className="p-1 hover:bg-[#F2EBE5] dark:hover:bg-[#2D2D2D] rounded-full text-[#8D7B68] dark:text-[#A4907C] transition-colors"><ChevronLeft /></button>
          <button onClick={() => setViewDate(new Date())} className="text-sm px-3 py-1 bg-[#F2EBE5] dark:bg-[#2D2D2D] rounded-full text-[#8D7B68] dark:text-[#A4907C] font-bold transition-colors">오늘</button>
          <button onClick={() => moveMonth(1)} className="p-1 hover:bg-[#F2EBE5] dark:hover:bg-[#2D2D2D] rounded-full text-[#8D7B68] dark:text-[#A4907C] transition-colors"><ChevronRight /></button>
        </div>
      </div>

      <WarningBanner session={session} invalidLeaves={invalidLeaves} sundayLeaves={sundayLeaves} />

      <div className="grid grid-cols-7 border-t border-l border-[#F0EAE4] dark:border-[#333333]">
        {weekDays.map((day, i) => (
          <div key={day} className={`text-center text-xs font-bold py-2 border-r border-b border-[#F0EAE4] dark:border-[#333333] bg-[#FDFBF7] dark:bg-[#121212] ${i===0 ? 'text-red-400' : i===6 ? 'text-blue-400' : 'text-[#8D7B68] dark:text-[#A4907C]'}`}>
            {day}
          </div>
        ))}

        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="h-24 border-r border-b border-[#F0EAE4] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1A1A1A]"></div>
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const leaves = getLeavesForDay(day);
          const offs = getOffsForDay(day);
          const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
          const dateObj = new Date(year, month, day);
          const dayOfWeek = dateObj.getDay();

          return (
            <div key={day} className={`h-24 border-r border-b border-[#F0EAE4] dark:border-[#333333] p-1 relative hover:bg-[#FDFBF7] dark:hover:bg-[#252525] transition group ${isToday ? 'bg-[#FFF9F0] dark:bg-[#2C241B]' : ''}`}>
              <div className="flex items-center justify-between px-1">
                <span className={`text-sm font-bold ${dayOfWeek === 0 ? 'text-red-400' : dayOfWeek === 6 ? 'text-blue-400' : 'text-[#5C5552] dark:text-[#A0A0A0]'}`}>
                  {day} {isToday && <span className="text-[10px] bg-[#8D7B68] dark:bg-[#5C4A3A] text-white px-1.5 rounded-full ml-1 align-top">Today</span>}
                  {dayOfWeek === 0 && offs.length > 0 && (
                    <span className="ml-1 text-[10px] text-red-500 font-bold" title="일요일 오프 주의">!</span>
                  )}
                </span>
                {session?.isAdmin && (
                  <button 
                    onClick={() => handleDateClick(dateStr)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[#EBE5DD] dark:hover:bg-[#3D3D3D] text-[#8D7B68] dark:text-[#A4907C] transition-opacity"
                    title="일정 추가"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="mt-1 flex flex-col gap-1 overflow-y-auto max-h-[calc(100%-28px)] custom-scrollbar">
                {leaves.map((person, idx) => (
                  <div key={idx} 
                    className={`text-xs px-1.5 py-0.5 rounded border flex items-center justify-between group/item cursor-pointer transition-colors
                      ${person.isDuplicate
                        ? 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300'
                        : person.isSunday
                          ? 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-200'
                          : 'bg-[#F2EBE5] dark:bg-[#2D2D2D] text-[#5C5552] dark:text-[#E0E0E0] border-[#EBE5DD] dark:border-[#444444] hover:bg-[#EBE5DD] dark:hover:bg-[#3D3D3D]'
                      }`}
                  >
                    <div 
                      onClick={() => handleLeaveClick(person.name, person.original, dateStr)}
                      className="flex-1 flex items-center gap-1 min-w-0 truncate"
                      title={person.warning || `${person.name} (${person.role}) - 클릭하여 수정`}
                    >
                      <strong className="truncate">{person.name}</strong>
                      {person.type === 'AM' && <span className="text-[9px] bg-yellow-200 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200 px-1 rounded shrink-0">AM</span>}
                      {person.type === 'PM' && <span className="text-[9px] bg-orange-200 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200 px-1 rounded shrink-0">PM</span>}
                    </div>
                    {session?.isAdmin && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleLeaveDelete(person.name, person.original); }}
                        className={`opacity-0 group-hover/item:opacity-100 p-0.5 rounded transition-opacity ml-1 shrink-0
                          ${person.isDuplicate 
                            ? 'hover:bg-red-200 dark:hover:bg-red-800/50 text-red-500 hover:text-red-600' 
                            : 'hover:bg-red-100 dark:hover:bg-red-900/30 text-[#DBCCC0] hover:text-red-500 dark:hover:text-red-400'
                          }`}
                        title="삭제"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                
                {offs.map((off, idx) => (
                  <div key={`off-${idx}`} 
                       className="text-[10px] px-1.5 py-0.5 rounded flex justify-between items-center group/off cursor-pointer hover:opacity-80 transition bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                       onClick={(e) => {
                         e.stopPropagation();
                         handleOffClick(off.name, off.originalDate, dateStr);
                       }}
                       title={`${off.name} OFF ${off.memo ? `(${off.memo})` : ''}`}
                  >
                    <div className="flex items-center gap-1 min-w-0 truncate">
                      <span className="font-medium truncate">{off.name}</span>
                      <span className="text-[9px] opacity-75 shrink-0">OFF</span>
                    </div>
                    {session?.isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if(confirm(`${off.name}님의 오프를 삭제하시겠습니까?`)) {
                             deleteOff(off.name, off.originalDate).then(onRefresh).catch(e => alert(e.message));
                          }
                        }}
                         className="opacity-0 group-hover/off:opacity-100 p-0.5 rounded hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-500 hover:text-blue-700 transition-opacity ml-1 shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
