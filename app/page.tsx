'use client';

import React, { useState, useEffect } from 'react';
import { 
  Printer, Plus, Calendar, User, FileText, 
  Trash2, Moon, Sun
} from 'lucide-react';

import { useSession, signIn, signOut } from "next-auth/react";
import { useTheme } from "next-themes";

import { Staff, StaffData } from '@/types';
import { theme } from '@/lib/theme';
import { getTodayString, formatDate, parseLeaveDate } from '@/lib/date';
import { UserMenu, TodayStatusCard, MobileScheduleList, DesktopCalendar, HelpPanel } from '@/components';
import { useSheetData, useLeaveCalculations } from '@/hooks';
import { addLeave, updateLeave, deleteLeave } from '@/services';

export default function DentalLeaveApp() {
  const { data: session, status } = useSession();
  const { theme: currentTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const loadingSession = status === "loading";

  useEffect(() => setMounted(true), []);

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
  } = useLeaveCalculations(staffData);

  const invalidLeaves = getInvalidLeaves();
  const sundayLeaves = getSundayLeaves();
  const isAdmin = (session as any)?.isAdmin;

  const handleLeaveClickWrapper = async (staffName: string, originalDate: string, dateYMD: string) => {
    if (!isAdmin) {
      alert("관리자만 수정할 수 있습니다.");
      return;
    }
    
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
    
    const newValue = prompt("연차 날짜를 수정하세요:\n\n예: 01/15, 01/15 AM, 01/15 PM", displayDate);
    if (newValue === null) return;
    if (newValue.trim() === '' || newValue.trim() === originalDate) return;
    
    const datePattern = /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12][0-9]|3[01])(\s+(AM|PM))?$/i;
    if (!datePattern.test(newValue.trim())) {
      alert("올바른 형식으로 입력해주세요.\n\n예: 01/15, 01/15 AM, 01/15 PM");
      return;
    }
    
    try {
      await updateLeave(staffName, originalDate, newValue.trim());
      fetchSheetData();
    } catch (e: any) {
      console.error(e);
      if (e.message && (e.message.includes('invalid authentication') || e.message.includes('credentials'))) {
        alert("세션이 만료되었습니다. 다시 로그인해주세요.");
        signOut();
        return;
      }
      alert("수정 실패: " + e.message);
    }
  };

  const handleLeaveDeleteWrapper = async (staffName: string, originalDate: string) => {
    if (!isAdmin) {
      alert("관리자만 삭제할 수 있습니다.");
      return;
    }
    
    if (!confirm(`${staffName}님의 연차(${originalDate})를 삭제하시겠습니까?`)) {
      return;
    }
    
    try {
      await deleteLeave(staffName, originalDate);
      fetchSheetData();
    } catch (e: any) {
      console.error(e);
      if (e.message && (e.message.includes('invalid authentication') || e.message.includes('credentials'))) {
        alert("세션이 만료되었습니다. 다시 로그인해주세요.");
        signOut();
        return;
      }
      alert("삭제 실패: " + e.message);
    }
  };

  const handleLeaveAddWrapper = async (dateStr: string) => {
    if (!isAdmin) {
      alert("관리자만 추가할 수 있습니다.");
      return;
    }
    
    const staffNames = staffData.map(s => s.name).join(', ');
    const selectedName = prompt(`연차를 추가할 직원 이름을 입력하세요:\n\n현재 직원: ${staffNames}`);
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
    
    const typeInput = prompt("연차 타입을 입력하세요:\n\n• 공백 또는 Enter = 종일 연차\n• AM = 오전 반차\n• PM = 오후 반차", "");
    if (typeInput === null) return;
    
    let typeUpper = typeInput.trim().toUpperCase();
    
    if (typeUpper === 'A') typeUpper = 'AM';
    if (typeUpper === 'P') typeUpper = 'PM';
    
    if (typeUpper !== '' && typeUpper !== 'AM' && typeUpper !== 'PM') {
      alert("올바른 타입을 입력해주세요.\n\n• 공백 = 종일\n• AM = 오전 반차\n• PM = 오후 반차");
      return;
    }
    
    const existingLeave = staff.leaves?.find(leafObj => {
      const { date } = parseLeaveDate(leafObj.parsed);
      return date === dateStr;
    });
    
    if (existingLeave) {
      alert(`${staff.name}님은 이 날짜에 이미 연차가 등록되어 있습니다.\n\n기존: ${existingLeave.original}\n\n수정이 필요하면 기존 항목을 클릭해주세요.`);
      return;
    }
    
    const finalDate = typeUpper ? `${baseDate} ${typeUpper}` : baseDate;
    
    try {
      await addLeave(staff.name, finalDate);
      fetchSheetData();
    } catch (e: any) {
      console.error(e);
      if (e.message && (e.message.includes('invalid authentication') || e.message.includes('credentials'))) {
        alert("세션이 만료되었습니다. 다시 로그인해주세요.");
        signOut();
        return;
      }
      alert("추가 실패: " + e.message);
    }
  };

  const addStaff = () => {
    if (!isAdmin) {
      alert("관리자 권한이 필요한 기능입니다.");
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
                ) : <span className="font-bold text-lg text-[#5C5552] dark:text-[#E0E0E0]">{staff.name}</span>}
                <span className="text-xs bg-white dark:bg-[#1E1E1E] border border-[#EBE5DD] dark:border-[#444444] px-1.5 py-0.5 rounded text-[#8D7B68] dark:text-[#A4907C]">
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
      <div className={`w-full max-w-6xl ${theme.paper} rounded-3xl shadow-xl overflow-hidden border ${theme.border} min-h-[850px] transition-colors duration-300`}>
        
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
                 
                 <div className="lg:col-span-9">
                     <div className="md:hidden mb-6">
                        <div className="mb-4">
                          <TodayStatusCard 
                             todayLeaves={getTodayLeaves()} 
                             loading={loading} 
                             statusMsg={statusMsg} 
                          />
                        </div>
                        <MobileScheduleList 
                          leaves={getCurrentMonthLeaves()}
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
                                   loading={loading} 
                                   statusMsg={statusMsg} 
                                 />
                             </div>
                             <div className="col-span-2">
                                  {invalidLeaves.length > 0 || sundayLeaves.length > 0 ? (
                                     <div className="h-full bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-700 p-5 flex items-center justify-center transition-colors">
                                         <p className="text-amber-800 dark:text-amber-300 font-medium text-center">
                                             ⚠️ 연차 일정 확인이 필요합니다
                                         </p>
                                     </div>
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

                 <div className="hidden lg:block lg:col-span-3">
                     <HelpPanel />
                 </div>
             </div>
           </div>
         )}

         {activeTab === 'form' && (
            <div className="p-8 md:p-12 bg-white dark:bg-[#1E1E1E] min-h-[800px] flex justify-center transition-colors duration-300">
                <div className="max-w-3xl w-full border-2 border-black dark:border-white p-8 md:p-16 relative bg-white dark:bg-[#1E1E1E] text-black dark:text-white">
                    <button onClick={() => window.print()} className="absolute top-4 right-4 print:hidden flex items-center gap-2 text-[#8D7B68] dark:text-[#A4907C] hover:text-[#5C5552] dark:hover:text-[#E0E0E0] font-bold">
                        <Printer className="w-5 h-5" /> 인쇄하기
                    </button>

                    <div className="text-center mb-16 border-b-2 border-black dark:border-white pb-8">
                        <h1 className="text-4xl font-serif font-bold tracking-widest mb-4">연 차 신 청 서</h1>
                        <p className="text-sm tracking-widest opacity-60">LEAVE APPLICATION FORM</p>
                    </div>

                    <div className="space-y-12 font-serif">
                        <div className="grid grid-cols-2 gap-8">
                            <div className="border-b border-black dark:border-white pb-2 flex gap-4 items-end">
                                <span className="text-sm font-bold w-16 text-left">성 명</span>
                                <span className="flex-1 text-center text-xl"></span>
                            </div>
                            <div className="border-b border-black dark:border-white pb-2 flex gap-4 items-end">
                                <span className="text-sm font-bold w-16 text-left">직 위</span>
                                <span className="flex-1 text-center text-xl"></span>
                            </div>
                        </div>

                        <div className="border-b border-black dark:border-white pb-2 flex gap-4 items-end">
                            <span className="text-sm font-bold w-16 text-left shrink-0">기 간</span>
                            <span className="flex-1 text-center text-xl flex justify-center gap-4 items-center">
                                <span>2024년</span>
                                <span>월</span>
                                <span>일</span>
                                <span className="text-sm mx-2">~</span>
                                <span>2024년</span>
                                <span>월</span>
                                <span>일</span>
                            </span>
                        </div>

                        <div className="border-b border-black dark:border-white pb-2 flex gap-4 items-end">
                            <span className="text-sm font-bold w-16 text-left shrink-0">종 류</span>
                            <div className="flex-1 flex justify-around text-sm">
                                <label className="flex items-center gap-2"><div className="w-4 h-4 border border-black dark:border-white"></div> 연차</label>
                                <label className="flex items-center gap-2"><div className="w-4 h-4 border border-black dark:border-white"></div> 반차</label>
                                <label className="flex items-center gap-2"><div className="w-4 h-4 border border-black dark:border-white"></div> 월차</label>
                                <label className="flex items-center gap-2"><div className="w-4 h-4 border border-black dark:border-white"></div> 기타</label>
                            </div>
                        </div>

                        <div className="border-b border-black dark:border-white pb-2 flex gap-4 items-end">
                            <span className="text-sm font-bold w-16 text-left shrink-0">사 유</span>
                            <span className="flex-1 text-left px-2"></span>
                        </div>

                        <div className="mt-20 text-center space-y-4">
                            <p className="leading-loose">위와 같이 휴가를 신청하오니 허락하여 주시기 바랍니다.</p>
                            <p className="mt-8 font-bold text-lg">2024년 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;월 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;일</p>
                            <div className="mt-16 flex justify-end gap-4 items-center pr-12">
                                <span>신청인 : </span>
                                <span className="w-24 border-b border-black dark:border-white"></span>
                                <span>(인)</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-32 text-center border-t-2 border-black dark:border-white pt-8">
                        <h2 className="text-2xl font-bold tracking-widest">더데이치과 원장 귀하</h2>
                    </div>
                </div>
            </div>
         )}
       </div>
    </div>
  );
}
