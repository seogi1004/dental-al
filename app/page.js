'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Printer, Plus, RefreshCw, CheckCircle, 
  Calendar, User, FileText, LogOut, X, LogIn, 
  Trash2, Clock, CalendarDays, ChevronLeft, ChevronRight,
  Moon, Sun
} from 'lucide-react';

import { useSession, signIn, signOut } from "next-auth/react";
import { useTheme } from "next-themes";

const theme = {
  bg: "bg-[#FDFBF7] dark:bg-[#121212]",
  paper: "bg-white dark:bg-[#1E1E1E]",
  primary: "bg-[#8D7B68] hover:bg-[#7A6A59] dark:bg-[#6D5B4B] dark:hover:bg-[#5C4A3A]",
  secondary: "bg-[#EBE5DD] hover:bg-[#DBCCC0] text-[#8D7B68] dark:bg-[#2C2C2C] dark:hover:bg-[#3D3D3D] dark:text-[#A4907C]",
  text: "text-[#4A4543] dark:text-[#E0E0E0]",
  border: "border-[#F0EAE4] dark:border-[#333333]",
  accent: "text-[#A4907C] dark:text-[#C4B09C]"
};

export default function DentalLeaveApp() {
  const { data: session, status } = useSession();
  const { theme: currentTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const loadingSession = status === "loading";

  useEffect(() => setMounted(true), []);

  const [activeTab, setActiveTab] = useState('list');
  const [staffData, setStaffData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [saveTimeout, setSaveTimeout] = useState(null);

  // 달력 뷰를 위한 현재 기준 날짜 (월 이동용)
  const [viewDate, setViewDate] = useState(new Date());

  // ==================================================================================
  // Helper: 날짜 관련 유틸리티
  // ==================================================================================
  const getTodayString = () => new Date().toISOString().split('T')[0];
  
  // 날짜 스트링 파싱 (YYYY-MM-DD (TYPE) -> {date, type})
  const parseLeaveDate = (dateStr) => {
    if (!dateStr) return { date: '', type: 'FULL' };
    const match = dateStr.match(/^(\d{4}-\d{2}-\d{2})(?:\s*\((AM|PM)\))?$/);
    if (match) {
        return { date: match[1], type: match[2] || 'FULL' };
    }
    return { date: dateStr, type: 'FULL' }; // fallback
  };

  const formatDate = (dateStr) => {
    const { date, type } = parseLeaveDate(dateStr);
    if (!date || isNaN(new Date(date).getTime())) return dateStr;
    
    const d = new Date(date);
    const week = ['일', '월', '화', '수', '목', '금', '토'];
    const formatted = `${d.getMonth() + 1}/${d.getDate()}(${week[d.getDay()]})`;
    
    return type === 'FULL' ? formatted : `${formatted} ${type}`;
  };

  // 이번 달 리스트 (모바일용)
  const getCurrentMonthLeaves = useCallback(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const leavesList = [];
    staffData.forEach(staff => {
      if (staff.leaves && Array.isArray(staff.leaves)) {
        staff.leaves.forEach(rawDateStr => {
          const { date, type } = parseLeaveDate(rawDateStr);
          const d = new Date(date);
          if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            leavesList.push({
              original: rawDateStr,
              date: date,
              type: type,
              dateObj: d,
              name: staff.name,
              role: staff.role
            });
          }
        });
      }
    });
    return leavesList.sort((a, b) => a.dateObj - b.dateObj);
  }, [staffData]);

  // 오늘 휴가자 추출
  const getTodayLeaves = useCallback(() => {
    const todayStr = getTodayString();
    const list = [];
    
    staffData.forEach(staff => {
        if (staff.leaves) {
            staff.leaves.forEach(leaf => {
                const { date, type } = parseLeaveDate(leaf);
                if (date === todayStr) {
                    list.push({ ...staff, leaveType: type });
                }
            });
        }
    });
    return list;
  }, [staffData]);

  // ==================================================================================
  // API 통신 함수
  // ==================================================================================
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
      setStaffData([]); // 에러 시 빈 배열 처리
      setStatusMsg('데이터 로드 실패');
    } finally {
      setLoading(false);
      setTimeout(() => setStatusMsg(''), 3000);
    }
  }, []);

  const saveSheetData = async (newData) => {
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
      if (!res.ok) throw new Error('Failed to save');
      
      setStatusMsg('저장됨');
      setTimeout(() => setStatusMsg(''), 2000);
    } catch (error) {
      console.error("Save Error:", error);
      setStatusMsg('저장 실패');
    }
  };

  // ==================================================================================
  // 이벤트 핸들러
  // ==================================================================================
  useEffect(() => {
    if (activeTab === 'list') {
      fetchSheetData();
    }
  }, [activeTab, fetchSheetData]);

  const handleUpdate = (index, field, value) => {
    if (!session) return; 

    const newData = [...staffData];
    newData[index][field] = value;
    
    if (field === 'date' && value) {
      const joinDate = new Date(value);
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
  };

  const handleBlur = () => {
    if (!session) return;
    if (saveTimeout) clearTimeout(saveTimeout);
    saveSheetData(staffData);
  };

  const addStaff = () => {
    if (!session) {
      alert("로그인이 필요한 기능입니다.");
      return;
    }
    const newItem = {
      name: "", 
      role: "사원", 
      date: new Date().toISOString().split('T')[0],
      total: 11, 
      used: 0, 
      memo: "",
      leaves: [],
      isNew: true 
    };
    const newData = [...staffData, newItem];
    setStaffData(newData);
    saveSheetData(newData);
  };

  const deleteStaff = (index) => {
    if (!session) return;
    if (confirm("정말 삭제하시겠습니까?")) {
      const newData = staffData.filter((_, i) => i !== index);
      setStaffData(newData);
      saveSheetData(newData);
    }
  };

  // ==================================================================================
  // 컴포넌트: 대시보드 위젯
  // ==================================================================================
  
  // 1. 오늘의 현황 카드 (공통)
  const TodayStatusCard = () => {
    const todayLeaves = getTodayLeaves();
    return (
      <div className="bg-[#8D7B68] dark:bg-[#5C4A3A] text-white p-5 rounded-2xl shadow-lg flex items-center justify-between mb-4 h-full transition-colors duration-300">
        <div>
          <h3 className="text-sm opacity-90 mb-1 flex items-center gap-1"><Clock className="w-4 h-4"/> 오늘의 현황</h3>
          <p className="text-2xl font-bold">
            {todayLeaves.length > 0 ? `${todayLeaves.length}명 휴가 중` : "전원 출근"}
          </p>
          {todayLeaves.length > 0 && (
             <div className="text-xs mt-2 opacity-80 flex flex-wrap gap-2">
                {todayLeaves.map((p, i) => (
                    <span key={i} className="flex items-center gap-1">
                        {p.name}
                        {p.leaveType === 'AM' && <span className="bg-white/20 px-1 rounded text-[10px]">AM</span>}
                        {p.leaveType === 'PM' && <span className="bg-white/20 px-1 rounded text-[10px]">PM</span>}
                        {i < todayLeaves.length - 1 && <span>,</span>}
                    </span>
                ))}
             </div>
          )}
        </div>
        <div className="bg-white/20 p-3 rounded-full">
           <CheckCircle className="w-6 h-6 text-white" />
        </div>
      </div>
    );
  };

  // 2. 모바일용 리스트 뷰
  const MobileScheduleList = () => {
    const leaves = getCurrentMonthLeaves();
    const todayMonth = new Date().getMonth() + 1;

    return (
      <div className="bg-white dark:bg-[#1E1E1E] p-5 rounded-2xl shadow-sm border border-[#F0EAE4] dark:border-[#333333] mb-6 transition-colors duration-300">
        <h3 className="text-[#5C5552] dark:text-[#E0E0E0] font-bold mb-4 flex items-center gap-2 text-lg">
          <CalendarDays className="w-5 h-5 text-[#8D7B68] dark:text-[#A4907C]"/> {todayMonth}월 연차 일정
        </h3>
        
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
                <div key={idx} className={`flex items-center justify-between p-3 rounded-xl transition-colors duration-300 ${isPast ? 'bg-[#F5F5F5] dark:bg-[#2A2A2A] opacity-60' : 'bg-[#FDFBF7] dark:bg-[#121212] border border-[#EBE5DD] dark:border-[#444444]'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${isPast ? 'text-gray-500 dark:text-gray-400' : 'text-[#8D7B68] dark:text-[#A4907C]'}`}>
                      {formatDate(item.original)}
                    </span>
                    <div className="h-4 w-[1px] bg-[#EBE5DD] dark:bg-[#444444]"></div>
                    <span className="text-[#5C5552] dark:text-[#E0E0E0] font-medium">{item.name}</span>
                    <span className="text-xs text-[#A4907C] dark:text-[#C4B09C] bg-white dark:bg-[#2C2C2C] px-1.5 py-0.5 rounded border border-[#EBE5DD] dark:border-[#444444]">{item.role}</span>
                    {item.type !== 'FULL' && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${badgeColor}`}>{item.type}</span>
                    )}
                  </div>
                  {item.date === getTodayString() && (
                    <span className="text-xs bg-[#8D7B68] dark:bg-[#5C4A3A] text-white px-2 py-1 rounded-full font-bold">Today</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // 3. 데스크탑용 캘린더 뷰
  const DesktopCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth(); // 0 ~ 11

    // 달력 계산
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0(일) ~ 6(토)
    const daysInMonth = new Date(year, month + 1, 0).getDate(); // 마지막 날짜

    // 이전/다음 달 이동
    const moveMonth = (delta) => {
      const newDate = new Date(viewDate);
      newDate.setMonth(newDate.getMonth() + delta);
      setViewDate(newDate);
    };

    // 해당 날짜에 휴가인 사람 찾기
    const getLeavesForDay = (day) => {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const list = [];
      staffData.forEach(staff => {
        if (staff.leaves) {
            staff.leaves.forEach(leaf => {
                const parsed = parseLeaveDate(leaf);
                if (parsed.date === dateStr) {
                    list.push({ 
                        name: staff.name, 
                        role: staff.role,
                        type: parsed.type 
                    });
                }
            });
        }
      });
      return list;
    };

    const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    return (
      <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-2xl shadow-sm border border-[#F0EAE4] dark:border-[#333333] mb-6 transition-colors duration-300">
        {/* 달력 헤더 */}
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

        {/* 달력 그리드 */}
        <div className="grid grid-cols-7 border-t border-l border-[#F0EAE4] dark:border-[#333333]">
            {/* 요일 헤더 */}
            {weekDays.map((day, i) => (
                <div key={day} className={`text-center text-xs font-bold py-2 border-r border-b border-[#F0EAE4] dark:border-[#333333] bg-[#FDFBF7] dark:bg-[#121212] ${i===0 ? 'text-red-400' : i===6 ? 'text-blue-400' : 'text-[#8D7B68] dark:text-[#A4907C]'}`}>
                    {day}
                </div>
            ))}

            {/* 빈 칸 (월 시작 전) */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="h-24 border-r border-b border-[#F0EAE4] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1A1A1A]"></div>
            ))}

            {/* 날짜 셀 */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const leaves = getLeavesForDay(day);
                const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
                const dateObj = new Date(year, month, day);
                const dayOfWeek = dateObj.getDay();

                return (
                    <div key={day} className={`h-24 border-r border-b border-[#F0EAE4] dark:border-[#333333] p-1 relative hover:bg-[#FDFBF7] dark:hover:bg-[#252525] transition group ${isToday ? 'bg-[#FFF9F0] dark:bg-[#2C241B]' : ''}`}>
                        <span className={`text-sm font-bold absolute top-1 left-2 ${dayOfWeek === 0 ? 'text-red-400' : dayOfWeek === 6 ? 'text-blue-400' : 'text-[#5C5552] dark:text-[#A0A0A0]'}`}>
                            {day} {isToday && <span className="text-[10px] bg-[#8D7B68] dark:bg-[#5C4A3A] text-white px-1.5 rounded-full ml-1 align-top">Today</span>}
                        </span>
                        
                        <div className="mt-6 flex flex-col gap-1 overflow-y-auto max-h-[calc(100%-24px)] custom-scrollbar">
                            {leaves.map((person, idx) => (
                                <div key={idx} className="text-xs bg-[#F2EBE5] dark:bg-[#2D2D2D] text-[#5C5552] dark:text-[#E0E0E0] px-1.5 py-0.5 rounded border border-[#EBE5DD] dark:border-[#444444] truncate flex items-center justify-between" title={`${person.name} (${person.role})`}>
                                    <div>
                                        <strong>{person.name}</strong> <span className="opacity-70 text-[10px]">{person.role}</span>
                                    </div>
                                    {person.type === 'AM' && <span className="text-[9px] bg-yellow-200 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200 px-1 rounded ml-1">AM</span>}
                                    {person.type === 'PM' && <span className="text-[9px] bg-orange-200 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200 px-1 rounded ml-1">PM</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    );
  };

  // 4. 도움말 패널 (데스크탑 우측)
  const HelpPanel = () => {
    return (
      <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-2xl shadow-sm border border-[#F0EAE4] dark:border-[#333333] sticky top-6 h-fit transition-colors duration-300">
        <h3 className="font-bold text-lg mb-4 text-[#5C5552] dark:text-[#E0E0E0] flex items-center gap-2">
            <span className="bg-[#EBE5DD] dark:bg-[#444444] p-1 rounded">💡</span> 사용 가이드
        </h3>
        
        <div className="space-y-6 text-sm text-[#5C5552] dark:text-[#A0A0A0]">
            
            {/* 섹션 1 */}
            <div>
                <h4 className="font-bold text-[#8D7B68] dark:text-[#A4907C] mb-2 flex items-center gap-2">
                    1. 역할 분리
                </h4>
                <ul className="list-disc pl-4 space-y-1">
                    <li><strong className="text-[#5C5552] dark:text-[#E0E0E0]">웹 (여기)</strong>: 조회, 직원 관리(추가/삭제), 신청서 인쇄</li>
                    <li><strong className="text-green-600 dark:text-green-400">구글 시트</strong>: 실제 연차 날짜 입력 및 수정</li>
                </ul>
            </div>

            <div className="h-px bg-[#F0EAE4] dark:bg-[#333333]"></div>

            {/* 섹션 2 */}
            <div>
                <h4 className="font-bold text-[#8D7B68] dark:text-[#A4907C] mb-2">
                    2. 연차 등록 방법
                </h4>
                <p className="mb-2">구글 시트의 <span className="bg-[#F2EBE5] dark:bg-[#2D2D2D] px-1 rounded text-xs font-mono">2026년</span> 탭에 날짜를 입력하세요.</p>
                <div className="bg-[#FDFBF7] dark:bg-[#121212] p-3 rounded-lg border border-[#F0EAE4] dark:border-[#333333] space-y-2 font-mono text-xs">
                    <div className="flex justify-between">
                        <span>종일 연차</span>
                        <span className="font-bold text-[#5C5552] dark:text-[#E0E0E0]">01/15</span>
                    </div>
                    <div className="flex justify-between text-yellow-700 dark:text-yellow-400">
                        <span>오전 반차</span>
                        <span className="font-bold">01/15 AM</span>
                    </div>
                    <div className="flex justify-between text-orange-700 dark:text-orange-400">
                        <span>오후 반차</span>
                        <span className="font-bold">01/15 PM</span>
                    </div>
                </div>
            </div>

            <div className="h-px bg-[#F0EAE4] dark:bg-[#333333]"></div>

            {/* 섹션 3 */}
            <div>
                <h4 className="font-bold text-[#8D7B68] dark:text-[#A4907C] mb-2">
                    3. 주의사항
                </h4>
                <ul className="list-disc pl-4 space-y-1">
                    <li>직원 이름은 <strong>수정 불가</strong>합니다. (데이터 연결 기준)</li>
                    <li>오타 발생 시 삭제 후 다시 추가해주세요.</li>
                    <li>시트 데이터는 <strong>1초 후 자동 동기화</strong>됩니다.</li>
                </ul>
            </div>

            <a 
                href={`https://docs.google.com/spreadsheets/d/1dmMlb4IxUQO9AZBVSAgS72cXDJqWDLicx-FL0IzH5Eo/edit#gid=191374435`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-[#29A744] hover:bg-[#23903A] text-white font-bold py-3 rounded-xl transition shadow-md flex items-center justify-center gap-2 mt-4"
            >
                <FileText className="w-4 h-4" /> 구글 시트 바로가기
            </a>

        </div>
      </div>
    );
  };

  // ==================================================================================
  // 렌더링
  // ==================================================================================

  if (loadingSession) {
    return <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] dark:bg-[#121212] text-[#8D7B68] dark:text-[#A4907C]">로딩 중...</div>;
  }

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} p-4 md:p-8 flex justify-center font-sans transition-colors duration-300`}>
      <div className={`w-full max-w-6xl ${theme.paper} rounded-3xl shadow-xl overflow-hidden border ${theme.border} min-h-[850px] transition-colors duration-300`}>
        
        {/* 헤더 */}
        <div className="bg-[#8D7B68] dark:bg-[#5C4A3A] p-6 text-white flex flex-col md:flex-row justify-between items-center shadow-md print:hidden transition-colors duration-300">
            <h1 className="text-2xl font-bold flex items-center gap-3 tracking-wide">
                <span className="text-[#FDFBF7]">더데이치과</span> 
                <span className="text-[#EBE5DD] font-light text-lg opacity-80 hidden md:inline">| 연차 관리 시스템</span>
            </h1>
            
            <div className="flex gap-3 mt-4 md:mt-0 items-center">
                <div className="bg-[#7A6A59] dark:bg-[#4A3B2F] p-1.5 rounded-full shadow-inner flex transition-colors duration-300">
                  <button 
                    onClick={() => setActiveTab('list')} 
                    className={`px-6 py-2 rounded-full transition-all duration-300 text-sm font-bold flex items-center gap-2 ${activeTab === 'list' ? 'bg-[#FDFBF7] dark:bg-[#2C2C2C] text-[#8D7B68] dark:text-[#A4907C] shadow-sm' : 'text-[#EBE5DD] hover:bg-[#6B5D4D] dark:hover:bg-[#3D3D3D]'}`}
                  >
                    <Calendar className="w-4 h-4" /> 현황표
                  </button>
                  <button 
                    onClick={() => setActiveTab('form')} 
                    className={`hidden md:flex px-6 py-2 rounded-full transition-all duration-300 text-sm font-bold items-center gap-2 ${activeTab === 'form' ? 'bg-[#FDFBF7] dark:bg-[#2C2C2C] text-[#8D7B68] dark:text-[#A4907C] shadow-sm' : 'text-[#EBE5DD] hover:bg-[#6B5D4D] dark:hover:bg-[#3D3D3D]'}`}
                  >
                    <FileText className="w-4 h-4" /> 신청서
                  </button>
                </div>

                <button 
                  onClick={() => setTheme(currentTheme === 'dark' ? 'light' : 'dark')}
                  className="ml-2 bg-[#7A6A59] dark:bg-[#4A3B2F] hover:bg-[#6B5D4D] text-[#EBE5DD] hover:text-white p-2.5 rounded-full transition shadow-sm"
                >
                  {mounted && currentTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                
                {session ? (
                  <button onClick={() => signOut()} className="ml-2 bg-[#7A6A59] dark:bg-[#4A3B2F] hover:bg-[#6B5D4D] text-white p-2.5 rounded-full transition shadow-sm" title="로그아웃">
                      <LogOut className="w-5 h-5" />
                  </button>
                ) : (
                  <button onClick={() => signIn("google")} className="ml-2 bg-[#7A6A59] dark:bg-[#4A3B2F] hover:bg-[#6B5D4D] text-[#EBE5DD] hover:text-white px-4 py-2 rounded-full transition text-sm font-bold flex items-center gap-2 shadow-sm">
                    <LogIn className="w-4 h-4" /> 로그인
                  </button>
                )}
            </div>
        </div>

        {/* 탭 1: 연차 현황표 */}
        {activeTab === 'list' && (
          <div className="p-4 md:p-8 bg-[#FDFBF7] dark:bg-[#121212] h-full transition-colors duration-300">
            <div className="w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 좌측 메인 컨텐츠 (9/12) */}
                <div className="lg:col-span-9">
                    {/* 1. 모바일 뷰 (< md) */}
                    <div className="md:hidden mb-6">
                       <div className="mb-4"><TodayStatusCard /></div>
                       <MobileScheduleList />
                    </div>

                    {/* 2. 데스크탑 뷰 (>= md) */}
                    <div className="hidden md:block space-y-6">
                        <div className="grid grid-cols-4 gap-6">
                            <div className="col-span-2">
                                <TodayStatusCard />
                            </div>
                            <div className="col-span-2">
                                 <div className="h-full bg-white dark:bg-[#1E1E1E] rounded-2xl border border-[#F0EAE4] dark:border-[#333333] p-5 flex items-center justify-center text-[#DBCCC0] dark:text-[#444444] font-medium transition-colors">
                                    오늘도 좋은 하루 보내세요! ✨
                                 </div>
                            </div>
                        </div>
                        {/* 데스크탑은 큰 달력 표시 */}
                        <DesktopCalendar />
                    </div>

                    {/* 메인 직원 리스트 (공통 - 테이블/카드 변환) */}
                    <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-sm p-4 md:p-8 border border-[#F0EAE4] dark:border-[#333333] transition-colors duration-300 mt-6">
                        <div className="flex justify-between items-end mb-6 pb-6 border-b border-[#F0EAE4] dark:border-[#333333]">
                            <div>
                                <h2 className="text-xl md:text-2xl font-bold text-[#5C5552] dark:text-[#E0E0E0] flex items-center gap-2">
                                   <User className="w-6 h-6 text-[#A4907C] dark:text-[#C4B09C]" /> 
                                   <span className="hidden md:inline">직원 연차 리스트</span>
                                   <span className="md:hidden">직원 리스트</span>
                                </h2>
                                <p className="text-[#A4907C] dark:text-[#C4B09C] text-xs md:text-sm mt-2 flex items-center gap-2">
                                    {statusMsg ? (
                                        <span className="flex items-center gap-1 text-green-600 font-medium"><CheckCircle className="w-4 h-4"/> {statusMsg}</span>
                                    ) : (
                                        <span className="flex items-center gap-1"><RefreshCw className="w-4 h-4"/> 자동 동기화</span>
                                    )}
                                </p>
                            </div>
                            {session && (
                              <button onClick={addStaff} className={`${theme.primary} text-white px-4 py-2 md:px-5 md:py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-md transition`}>
                                  <Plus className="w-4 h-4" /> <span className="hidden md:inline">직원 추가</span><span className="md:hidden">추가</span>
                              </button>
                            )}
                        </div>

                        {loading ? (
                            <div className="py-20 text-center text-[#8D7B68] dark:text-[#A4907C] animate-pulse">데이터를 불러오는 중입니다...</div>
                        ) : (
                            <>
                              {/* ======================= */}
                              {/* 데스크탑 뷰 (테이블) */}
                              {/* ======================= */}
                              <div className="hidden md:block overflow-x-auto rounded-xl border border-[#F0EAE4] dark:border-[#333333]">
                                  <table className="w-full text-xs text-left text-[#5C5552] dark:text-[#E0E0E0]">
                                      <thead className="text-[11px] text-[#8D7B68] dark:text-[#A4907C] uppercase bg-[#F2EBE5] dark:bg-[#2D2D2D]">
                                          <tr>
                                              <th className="px-2 py-3 text-center w-10 font-bold">No</th>
                                              <th className="px-2 py-3 font-bold">성명</th>
                                              <th className="px-2 py-3 font-bold">직급</th>
                                              <th className="px-2 py-3 w-28 font-bold">입사일</th>
                                              <th className="px-2 py-3 text-center bg-[#EBE5DD] dark:bg-[#444444] font-bold">발생</th>
                                              <th className="px-2 py-3 text-center bg-[#F5E6E6] dark:bg-[#4A3A3A] text-[#A66E6E] dark:text-[#E68A8A] font-bold">사용</th>
                                              <th className="px-2 py-3 text-center bg-[#E6F0E6] dark:bg-[#3A4A3E] text-[#6E9675] dark:text-[#8EBE95] font-bold">잔여</th>
                                              <th className="px-2 py-3 font-bold min-w-[150px]">비고</th>
                                              {session && <th className="px-2 py-3 text-center w-12 font-bold">관리</th>}
                                          </tr>
                                      </thead>
                                      <tbody className="divide-y divide-[#F0EAE4] dark:divide-[#333333]">
                                          {staffData.map((staff, index) => {
                                              // Calculate used days from leaves array (0.5 for AM/PM)
                                              const calculatedUsed = staff.leaves ? staff.leaves.reduce((acc, date) => {
                                                  const { type } = parseLeaveDate(date);
                                                  return acc + (type === 'FULL' ? 1 : 0.5);
                                              }, 0) : 0;
                                              
                                              const remain = (parseFloat(staff.total) || 0) - calculatedUsed;
                                              const isSessionActive = !!session;
                                              
                                              return (
                                                  <tr key={index} className="bg-white dark:bg-[#1E1E1E] hover:bg-[#F9F7F2] dark:hover:bg-[#252525] transition">
                                                      <td className="px-2 py-3 text-center text-[#A4907C] dark:text-[#C4B09C]">{index + 1}</td>
                                                      <td className="px-2 py-3">
                                                          <input type="text" value={staff.name} 
                                                              onChange={(e) => handleUpdate(index, 'name', e.target.value)} 
                                                              onBlur={handleBlur} 
                                                              readOnly={!staff.isNew} // 기존 직원은 수정 불가
                                                              className={`w-16 bg-transparent outline-none border-b ${staff.isNew ? 'border-[#8D7B68] focus:border-[#8D7B68] dark:focus:border-[#A4907C] cursor-text' : 'border-transparent cursor-default opacity-80'} placeholder-[#DBCCC0]`} 
                                                              placeholder="이름" 
                                                          />
                                                      </td>
                                                      <td className="px-2 py-3">
                                                          <input type="text" value={staff.role} 
                                                              onChange={(e) => handleUpdate(index, 'role', e.target.value)} 
                                                              onBlur={handleBlur} 
                                                              readOnly={!isSessionActive}
                                                              className={`w-14 bg-transparent outline-none border-b focus:border-[#8D7B68] dark:focus:border-[#A4907C] text-[#8D8D8D] dark:text-[#A0A0A0] ${!isSessionActive ? 'border-transparent cursor-default' : 'border-transparent'}`}
                                                              placeholder="직급" 
                                                          />
                                                      </td>
                                                      <td className="px-2 py-3">
                                                          <input type="date" value={staff.date} 
                                                              onChange={(e) => handleUpdate(index, 'date', e.target.value)} 
                                                              onBlur={handleBlur} 
                                                              readOnly={!isSessionActive}
                                                              className={`w-full bg-transparent outline-none text-[#5C5552] dark:text-[#E0E0E0] ${!isSessionActive ? 'cursor-default' : 'cursor-pointer'}`}
                                                          />
                                                      </td>
                                                      <td className="px-2 py-3 text-center">
                                                          <input type="number" value={staff.total} 
                                                              readOnly={true} 
                                                              className="w-10 text-center rounded py-1 outline-none font-bold bg-transparent border-none text-[#5C5552] dark:text-[#E0E0E0] cursor-default" 
                                                          />
                                                      </td>
                                                      <td className="px-2 py-3 text-center">
                                                          <span className="font-bold text-[#A66E6E] dark:text-[#E68A8A] block w-10 text-center mx-auto">{calculatedUsed}</span>
                                                      </td>
                                                      <td className="px-2 py-3 text-center">
                                                          <span className={`font-bold ${remain <= 0 ? 'text-[#A66E6E] dark:text-[#E68A8A]' : 'text-[#6E9675] dark:text-[#8EBE95]'}`}>{remain}</span>
                                                      </td>
                                                      <td className="px-2 py-3">
                                                          <input type="text" value={staff.memo} 
                                                              onChange={(e) => handleUpdate(index, 'memo', e.target.value)} 
                                                              onBlur={handleBlur} 
                                                              readOnly={!isSessionActive}
                                                              className="w-full bg-transparent outline-none text-[#8D8D8D] dark:text-[#A0A0A0] min-w-[150px]" 
                                                              placeholder="메모" 
                                                          />
                                                      </td>
                                                      {session && (
                                                        <td className="px-2 py-3 text-center">
                                                            <button onClick={() => deleteStaff(index)} className="text-[#DBCCC0] hover:text-[#A66E6E] p-1 transition">
                                                                <X className="w-4 h-4"/>
                                                            </button>
                                                        </td>
                                                      )}
                                                  </tr>
                                              );
                                          })}
                                      </tbody>
                                  </table>
                              </div>

                              {/* ======================= */}
                              {/* 모바일 뷰 (카드 리스트) */}
                              {/* ======================= */}
                              <div className="md:hidden space-y-4">
                                {staffData.map((staff, index) => {
                                   const calculatedUsed = staff.leaves ? staff.leaves.reduce((acc, date) => {
                                       const { type } = parseLeaveDate(date);
                                       return acc + (type === 'FULL' ? 1 : 0.5);
                                   }, 0) : 0;
                                   const remain = (parseFloat(staff.total) || 0) - calculatedUsed;
                                   const isSessionActive = !!session;

                                   return (
                                     <div key={index} className="bg-white dark:bg-[#1E1E1E] p-5 rounded-2xl shadow-sm border border-[#F0EAE4] dark:border-[#333333] flex flex-col gap-3 relative transition-colors duration-300">
                                        <div className="flex justify-between items-start">
                                           <div className="flex items-end gap-2">
                                             <input type="text" value={staff.name} 
                                                 onChange={(e) => handleUpdate(index, 'name', e.target.value)} 
                                                 onBlur={handleBlur} 
                                                 readOnly={!staff.isNew}
                                                 className={`text-lg font-bold w-20 bg-transparent outline-none border-b ${staff.isNew ? 'border-[#8D7B68] dark:border-[#A4907C] focus:border-[#8D7B68]' : 'border-transparent'} placeholder-[#DBCCC0] text-[#5C5552] dark:text-[#E0E0E0]`}
                                                 placeholder="이름"
                                              />
                                             <input type="text" value={staff.role} 
                                                 onChange={(e) => handleUpdate(index, 'role', e.target.value)} 
                                                 onBlur={handleBlur} 
                                                 readOnly={!isSessionActive}
                                                 className="text-sm text-[#8D8D8D] dark:text-[#A0A0A0] w-16 bg-transparent outline-none focus:text-[#5C5552] dark:focus:text-[#E0E0E0]"
                                                 placeholder="직급"
                                              />
                                           </div>
                                           {session && (
                                             <button onClick={() => deleteStaff(index)} className="text-[#DBCCC0] hover:text-[#A66E6E] p-1">
                                                <Trash2 className="w-4 h-4"/>
                                             </button>
                                           )}
                                        </div>

                                        <div className="flex items-center gap-2 text-sm text-[#8D7B68] dark:text-[#A4907C]">
                                           <span className="text-xs bg-[#F2EBE5] dark:bg-[#2D2D2D] px-2 py-0.5 rounded text-[#8D7B68] dark:text-[#A4907C]">입사일</span>
                                           <input type="date" value={staff.date} 
                                                onChange={(e) => handleUpdate(index, 'date', e.target.value)} 
                                                onBlur={handleBlur} 
                                                readOnly={!isSessionActive}
                                                className="bg-transparent outline-none text-[#5C5552] dark:text-[#E0E0E0] text-sm w-32"
                                           />
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 mt-2">
                                           <div className="bg-[#F8F6F4] dark:bg-[#2A2A2A] p-2 rounded-xl text-center">
                                              <div className="text-xs text-[#8D7B68] dark:text-[#A4907C] mb-1">발생</div>
                                              <div className="font-bold text-[#5C5552] dark:text-[#E0E0E0]">{staff.total}</div>
                                           </div>
                                           <div className="bg-[#FCF5F5] dark:bg-[#2E2525] p-2 rounded-xl text-center">
                                              <div className="text-xs text-[#A66E6E] dark:text-[#E68A8A] mb-1">사용</div>
                                              <div className="font-bold text-[#A66E6E] dark:text-[#E68A8A]">{calculatedUsed}</div>
                                           </div>
                                           <div className="bg-[#EEF5EF] dark:bg-[#252E27] p-2 rounded-xl text-center">
                                              <div className="text-xs text-[#6E9675] dark:text-[#8EBE95] mb-1">잔여</div>
                                              <div className={`font-bold ${remain <= 0 ? 'text-[#A66E6E] dark:text-[#E68A8A]' : 'text-[#6E9675] dark:text-[#8EBE95]'}`}>{remain}</div>
                                           </div>
                                        </div>

                                        <div className="mt-2 pt-2 border-t border-[#F0EAE4] dark:border-[#333333]">
                                          <input type="text" value={staff.memo} 
                                              onChange={(e) => handleUpdate(index, 'memo', e.target.value)} 
                                              onBlur={handleBlur} 
                                              readOnly={!isSessionActive}
                                              className="w-full text-sm bg-transparent outline-none text-[#8D8D8D] dark:text-[#A0A0A0] placeholder-gray-300 dark:placeholder-gray-600" 
                                              placeholder="메모를 입력하세요..." 
                                          />
                                        </div>
                                     </div>
                                   );
                                })}
                              </div>
                            </>
                        )}
                    </div>
                </div>

                {/* 우측 사이드바 (도움말 패널) (3/12) */}
                <div className="hidden lg:block lg:col-span-3">
                    <HelpPanel />
                </div>
            </div>
          </div>
        )}
        {/* 탭 2: 연차 신청서 (데스크탑 전용) */}
        {activeTab === 'form' && (
          <div className="p-8 bg-[#FDFBF7] flex flex-col items-center">
             <div className="w-full flex justify-end mb-6 print:hidden">
                <button onClick={() => window.print()} className={`flex items-center gap-2 ${theme.primary} text-white px-5 py-2.5 rounded-xl transition shadow-md text-sm font-bold`}>
                    <Printer className="w-4 h-4" /> 인쇄하기
                </button>
            </div>

            <div className="bg-white p-[15mm] w-[210mm] min-h-[297mm] shadow-lg mx-auto text-[#333] relative rounded-sm print:shadow-none print:w-full print:m-0">
                <h2 className="text-3xl font-bold text-center underline underline-offset-8 mb-10 tracking-widest text-[#222] font-serif">연차(휴가) 신청서</h2>
                
                <div className="flex justify-end mb-8">
                    <table className="border border-gray-800 text-center text-sm w-64">
                        <tbody>
                        <tr>
                            <th rowSpan="2" className="bg-gray-100 border border-gray-800 px-2 py-4 w-10 writing-vertical font-serif">결<br/>재</th>
                            <td className="border border-gray-800 py-1">담 당</td>
                            <td className="border border-gray-800 py-1">실 장</td>
                            <td className="border border-gray-800 py-1">원 장</td>
                        </tr>
                        <tr>
                            <td className="border border-gray-800 h-16"></td>
                            <td className="border border-gray-800 h-16"></td>
                            <td className="border border-gray-800 h-16"></td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                <table className="w-full border-collapse border border-gray-800 mb-6 text-sm">
                    <tbody>
                    <tr>
                        <th className="border border-gray-800 bg-gray-50 p-3 w-28 font-bold text-gray-800">성 명</th>
                        <td className="border border-gray-800 p-2"><input type="text" className="w-full p-1 outline-none font-medium" placeholder="이름 입력" /></td>
                        <th className="border border-gray-800 bg-gray-50 p-3 w-28 font-bold text-gray-800">소 속</th>
                        <td className="border border-gray-800 p-2">
                            <select className="w-full p-1 outline-none bg-transparent appearance-none">
                                <option>진료팀</option><option>데스크팀</option><option>기공실</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th className="border border-gray-800 bg-gray-50 p-3 font-bold text-gray-800">비상연락</th>
                        <td colSpan="3" className="border border-gray-800 p-2"><input type="text" className="w-full p-1 outline-none" placeholder="010-0000-0000" /></td>
                    </tr>
                    <tr>
                        <th className="border border-gray-800 bg-gray-50 p-3 font-bold text-gray-800">종 류</th>
                        <td colSpan="3" className="border border-gray-800 p-3">
                            <div className="flex gap-6">
                                {['연차', '반차', '병가', '경조사', '기타'].map(type => (
                                    <label key={type} className="flex items-center gap-1 cursor-pointer">
                                        <input type="checkbox" className="w-4 h-4 accent-gray-600" /> {type}
                                    </label>
                                ))}
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <th className="border border-gray-800 bg-gray-50 p-3 font-bold text-gray-800">기 간</th>
                        <td colSpan="3" className="border border-gray-800 p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <input type="date" className="border px-2 py-1 rounded border-gray-300" /> ~ <input type="date" className="border px-2 py-1 rounded border-gray-300" />
                                <span className="ml-4">( 총 <input type="text" className="w-10 text-center border-b border-gray-800 outline-none" /> 일간 )</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">※ 반차 시간: <input type="time" className="border px-1 rounded"/> ~ <input type="time" className="border px-1 rounded"/></div>
                        </td>
                    </tr>
                    <tr>
                        <th className="border border-gray-800 bg-gray-50 p-3 font-bold text-gray-800">사 유</th>
                        <td colSpan="3" className="border border-gray-800 p-3 h-32 align-top">
                            <textarea className="w-full h-full p-1 outline-none resize-none" placeholder="사유를 기재해 주세요"></textarea>
                        </td>
                    </tr>
                    <tr>
                        <th className="border border-gray-800 bg-gray-50 p-3 font-bold text-gray-800">인수인계</th>
                        <td colSpan="3" className="border border-gray-800 p-3 h-32 align-top">
                            <textarea className="w-full h-full p-1 outline-none resize-none" placeholder="1. 예약 변경 건: &#13;&#10;2. 전달 사항:"></textarea>
                        </td>
                    </tr>
                    </tbody>
                </table>
                
                <div className="text-center mt-16">
                    <p className="text-lg mb-8 font-medium font-serif text-gray-800">2026년 &nbsp;&nbsp;&nbsp;&nbsp;월 &nbsp;&nbsp;&nbsp;&nbsp;일</p>
                    <div className="flex justify-center items-center gap-4 mb-16">
                        <span className="text-lg font-bold font-serif text-gray-800">신 청 인 :</span>
                        <input type="text" className="text-xl text-center border-b border-gray-800 w-32 outline-none font-serif" />
                        <span className="text-lg font-bold font-serif text-gray-800">(인)</span>
                    </div>
                    <h3 className="text-3xl font-bold tracking-[0.2em] font-serif text-gray-900">더데이치과 귀중</h3>
                </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
