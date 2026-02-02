'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Printer, Plus, RefreshCw, CheckCircle, 
  Calendar, User, FileText, LogOut, X, LogIn, 
  Trash2, Clock, CalendarDays, ChevronLeft, ChevronRight
} from 'lucide-react';

import { useSession, signIn, signOut } from "next-auth/react";

const theme = {
  bg: "bg-[#FDFBF7]",
  paper: "bg-white",
  primary: "bg-[#8D7B68] hover:bg-[#7A6A59]",
  secondary: "bg-[#EBE5DD] hover:bg-[#DBCCC0] text-[#8D7B68]",
  text: "text-[#4A4543]",
  border: "border-[#F0EAE4]",
  accent: "text-[#A4907C]"
};

// [시뮬레이션 데이터]
const MOCK_DB_DATA = [
  { 
    name: "최지원", 
    role: "실장", 
    date: "2018-03-01", 
    total: 18, 
    used: 5, 
    memo: "", 
    leaves: ["2026-02-03", "2026-02-04", "2026-02-20"] 
  },
  { 
    name: "홍재석", 
    role: "원장", 
    date: "2015-01-01", 
    total: 0, 
    used: 0, 
    memo: "", 
    leaves: ["2026-02-14"] 
  },
  { 
    name: "김민지", 
    role: "치위생사", 
    date: "2024-01-10", 
    total: 15, 
    used: 2, 
    memo: "", 
    leaves: ["2026-02-03", "2026-02-10"] 
  }
];

export default function DentalLeaveApp() {
  const { data: session, status } = useSession();
  const loadingSession = status === "loading";

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
  
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const week = ['일', '월', '화', '수', '목', '금', '토'];
    return `${d.getMonth() + 1}/${d.getDate()}(${week[d.getDay()]})`;
  };

  // 이번 달 리스트 (모바일용)
  const getCurrentMonthLeaves = useCallback(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const leavesList = [];
    staffData.forEach(staff => {
      if (staff.leaves && Array.isArray(staff.leaves)) {
        staff.leaves.forEach(dateStr => {
          const d = new Date(dateStr);
          if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            leavesList.push({
              date: dateStr,
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
    return staffData.filter(staff => staff.leaves?.includes(todayStr));
  }, [staffData]);

  // ==================================================================================
  // API 통신 함수
  // ==================================================================================
  const fetchSheetData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sheets'); 
      if (!res.ok) {
        setStaffData(MOCK_DB_DATA); 
        setStatusMsg('데이터 로드 완료 (데모)');
        return;
      }
      const data = await res.json();
      setStaffData(data && data.length > 0 ? data : []);
      setStatusMsg('동기화 완료');
    } catch (error) {
      console.error("Fetch Error:", error);
      setStaffData(MOCK_DB_DATA);
      setStatusMsg('연결 오류 (데모 모드)');
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
      role: "직원", 
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
      <div className="bg-[#8D7B68] text-white p-5 rounded-2xl shadow-lg flex items-center justify-between mb-4 h-full">
        <div>
          <h3 className="text-sm opacity-90 mb-1 flex items-center gap-1"><Clock className="w-4 h-4"/> 오늘의 현황</h3>
          <p className="text-2xl font-bold">
            {todayLeaves.length > 0 ? `${todayLeaves.length}명 휴가 중` : "전원 출근"}
          </p>
          {todayLeaves.length > 0 && (
             <div className="text-xs mt-2 opacity-80">
                {todayLeaves.map(p => p.name).join(', ')}
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
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#F0EAE4] mb-6">
        <h3 className="text-[#5C5552] font-bold mb-4 flex items-center gap-2 text-lg">
          <CalendarDays className="w-5 h-5 text-[#8D7B68]"/> {todayMonth}월 연차 일정
        </h3>
        
        {leaves.length === 0 ? (
          <div className="text-center py-6 text-[#A4907C] text-sm bg-[#FDFBF7] rounded-xl">
              이번 달 예정된 연차가 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {leaves.map((item, idx) => {
              const isPast = item.date < getTodayString();
              return (
                <div key={idx} className={`flex items-center justify-between p-3 rounded-xl ${isPast ? 'bg-[#F5F5F5] opacity-60' : 'bg-[#FDFBF7] border border-[#EBE5DD]'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${isPast ? 'text-gray-500' : 'text-[#8D7B68]'}`}>
                      {formatDate(item.date)}
                    </span>
                    <div className="h-4 w-[1px] bg-[#EBE5DD]"></div>
                    <span className="text-[#5C5552] font-medium">{item.name}</span>
                    <span className="text-xs text-[#A4907C] bg-white px-1.5 py-0.5 rounded border border-[#EBE5DD]">{item.role}</span>
                  </div>
                  {item.date === getTodayString() && (
                    <span className="text-xs bg-[#8D7B68] text-white px-2 py-1 rounded-full font-bold">Today</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // 3. 데스크탑용 캘린더 뷰 (NEW)
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
        if (staff.leaves?.includes(dateStr)) {
          list.push({ name: staff.name, role: staff.role });
        }
      });
      return list;
    };

    const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#F0EAE4] mb-6">
        {/* 달력 헤더 */}
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-[#5C5552] flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-[#8D7B68]"/> 
                {year}년 {month + 1}월 일정
            </h3>
            <div className="flex gap-2">
                <button onClick={() => moveMonth(-1)} className="p-1 hover:bg-[#F2EBE5] rounded-full text-[#8D7B68]"><ChevronLeft /></button>
                <button onClick={() => setViewDate(new Date())} className="text-sm px-3 py-1 bg-[#F2EBE5] rounded-full text-[#8D7B68] font-bold">오늘</button>
                <button onClick={() => moveMonth(1)} className="p-1 hover:bg-[#F2EBE5] rounded-full text-[#8D7B68]"><ChevronRight /></button>
            </div>
        </div>

        {/* 달력 그리드 */}
        <div className="grid grid-cols-7 border-t border-l border-[#F0EAE4]">
            {/* 요일 헤더 */}
            {weekDays.map((day, i) => (
                <div key={day} className={`text-center text-xs font-bold py-2 border-r border-b border-[#F0EAE4] bg-[#FDFBF7] ${i===0 ? 'text-red-400' : i===6 ? 'text-blue-400' : 'text-[#8D7B68]'}`}>
                    {day}
                </div>
            ))}

            {/* 빈 칸 (월 시작 전) */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="h-24 border-r border-b border-[#F0EAE4] bg-[#FAFAFA]"></div>
            ))}

            {/* 날짜 셀 */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const leaves = getLeavesForDay(day);
                const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
                const dateObj = new Date(year, month, day);
                const dayOfWeek = dateObj.getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                return (
                    <div key={day} className={`h-24 border-r border-b border-[#F0EAE4] p-1 relative hover:bg-[#FDFBF7] transition group ${isToday ? 'bg-[#FFF9F0]' : ''}`}>
                        <span className={`text-sm font-bold absolute top-1 left-2 ${dayOfWeek === 0 ? 'text-red-400' : dayOfWeek === 6 ? 'text-blue-400' : 'text-[#5C5552]'}`}>
                            {day} {isToday && <span className="text-[10px] bg-[#8D7B68] text-white px-1.5 rounded-full ml-1 align-top">Today</span>}
                        </span>
                        
                        <div className="mt-6 flex flex-col gap-1 overflow-y-auto max-h-[calc(100%-24px)] custom-scrollbar">
                            {leaves.map((person, idx) => (
                                <div key={idx} className="text-xs bg-[#F2EBE5] text-[#5C5552] px-1.5 py-0.5 rounded border border-[#EBE5DD] truncate" title={`${person.name} (${person.role})`}>
                                    <strong>{person.name}</strong> <span className="opacity-70 text-[10px]">{person.role}</span>
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

  // ==================================================================================
  // 렌더링
  // ==================================================================================

  if (loadingSession) {
    return <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] text-[#8D7B68]">로딩 중...</div>;
  }

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} p-4 md:p-8 flex justify-center font-sans`}>
      <div className={`w-full max-w-6xl ${theme.paper} rounded-3xl shadow-xl overflow-hidden border ${theme.border} min-h-[850px]`}>
        
        {/* 헤더 */}
        <div className="bg-[#8D7B68] p-6 text-white flex flex-col md:flex-row justify-between items-center shadow-md print:hidden">
            <h1 className="text-2xl font-bold flex items-center gap-3 tracking-wide">
                <span className="text-[#FDFBF7]">더데이치과</span> 
                <span className="text-[#EBE5DD] font-light text-lg opacity-80 hidden md:inline">| 연차 관리 시스템</span>
            </h1>
            
            <div className="flex gap-3 mt-4 md:mt-0 items-center">
                <div className="bg-[#7A6A59] p-1.5 rounded-full shadow-inner flex">
                  <button 
                    onClick={() => setActiveTab('list')} 
                    className={`px-6 py-2 rounded-full transition-all duration-300 text-sm font-bold flex items-center gap-2 ${activeTab === 'list' ? 'bg-[#FDFBF7] text-[#8D7B68] shadow-sm' : 'text-[#EBE5DD] hover:bg-[#6B5D4D]'}`}
                  >
                    <Calendar className="w-4 h-4" /> 현황표
                  </button>
                  <button 
                    onClick={() => setActiveTab('form')} 
                    className={`hidden md:flex px-6 py-2 rounded-full transition-all duration-300 text-sm font-bold items-center gap-2 ${activeTab === 'form' ? 'bg-[#FDFBF7] text-[#8D7B68] shadow-sm' : 'text-[#EBE5DD] hover:bg-[#6B5D4D]'}`}
                  >
                    <FileText className="w-4 h-4" /> 신청서
                  </button>
                </div>
                
                {session ? (
                  <button onClick={() => signOut()} className="ml-2 bg-[#7A6A59] hover:bg-[#6B5D4D] text-white p-2.5 rounded-full transition shadow-sm" title="로그아웃">
                      <LogOut className="w-5 h-5" />
                  </button>
                ) : (
                  <button onClick={() => signIn("google")} className="ml-2 bg-[#7A6A59] hover:bg-[#6B5D4D] text-[#EBE5DD] hover:text-white px-4 py-2 rounded-full transition text-sm font-bold flex items-center gap-2 shadow-sm">
                    <LogIn className="w-4 h-4" /> 로그인
                  </button>
                )}
            </div>
        </div>

        {/* 탭 1: 연차 현황표 */}
        {activeTab === 'list' && (
          <div className="p-4 md:p-8 bg-[#FDFBF7] h-full">
            <div className="w-full mx-auto">
                
                {/* 1. 모바일 뷰 (< md) */}
                <div className="md:hidden">
                   <div className="mb-4"><TodayStatusCard /></div>
                   <MobileScheduleList />
                </div>

                {/* 2. 데스크탑 뷰 (>= md) */}
                <div className="hidden md:block">
                    <div className="grid grid-cols-4 gap-6 mb-6">
                        <div className="col-span-1">
                            <TodayStatusCard />
                        </div>
                        <div className="col-span-3">
                             {/* 여기엔 공지사항이나 연차 통계 그래프 등을 넣을 수 있음. 일단은 비워둠 */}
                             <div className="h-full bg-white rounded-2xl border border-[#F0EAE4] p-5 flex items-center justify-center text-[#DBCCC0]">
                                더데이치과 연차 관리 시스템
                             </div>
                        </div>
                    </div>
                    {/* 데스크탑은 큰 달력 표시 */}
                    <DesktopCalendar />
                </div>

                {/* 메인 직원 리스트 (공통 - 테이블/카드 변환) */}
                <div className="bg-white rounded-2xl shadow-sm p-4 md:p-8 border border-[#F0EAE4]">
                    <div className="flex justify-between items-end mb-6 pb-6 border-b border-[#F0EAE4]">
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold text-[#5C5552] flex items-center gap-2">
                               <User className="w-6 h-6 text-[#A4907C]" /> 
                               <span className="hidden md:inline">직원 연차 리스트</span>
                               <span className="md:hidden">직원 리스트</span>
                            </h2>
                            <p className="text-[#A4907C] text-xs md:text-sm mt-2 flex items-center gap-2">
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
                        <div className="py-20 text-center text-[#8D7B68] animate-pulse">데이터를 불러오는 중입니다...</div>
                    ) : (
                        <>
                          {/* ======================= */}
                          {/* 데스크탑 뷰 (테이블) */}
                          {/* ======================= */}
                          <div className="hidden md:block overflow-x-auto rounded-xl border border-[#F0EAE4]">
                              <table className="w-full text-sm text-left text-[#5C5552]">
                                  <thead className="text-xs text-[#8D7B68] uppercase bg-[#F2EBE5]">
                                      <tr>
                                          <th className="px-4 py-4 text-center w-12 font-bold">No</th>
                                          <th className="px-4 py-4 font-bold">성명</th>
                                          <th className="px-4 py-4 font-bold">직급</th>
                                          <th className="px-4 py-4 w-32 font-bold">입사일</th>
                                          <th className="px-4 py-4 text-center bg-[#EBE5DD] font-bold">발생</th>
                                          <th className="px-4 py-4 text-center bg-[#F5E6E6] text-[#A66E6E] font-bold">사용</th>
                                          <th className="px-4 py-4 text-center bg-[#E6F0E6] text-[#6E9675] font-bold">잔여</th>
                                          <th className="px-4 py-4 font-bold">비고</th>
                                          {session && <th className="px-4 py-4 text-center w-16 font-bold">관리</th>}
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[#F0EAE4]">
                                      {staffData.map((staff, index) => {
                                          const remain = (parseFloat(staff.total) || 0) - (parseFloat(staff.used) || 0);
                                          const isSessionActive = !!session;
                                          
                                          return (
                                              <tr key={index} className="bg-white hover:bg-[#F9F7F2] transition">
                                                  <td className="px-4 py-3 text-center text-[#A4907C]">{index + 1}</td>
                                                  <td className="px-4 py-3">
                                                      <input type="text" value={staff.name} 
                                                          onChange={(e) => handleUpdate(index, 'name', e.target.value)} 
                                                          onBlur={handleBlur} 
                                                          readOnly={!isSessionActive}
                                                          className={`w-20 bg-transparent outline-none border-b focus:border-[#8D7B68] placeholder-[#DBCCC0] ${!isSessionActive ? 'border-transparent cursor-default' : 'border-transparent'}`} 
                                                          placeholder="이름" 
                                                      />
                                                  </td>
                                                  <td className="px-4 py-3">
                                                      <input type="text" value={staff.role} 
                                                          onChange={(e) => handleUpdate(index, 'role', e.target.value)} 
                                                          onBlur={handleBlur} 
                                                          readOnly={!isSessionActive}
                                                          className={`w-20 bg-transparent outline-none border-b focus:border-[#8D7B68] text-[#8D8D8D] ${!isSessionActive ? 'border-transparent cursor-default' : 'border-transparent'}`}
                                                          placeholder="직급" 
                                                      />
                                                  </td>
                                                  <td className="px-4 py-3">
                                                      <input type="date" value={staff.date} 
                                                          onChange={(e) => handleUpdate(index, 'date', e.target.value)} 
                                                          onBlur={handleBlur} 
                                                          readOnly={!isSessionActive}
                                                          className={`w-full bg-transparent outline-none text-[#5C5552] ${!isSessionActive ? 'cursor-default' : 'cursor-pointer'}`}
                                                      />
                                                  </td>
                                                  <td className="px-4 py-3 text-center">
                                                      <input type="number" value={staff.total} 
                                                          readOnly={true} 
                                                          className="w-12 text-center rounded py-1 outline-none font-bold bg-transparent border-none text-[#5C5552] cursor-default" 
                                                      />
                                                  </td>
                                                  <td className="px-4 py-3 text-center">
                                                      <input type="number" value={staff.used} 
                                                          readOnly={true}
                                                          className="w-12 text-center rounded py-1 font-bold outline-none bg-transparent border-none text-[#A66E6E] cursor-default" 
                                                      />
                                                  </td>
                                                  <td className="px-4 py-3 text-center">
                                                      <span className={`font-bold text-lg ${remain <= 0 ? 'text-[#A66E6E]' : 'text-[#6E9675]'}`}>{remain}</span>
                                                  </td>
                                                  <td className="px-4 py-3">
                                                      <input type="text" value={staff.memo} 
                                                          onChange={(e) => handleUpdate(index, 'memo', e.target.value)} 
                                                          onBlur={handleBlur} 
                                                          readOnly={!isSessionActive}
                                                          className="w-full bg-transparent outline-none text-[#8D8D8D]" 
                                                          placeholder="메모" 
                                                      />
                                                  </td>
                                                  {session && (
                                                    <td className="px-4 py-3 text-center">
                                                        <button onClick={() => deleteStaff(index)} className="text-[#DBCCC0] hover:text-[#A66E6E] p-1 transition">
                                                            <X className="w-5 h-5"/>
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
                               const remain = (parseFloat(staff.total) || 0) - (parseFloat(staff.used) || 0);
                               const isSessionActive = !!session;

                               return (
                                 <div key={index} className="bg-white p-5 rounded-2xl shadow-sm border border-[#F0EAE4] flex flex-col gap-3 relative">
                                    <div className="flex justify-between items-start">
                                       <div className="flex items-end gap-2">
                                         <input type="text" value={staff.name} 
                                             onChange={(e) => handleUpdate(index, 'name', e.target.value)} 
                                             onBlur={handleBlur} 
                                             readOnly={!isSessionActive}
                                             className="text-lg font-bold w-20 bg-transparent outline-none border-b border-[#F0EAE4] focus:border-[#8D7B68] placeholder-[#DBCCC0]"
                                             placeholder="이름"
                                          />
                                         <input type="text" value={staff.role} 
                                             onChange={(e) => handleUpdate(index, 'role', e.target.value)} 
                                             onBlur={handleBlur} 
                                             readOnly={!isSessionActive}
                                             className="text-sm text-[#8D8D8D] w-16 bg-transparent outline-none focus:text-[#5C5552]"
                                             placeholder="직급"
                                          />
                                       </div>
                                       {session && (
                                         <button onClick={() => deleteStaff(index)} className="text-[#DBCCC0] hover:text-[#A66E6E] p-1">
                                            <Trash2 className="w-4 h-4"/>
                                         </button>
                                       )}
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-[#8D7B68]">
                                       <span className="text-xs bg-[#F2EBE5] px-2 py-0.5 rounded text-[#8D7B68]">입사일</span>
                                       <input type="date" value={staff.date} 
                                            onChange={(e) => handleUpdate(index, 'date', e.target.value)} 
                                            onBlur={handleBlur} 
                                            readOnly={!isSessionActive}
                                            className="bg-transparent outline-none text-[#5C5552] text-sm w-32"
                                       />
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                       <div className="bg-[#F8F6F4] p-2 rounded-xl text-center">
                                          <div className="text-xs text-[#8D7B68] mb-1">발생</div>
                                          <div className="font-bold text-[#5C5552]">{staff.total}</div>
                                       </div>
                                       <div className="bg-[#FCF5F5] p-2 rounded-xl text-center">
                                          <div className="text-xs text-[#A66E6E] mb-1">사용</div>
                                          <div className="font-bold text-[#A66E6E]">{staff.used}</div>
                                       </div>
                                       <div className="bg-[#EEF5EF] p-2 rounded-xl text-center">
                                          <div className="text-xs text-[#6E9675] mb-1">잔여</div>
                                          <div className={`font-bold ${remain <= 0 ? 'text-[#A66E6E]' : 'text-[#6E9675]'}`}>{remain}</div>
                                       </div>
                                    </div>

                                    <div className="mt-2 pt-2 border-t border-[#F0EAE4]">
                                      <input type="text" value={staff.memo} 
                                          onChange={(e) => handleUpdate(index, 'memo', e.target.value)} 
                                          onBlur={handleBlur} 
                                          readOnly={!isSessionActive}
                                          className="w-full text-sm bg-transparent outline-none text-[#8D8D8D] placeholder-gray-300" 
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
