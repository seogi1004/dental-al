'use client';

import React, { useState, useEffect } from 'react';
import { 
  Printer, Plus, Calendar, User, FileText, 
  Trash2, Moon, Sun, PanelRightOpen, PanelRightClose,
  Github
} from 'lucide-react';

import { useSession, signIn, signOut } from "next-auth/react";
import { useTheme } from "next-themes";

import { Staff } from '@/types';
import { theme } from '@/lib/theme';
import { getTodayString, formatDate, parseLeaveDate } from '@/lib/date';
import { UserMenu, TodayStatusCard, MobileScheduleList, DesktopCalendar, HelpPanel, WarningBanner } from '@/components';
import { useSheetData, useLeaveCalculations } from '@/hooks';
import { addLeave, updateLeave, deleteLeave } from '@/services';

export default function DentalLeaveApp() {
  const { data: session, status } = useSession();
  const { theme: currentTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const loadingSession = status === "loading";

  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formTotalDays, setFormTotalDays] = useState('');
  const [leaveType, setLeaveType] = useState('연차');
  const [halfDayType, setHalfDayType] = useState('AM');
  const [startType, setStartType] = useState('FULL'); // FULL, AM, PM
  const [endType, setEndType] = useState('FULL');     // FULL, AM, PM

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const saved = localStorage.getItem('sidebarOpen');
    if (saved !== null) setIsSidebarOpen(saved === 'true');
  }, []);

  useEffect(() => {
    if (formStartDate && formEndDate) {
      const start = new Date(formStartDate);
      const end = new Date(formEndDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start) {
        if (formStartDate === formEndDate) {
          setFormTotalDays(startType === 'FULL' ? '1' : '0.5');
        } else {
          const diffTime = Math.abs(end.getTime() - start.getTime());
          let baseDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          
          if (startType !== 'FULL') baseDays -= 0.5;
          if (endType !== 'FULL') baseDays -= 0.5;
          
          setFormTotalDays(String(baseDays));
        }
      } else {
        setFormTotalDays('');
      }
    } else {
      setFormTotalDays('');
    }
  }, [formStartDate, formEndDate, startType, endType]);

  const toggleSidebar = () => {
    const newState = !isSidebarOpen;
    setIsSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', String(newState));
  };

  const [activeTab, setActiveTab] = useState('list');
  const [viewDate, setViewDate] = useState(new Date());

  const { 
    staffData, 
    setStaffData, 
    loading, 
    statusMsg, 
    fetchSheetData, 
    saveSheetData,
    handleUpdate,
    handleBlur
  } = useSheetData(session);

  const { 
    getCurrentMonthLeaves, 
    getTodayLeaves, 
    getInvalidLeaves, 
    getSundayLeaves,
    getTodayOffs,
    getCurrentMonthOffs,
  } = useLeaveCalculations(staffData);

  const invalidLeaves = getInvalidLeaves();
  const sundayLeaves = getSundayLeaves();
  const isAdmin = (session as any)?.isAdmin;

  const handleLeaveClickWrapper = async (staffName: string, originalDate: string, dateYMD: string) => {
    if (!isAdmin) return;
    
    let displayDate = originalDate;
    try {
      if (dateYMD) {
        const d = new Date(dateYMD);
        if (!isNaN(d.getTime())) {
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          displayDate = `${mm}/${dd}`;
          if (String(originalDate).toUpperCase().includes('AM')) displayDate += ' AM';
          else if (String(originalDate).toUpperCase().includes('PM')) displayDate += ' PM';
        }
      }
    } catch(e) {}
    
    const newValue = prompt(`연차 날짜를 수정하세요 (MM/DD 형식):
예: 01/15, 01/15 AM, 01/15 PM`, displayDate);
    if (newValue === null) return;
    if (newValue.trim() === '' || newValue.trim() === originalDate) return;
    
    const datePattern = /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12][0-9]|3[01])(\s+(AM|PM))?$/i;
    if (!datePattern.test(newValue.trim())) {
      alert(`올바른 형식으로 입력해주세요.

예: 01/15, 01/15 AM, 01/15 PM`);
      return;
    }
    
    try {
      await updateLeave(staffName, originalDate, newValue.trim());
      fetchSheetData();
    } catch (e: any) {
      console.error(e);
      if (e.message && (e.message.includes('invalid authentication') || e.message.includes('credentials'))) {
        signOut({ callbackUrl: '/' });
        return;
      }
      alert("수정 실패: " + e.message);
    }
  };

  const handleLeaveDeleteWrapper = async (staffName: string, originalDate: string) => {
    if (!isAdmin) return;
    
    if (!confirm(`${staffName}님의 연차(${originalDate})를 삭제하시겠습니까?`)) {
      return;
    }
    
    try {
      await deleteLeave(staffName, originalDate);
      fetchSheetData();
    } catch (e: any) {
      console.error(e);
      if (e.message && (e.message.includes('invalid authentication') || e.message.includes('credentials'))) {
        signOut({ callbackUrl: '/' });
        return;
      }
      alert("삭제 실패: " + e.message);
    }
  };

  const handleLeaveAddWrapper = async (dateStr: string) => {
    if (!isAdmin) return;
    
    const staffNames = staffData.map(s => s.name).join(', ');
    const selectedName = prompt(`연차를 추가할 직원 이름을 입력하세요:

현재 직원: ${staffNames}`);
    if (!selectedName) return;
    
    const staff = staffData.find(s => s.name === selectedName.trim());
    if (!staff) {
      alert("존재하지 않는 직원입니다.");
      return;
    }
    
    const d = new Date(dateStr);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const baseDate = `${mm}/${dd}`;
    
    const typeInput = prompt(`연차 타입을 입력하세요:

• 공백 또는 Enter = 종일 연차
• AM = 오전 반차
• PM = 오후 반차`, "");
    if (typeInput === null) return;
    
    let typeUpper = typeInput.trim().toUpperCase();
    
    if (typeUpper === 'A') typeUpper = 'AM';
    if (typeUpper === 'P') typeUpper = 'PM';
    
    if (typeUpper !== '' && typeUpper !== 'AM' && typeUpper !== 'PM') {
      alert(`올바른 타입을 입력해주세요.

• 공백 = 종일
• AM = 오전 반차
• PM = 오후 반차`);
      return;
    }
    
    const existingLeave = staff.leaves?.find(leafObj => {
      const { date } = parseLeaveDate(leafObj.parsed);
      return date === dateStr;
    });
    
    if (existingLeave) {
      alert(`${staff.name}님은 이 날짜에 이미 연차가 등록되어 있습니다.

기존: ${existingLeave.original}

수정이 필요하면 기존 항목을 클릭해주세요.`);
      return;
    }
    
    const finalDate = typeUpper ? `${baseDate} ${typeUpper}` : baseDate;
    
    try {
      await addLeave(staff.name, finalDate);
      fetchSheetData();
    } catch (e: any) {
      console.error(e);
      if (e.message && (e.message.includes('invalid authentication') || e.message.includes('credentials'))) {
        signOut({ callbackUrl: '/' });
        return;
      }
      alert("추가 실패: " + e.message);
    }
  };

  const addStaff = () => {
    if (!isAdmin) return;
    if (staffData.length >= 14) {
      alert("최대 직원 수(14명)를 초과하여 추가할 수 없습니다.");
      return;
    }
    const newItem: Staff = {
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

  const deleteStaff = (index: number) => {
    if (!isAdmin) return;
    if (confirm("정말 삭제하시겠습니까?")) {
      const newData = staffData.filter((_, i) => i !== index);
      setStaffData(newData);
      saveSheetData(newData);
    }
  };

  if (loadingSession) {
    return <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] dark:bg-[#121212] text-[#8D7B68] dark:text-[#A4907C]">로딩 중...</div>;
  }

  const renderStaffTable = () => (
    <div className="hidden md:block overflow-x-auto rounded-xl border border-[#F0EAE4] dark:border-[#333333]">
      <table className="w-full text-xs text-left text-[#5C5552] dark:text-[#E0E0E0]">
        <thead className="text-[11px] text-[#8D7B68] dark:text-[#A4907C] uppercase bg-[#F2EBE5] dark:bg-[#2D2D2D]">
          <tr>
            <th className="px-3 py-2">이름</th>
            <th className="px-3 py-2">직급</th>
            <th className="px-3 py-2">입사일</th>
            <th className="px-3 py-2 text-center">발생</th>
            <th className="px-3 py-2 text-center">사용</th>
            <th className="px-3 py-2 text-center">잔여</th>
            <th className="px-3 py-2">비고</th>
            {isAdmin && <th className="px-3 py-2 text-center">관리</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F0EAE4] dark:divide-[#333333]">
          {staffData.map((staff, index) => (
            <tr key={index} className="bg-white dark:bg-[#1E1E1E] hover:bg-[#FDFBF7] dark:hover:bg-[#252525]">
              <td className="px-3 py-2 font-bold whitespace-nowrap">
                {isAdmin ? (
                  <input 
                    type="text" 
                    value={staff.name} 
                    onChange={(e) => handleUpdate(index, 'name', e.target.value)}
                    onBlur={handleBlur}
                    readOnly={!staff.isNew} 
                    className={`bg-transparent border-none focus:ring-0 w-20 p-0 ${!staff.isNew ? 'cursor-default' : 'border-b border-[#A4907C]'}`}
                  />
                ) : staff.name}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                {isAdmin ? (
                  <input 
                    type="text" 
                    value={staff.role} 
                    onChange={(e) => handleUpdate(index, 'role', e.target.value)}
                    onBlur={handleBlur}
                    className="bg-transparent border-none focus:ring-0 w-16 p-0"
                  />
                ) : staff.role}
              </td>
              <td className="px-3 py-2 whitespace-nowrap font-mono text-[10px] text-[#8D7B68] dark:text-[#A4907C]">
                {isAdmin ? (
                  <input 
                    type="date" 
                    value={staff.date} 
                    onChange={(e) => handleUpdate(index, 'date', e.target.value)}
                    onBlur={handleBlur}
                    className="bg-transparent border-none focus:ring-0 w-24 p-0"
                  />
                ) : staff.date}
              </td>
              <td className="px-3 py-2 text-center text-[#8D7B68] dark:text-[#A4907C]">
                {isAdmin ? (
                  <input 
                    type="number" 
                    value={staff.total} 
                    onChange={(e) => handleUpdate(index, 'total', parseFloat(e.target.value))}
                    onBlur={handleBlur}
                    className="bg-transparent border-none focus:ring-0 w-10 text-center p-0"
                  />
                ) : staff.total}
              </td>
              <td className="px-3 py-2 text-center text-blue-600 dark:text-blue-400 font-bold">{staff.used}</td>
              <td className="px-3 py-2 text-center font-bold text-[#5C5552] dark:text-[#E0E0E0]">{staff.total - staff.used}</td>
              <td className="px-3 py-2">
                {isAdmin ? (
                  <input 
                    type="text" 
                    value={staff.memo || ''} 
                    onChange={(e) => handleUpdate(index, 'memo', e.target.value)}
                    onBlur={handleBlur}
                    placeholder="메모 입력"
                    className="bg-transparent border-none focus:ring-0 w-full p-0 text-[10px]"
                  />
                ) : <span className="text-[10px] text-[#A4907C] dark:text-[#A0A0A0]">{staff.memo}</span>}
              </td>
              {isAdmin && (
                <td className="px-3 py-2 text-center">
                  <button onClick={() => deleteStaff(index)} className="text-red-400 hover:text-red-600 transition p-1">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderStaffCards = () => (
    <div className="md:hidden grid grid-cols-1 gap-3">
      {staffData.map((staff, index) => (
        <div key={index} className="bg-[#FDFBF7] dark:bg-[#2C2C2C] p-4 rounded-xl border border-[#EBE5DD] dark:border-[#444444] shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="flex items-center gap-2">
                {isAdmin ? (
                   <input 
                     type="text" 
                     value={staff.name} 
                     onChange={(e) => handleUpdate(index, 'name', e.target.value)}
                     onBlur={handleBlur}
                     readOnly={!staff.isNew} 
                     className="bg-transparent font-bold text-lg text-[#5C5552] dark:text-[#E0E0E0] w-24 p-0 border-b border-transparent focus:border-[#A4907C]"
                   />
                ) : <span className="font-bold text-lg text-[#5C5552] dark:text-[#E0E0E0] w-24 inline-block">{staff.name}</span>}
                <span className="text-xs bg-white dark:bg-[#1E1E1E] border border-[#EBE5DD] dark:border-[#444444] px-1.5 py-0.5 rounded text-[#8D7B68] dark:text-[#A4907C] w-10 inline-flex justify-center items-center">
                  {isAdmin ? (
                     <input 
                       type="text" 
                       value={staff.role} 
                       onChange={(e) => handleUpdate(index, 'role', e.target.value)}
                       onBlur={handleBlur}
                       className="bg-transparent w-10 text-center p-0"
                     />
                  ) : staff.role}
                </span>
              </div>
              <div className="text-[10px] text-[#A4907C] dark:text-[#A0A0A0] mt-1 flex items-center gap-1">
                📅 {isAdmin ? (
                  <input 
                    type="date" 
                    value={staff.date} 
                    onChange={(e) => handleUpdate(index, 'date', e.target.value)}
                    onBlur={handleBlur}
                    className="bg-transparent w-20 p-0"
                  />
                ) : staff.date} 입사
              </div>
            </div>
            {isAdmin && (
              <button onClick={() => deleteStaff(index)} className="text-red-400 p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-center mb-3">
            <div className="bg-white dark:bg-[#1E1E1E] p-2 rounded-lg border border-[#F0EAE4] dark:border-[#333333]">
              <div className="text-[10px] text-[#A4907C] dark:text-[#A0A0A0]">총 연차</div>
              <div className="font-bold text-[#5C5552] dark:text-[#E0E0E0]">
                {isAdmin ? (
                  <input 
                    type="number" 
                    value={staff.total} 
                    onChange={(e) => handleUpdate(index, 'total', parseFloat(e.target.value))}
                    onBlur={handleBlur}
                    className="bg-transparent w-full text-center p-0"
                  />
                ) : staff.total}
              </div>
            </div>
            <div className="bg-white dark:bg-[#1E1E1E] p-2 rounded-lg border border-[#F0EAE4] dark:border-[#333333]">
              <div className="text-[10px] text-[#A4907C] dark:text-[#A0A0A0]">사용</div>
              <div className="font-bold text-blue-500">{staff.used}</div>
            </div>
            <div className="bg-white dark:bg-[#1E1E1E] p-2 rounded-lg border border-[#F0EAE4] dark:border-[#333333]">
              <div className="text-[10px] text-[#A4907C] dark:text-[#A0A0A0]">잔여</div>
              <div className="font-bold text-[#8D7B68] dark:text-[#A4907C]">{staff.total - staff.used}</div>
            </div>
          </div>
          
          <div className="bg-[#F2EBE5] dark:bg-[#1E1E1E] p-2 rounded-lg min-h-[40px]">
            {isAdmin ? (
               <input 
                 type="text" 
                 value={staff.memo || ''} 
                 onChange={(e) => handleUpdate(index, 'memo', e.target.value)}
                 onBlur={handleBlur}
                 placeholder="메모 입력"
                 className="bg-transparent w-full text-[11px] text-[#5C5552] dark:text-[#E0E0E0] p-0 border-none focus:ring-0 placeholder-[#C4B09C]"
               />
            ) : <p className="text-[11px] text-[#5C5552] dark:text-[#E0E0E0]">{staff.memo}</p>}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} p-4 md:p-8 flex justify-center font-sans transition-colors duration-300`}>
      <div className={`w-full max-w-6xl ${theme.paper} rounded-3xl shadow-xl overflow-hidden border ${theme.border} min-h-[850px] transition-colors duration-300 flex flex-col`}>
        
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

                <button 
                  onClick={toggleSidebar}
                  className={`ml-2 p-2.5 rounded-full transition shadow-sm ${!isSidebarOpen ? 'bg-[#7A6A59] dark:bg-[#4A3B2F] text-white' : 'bg-[#FDFBF7] dark:bg-[#2C2C2C] text-[#8D7B68] dark:text-[#A4907C]'}`}
                  title={isSidebarOpen ? "가이드 숨기기" : "가이드 보기"}
                >
                  {isSidebarOpen ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
                </button>
                
                 <UserMenu 
                   session={session as any} 
                   signIn={signIn} 
                   signOut={signOut} 
                 />
             </div>
         </div>

         {activeTab === 'list' && (
           <div className="p-4 md:p-8 bg-[#FDFBF7] dark:bg-[#121212] h-full transition-colors duration-300">
             <div className="w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
                 
                 <div className={`transition-all duration-300 ${isSidebarOpen ? 'lg:col-span-9' : 'lg:col-span-12'}`}>
                      <div className="md:hidden mb-6">
                         <div className="mb-4">
                           <TodayStatusCard 
                              todayLeaves={getTodayLeaves()} 
                              todayOffs={getTodayOffs()}
                              loading={loading} 
                              statusMsg={statusMsg} 
                           />
                         </div>
                          <MobileScheduleList 
                            leaves={getCurrentMonthLeaves()}
                            monthOffs={getCurrentMonthOffs()}
                            onRefresh={fetchSheetData}
                            onLeaveClick={handleLeaveClickWrapper}
                            onLeaveDelete={handleLeaveDeleteWrapper}
                            session={session as any}
                            getTodayString={getTodayString}
                            formatDate={formatDate}
                            todayMonth={new Date().getMonth() + 1}
                            invalidLeaves={invalidLeaves}
                            sundayLeaves={sundayLeaves}
                          />
                      </div>

                     <div className="hidden md:block space-y-6">
                         <div className="grid grid-cols-4 gap-6">
                             <div className="col-span-2">
                                  <TodayStatusCard 
                                    todayLeaves={getTodayLeaves()} 
                                    todayOffs={getTodayOffs()}
                                    loading={loading} 
                                    statusMsg={statusMsg} 
                                  />
                             </div>
                             <div className="col-span-2">
                                  {invalidLeaves.length > 0 || sundayLeaves.length > 0 ? (
                                     <WarningBanner 
                                       session={session} 
                                       invalidLeaves={invalidLeaves} 
                                       sundayLeaves={sundayLeaves}
                                       className="h-full mb-0 overflow-y-auto"
                                     />
                                  ) : (
                                     <div className="h-full bg-white dark:bg-[#1E1E1E] rounded-2xl border border-[#F0EAE4] dark:border-[#333333] p-5 flex items-center justify-center text-[#A4907C] dark:text-[#C4B09C] font-medium transition-colors">
                                        좋은 하루 보내세요 ☀️
                                     </div>
                                  )}
                             </div>
                         </div>
                         
                         <DesktopCalendar 
                           viewDate={viewDate}
                           setViewDate={setViewDate}
                           staffData={staffData}
                           session={session as any}
                           invalidLeaves={invalidLeaves}
                           sundayLeaves={sundayLeaves}
                            handlers={{
                              handleLeaveClick: handleLeaveClickWrapper,
                              handleLeaveDelete: handleLeaveDeleteWrapper,
                              handleLeaveAdd: handleLeaveAddWrapper
                            }}
                            onRefresh={fetchSheetData}
                            showWarning={false}
                          />
                     </div>

                     <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-sm p-4 md:p-8 border border-[#F0EAE4] dark:border-[#333333] transition-colors duration-300 mt-6">
                         <div className="flex justify-between items-end mb-6 pb-6 border-b border-[#F0EAE4] dark:border-[#333333]">
                             <div>
                                 <h2 className="text-xl md:text-2xl font-bold text-[#5C5552] dark:text-[#E0E0E0] flex items-center gap-2">
                                    <User className="w-6 h-6 text-[#A4907C] dark:text-[#C4B09C]" /> 
                                    <span className="hidden md:inline">직원 연차 리스트</span>
                                    <span className="md:hidden">직원 리스트</span>
                                 </h2>
                             </div>
                             {isAdmin && (
                               <button onClick={addStaff} className={`${theme.primary} text-white px-4 py-2 md:px-5 md:py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-md transition`}>
                                   <Plus className="w-4 h-4" /> <span className="hidden md:inline">직원 추가</span><span className="md:hidden">추가</span>
                               </button>
                             )}
                         </div>

                         {loading ? (
                             <div className="py-20 text-center text-[#8D7B68] dark:text-[#A4907C] animate-pulse">데이터를 불러오는 중입니다...</div>
                         ) : (
                             <>
                               {renderStaffTable()}
                               {renderStaffCards()}
                             </>
                         )}
                     </div>
                 </div>

                 {isSidebarOpen && (
                   <div className="hidden lg:block lg:col-span-3">
                       <HelpPanel />
                   </div>
                 )}
             </div>
           </div>
         )}

          {activeTab === 'form' && (
  <div className="p-8 bg-[#FDFBF7] dark:bg-[#121212] flex flex-col items-center transition-colors duration-300 flex-1">
     <div className="w-full flex justify-end mb-6 print:hidden">
        <button onClick={() => window.print()} className={`flex items-center gap-2 ${theme.primary} text-white px-5 py-2.5 rounded-xl transition shadow-md text-sm font-bold`}>
            <Printer className="w-4 h-4" /> 인쇄하기
        </button>
    </div>

    <div className="bg-white dark:bg-[#1E1E1E] p-[15mm] w-[210mm] min-h-[297mm] shadow-lg mx-auto text-[#333] dark:text-[#E0E0E0] relative rounded-sm print:shadow-none print:w-full print:h-[297mm] print:m-0 print:p-[10mm] print:rounded-none print:border-none print-form-container transition-colors duration-300">
        <h2 className="text-3xl font-bold text-center underline underline-offset-8 mb-10 print:mb-12 tracking-widest text-[#222] dark:text-[#E0E0E0] font-serif">연차(휴가) 신청서</h2>
        
        <div className="flex justify-end mb-8 print:mb-12">
            <table className="border border-gray-800 dark:border-gray-500 text-center text-sm w-64">
                <tbody>
                <tr>
                    <th rowSpan={2} className="bg-gray-100 dark:bg-[#2D2D2D] border border-gray-800 dark:border-gray-500 px-2 py-4 w-10 font-serif">결<br/>재</th>
                    <td className="border border-gray-800 dark:border-gray-500 py-1">담 당</td>
                    <td className="border border-gray-800 dark:border-gray-500 py-1">실 장</td>
                    <td className="border border-gray-800 dark:border-gray-500 py-1">원 장</td>
                </tr>
                <tr>
                    <td className="border border-gray-800 dark:border-gray-500 h-16"></td>
                    <td className="border border-gray-800 dark:border-gray-500 h-16"></td>
                    <td className="border border-gray-800 dark:border-gray-500 h-16"></td>
                </tr>
                </tbody>
            </table>
        </div>

        <table className="w-full border-collapse border border-gray-800 dark:border-gray-500 mb-6 print:mb-16 text-sm">
            <tbody>
            <tr>
                <th className="border border-gray-800 dark:border-gray-500 bg-gray-50 dark:bg-[#2D2D2D] p-3 w-28 font-bold text-gray-800 dark:text-[#E0E0E0]">성 명</th>
                <td className="border border-gray-800 dark:border-gray-500 p-2"><input type="text" className="w-full p-1 outline-none font-medium bg-transparent" placeholder="이름 입력" /></td>
                <th className="border border-gray-800 dark:border-gray-500 bg-gray-50 dark:bg-[#2D2D2D] p-3 w-28 font-bold text-gray-800 dark:text-[#E0E0E0]">소 속</th>
                <td className="border border-gray-800 dark:border-gray-500 p-2">
                    <select className="w-full p-1 outline-none bg-transparent appearance-none">
                        <option>진료팀</option><option>데스크팀</option><option>기공실</option>
                    </select>
                </td>
            </tr>
            <tr>
                <th className="border border-gray-800 dark:border-gray-500 bg-gray-50 dark:bg-[#2D2D2D] p-3 font-bold text-gray-800 dark:text-[#E0E0E0]">비상연락</th>
                <td colSpan={3} className="border border-gray-800 dark:border-gray-500 p-2"><input type="text" className="w-full p-1 outline-none bg-transparent" placeholder="010-0000-0000" /></td>
            </tr>
            <tr>
                <th className="border border-gray-800 dark:border-gray-500 bg-gray-50 dark:bg-[#2D2D2D] p-3 font-bold text-gray-800 dark:text-[#E0E0E0]">종 류</th>
                <td colSpan={3} className="border border-gray-800 dark:border-gray-500 p-3">
                    <div className="flex gap-6 items-center">
                        <div className="flex gap-6">
                            {['연차', '병가', '경조사', '기타'].map(type => (
                                <label key={type} className="flex items-center gap-1 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="leaveType"
                                        checked={leaveType === type}
                                        onChange={() => setLeaveType(type)}
                                        className="w-4 h-4 accent-gray-600" 
                                    /> {type}
                                </label>
                            ))}
                        </div>
                    </div>
                </td>
            </tr>
            <tr>
                <th className="border border-gray-800 dark:border-gray-500 bg-gray-50 dark:bg-[#2D2D2D] p-3 font-bold text-gray-800 dark:text-[#E0E0E0]">기 간</th>
                <td colSpan={3} className="border border-gray-800 dark:border-gray-500 p-3">
                    {(() => {
                        const isSameDay = formStartDate && formEndDate && formStartDate === formEndDate;
                        const isOneDayOrLess = parseFloat(formTotalDays || '0') <= 1;
                        return (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-4 print:gap-2">
                                    <div className={isSameDay ? 'print:col-span-2' : ''}>
                                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium print:text-[10px]">
                                            <span className={isSameDay ? 'print:hidden' : ''}>시작일</span>
                                            <span className={`hidden ${isSameDay ? 'print:inline' : ''}`}>신청일</span>
                                        </div>
                                        <input 
                                            type="date" 
                                            value={formStartDate} 
                                            onChange={(e) => setFormStartDate(e.target.value)} 
                                            className="w-full border dark:border-gray-500 px-2 py-1.5 rounded border-gray-300 bg-transparent mb-2 print:border-none print:bg-transparent print:px-1 print:py-1 print:mb-1 print:text-sm" 
                                        />
                                        <div className="flex gap-3 print:gap-1.5 print:hidden">
                                            {[
                                                { value: 'FULL', label: '종일' },
                                                { value: 'AM', label: '오전' },
                                                { value: 'PM', label: '오후' }
                                            ].map(option => (
                                                <label key={option.value} className="flex items-center gap-1.5 cursor-pointer text-sm print:gap-1 print:text-xs">
                                                    <input 
                                                        type="radio" 
                                                        name="startType"
                                                        checked={startType === option.value}
                                                        onChange={() => setStartType(option.value)}
                                                        className="w-4 h-4 accent-gray-700 dark:accent-gray-400 print:w-3 print:h-3" 
                                                    />
                                                    <span className="text-gray-700 dark:text-gray-300">{option.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div className={isSameDay ? 'print:hidden' : ''}>
                                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium print:text-[10px]">종료일</div>
                                        <input 
                                            type="date" 
                                            value={formEndDate} 
                                            onChange={(e) => setFormEndDate(e.target.value)} 
                                            className="w-full border dark:border-gray-500 px-2 py-1.5 rounded border-gray-300 bg-transparent mb-2 print:border-none print:bg-transparent print:px-1 print:py-1 print:mb-1 print:text-sm" 
                                        />
                                        <div className="flex gap-3 print:gap-1.5 print:hidden">
                                            {[
                                                { value: 'FULL', label: '종일' },
                                                { value: 'AM', label: '오전' },
                                                { value: 'PM', label: '오후' }
                                            ].map(option => (
                                                <label key={option.value} className="flex items-center gap-1.5 cursor-pointer text-sm print:gap-1 print:text-xs">
                                                    <input 
                                                        type="radio" 
                                                        name="endType"
                                                        checked={endType === option.value}
                                                        onChange={() => setEndType(option.value)}
                                                        className="w-4 h-4 accent-gray-700 dark:accent-gray-400 print:w-3 print:h-3" 
                                                    />
                                                    <span className="text-gray-700 dark:text-gray-300">{option.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 text-sm font-medium text-gray-800 dark:text-gray-200 print:mt-2 flex items-center">
                                    <span className="whitespace-nowrap">
                                        총 <span className="text-lg text-gray-900 dark:text-white font-bold mx-1 print:text-base">{formTotalDays || '0'}</span> 일간
                                    </span>
                                    <span className={`hidden ${isOneDayOrLess ? 'print:inline ml-1 text-sm font-medium' : ''}`}>
                                        ({startType === 'FULL' ? '종일' : startType === 'AM' ? '오전' : '오후'})
                                    </span>
                                </div>
                            </>
                        );
                    })()}
                </td>
            </tr>
            <tr>
                <th className="border border-gray-800 dark:border-gray-500 bg-gray-50 dark:bg-[#2D2D2D] p-3 font-bold text-gray-800 dark:text-[#E0E0E0]">사 유</th>
                <td colSpan={3} className="border border-gray-800 dark:border-gray-500 p-3 h-32 align-top">
                    <textarea className="w-full h-full p-1 outline-none resize-none bg-transparent" placeholder="사유를 기재해 주세요"></textarea>
                </td>
            </tr>
            <tr>
                <th className="border border-gray-800 dark:border-gray-500 bg-gray-50 dark:bg-[#2D2D2D] p-3 font-bold text-gray-800 dark:text-[#E0E0E0]">인수인계</th>
                <td colSpan={3} className="border border-gray-800 dark:border-gray-500 p-3 h-32 align-top">
                    <textarea className="w-full h-full p-1 outline-none resize-none bg-transparent" placeholder="1. 예약 변경 건: &#13;&#10;2. 전달 사항:"></textarea>
                </td>
            </tr>
            </tbody>
        </table>
        
        <div className="text-center mt-16 print:mt-24">
            <p className="text-xl mb-8 print:mb-16 font-medium font-serif text-gray-800 dark:text-[#E0E0E0]">2026년 &nbsp;&nbsp;&nbsp;&nbsp;월 &nbsp;&nbsp;&nbsp;&nbsp;일</p>
            <div className="flex justify-center items-center gap-4 mb-16 print:mb-20">
                <span className="text-lg font-bold font-serif text-gray-800 dark:text-[#E0E0E0]">신 청 인 :</span>
                <input type="text" className="text-xl text-center border-b border-gray-800 dark:border-gray-500 w-32 outline-none font-serif bg-transparent" />
                <span className="text-lg font-bold font-serif text-gray-800 dark:text-[#E0E0E0]">(인)</span>
            </div>
            <h3 className="text-3xl font-bold tracking-[0.2em] font-serif text-gray-900 dark:text-[#E0E0E0]">더데이치과 귀중</h3>
        </div>
    </div>
      <div className="mt-6 text-center text-xs text-[#8D7B68] dark:text-[#A4907C] opacity-60 print:hidden pb-6">
          <p className="md:hidden">© {new Date().getFullYear()} Alvin</p>
          <div className="hidden md:flex justify-center items-center gap-1.5">
            <p>© {new Date().getFullYear()} Alvin. All rights reserved.</p>
            <a 
              href="https://github.com/seogi1004/dental-al" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="GitHub Repository"
              className="hover:text-[#5C5552] dark:hover:text-[#E0E0E0] transition-colors"
            >
              <Github className="w-4 h-4" />
            </a>
          </div>
      </div>
  </div>
)}
    </div>
  </div>
  );
}
