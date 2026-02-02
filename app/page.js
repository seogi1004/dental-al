'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Printer, Plus, RefreshCw, CheckCircle, 
  Calendar, User, FileText, LogOut, X, LogIn, 
  Trash2, ChevronRight
} from 'lucide-react';

// 실제 NextAuth 훅 사용
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

export default function DentalLeaveApp() {
  const { data: session, status } = useSession();
  const loadingSession = status === "loading";

  const [activeTab, setActiveTab] = useState('list');
  const [staffData, setStaffData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [saveTimeout, setSaveTimeout] = useState(null);

  // ==================================================================================
  // API 통신 함수
  // ==================================================================================
  
  const fetchSheetData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sheets'); 
      if (!res.ok) {
        setStaffData([]); 
        setStatusMsg('데이터 로드 실패');
        return;
      }
      const data = await res.json();
      setStaffData(data && data.length > 0 ? data : []);
      setStatusMsg('동기화 완료');
    } catch (error) {
      console.error("Fetch Error:", error);
      setStatusMsg('연결 오류');
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
    
    // 날짜 변경 시 연차 자동 계산
    if (field === 'date' && value) {
      const joinDate = new Date(value);
      const today = new Date();
      let years = today.getFullYear() - joinDate.getFullYear();
      const m = today.getMonth() - joinDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < joinDate.getDate())) {
        years--;
      }

      let leave = 0;
      if (years < 1) {
        leave = 11; 
      } else {
        leave = 15 + Math.floor((years - 1) / 2);
        if (leave > 25) leave = 25;
      }
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
      total: 11, // 기본값 설정
      used: 0, 
      memo: "",
      isNew: true 
    };
    const newData = [...staffData, newItem];
    setStaffData(newData);
    saveSheetData(newData);
  };

  const deleteStaff = (index) => {
    if (!session) return;
    if (confirm("정말 삭제하시겠습니까? 구글 시트에서도 삭제됩니다.")) {
      const newData = staffData.filter((_, i) => i !== index);
      setStaffData(newData);
      saveSheetData(newData);
    }
  };

  // ==================================================================================
  // 렌더링
  // ==================================================================================

  if (loadingSession) {
    return <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] text-[#8D7B68]">로딩 중...</div>;
  }

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} p-4 md:p-8 flex justify-center font-sans`}>
      <div className={`w-full max-w-5xl ${theme.paper} rounded-3xl shadow-xl overflow-hidden border ${theme.border} min-h-[850px]`}>
        
        {/* 헤더 영역 */}
        <div className="bg-[#8D7B68] p-6 text-white flex flex-col md:flex-row justify-between items-center shadow-md print:hidden">
            <h1 className="text-2xl font-bold flex items-center gap-3 tracking-wide">
                <span className="text-[#FDFBF7]">더데이치과</span> 
                <span className="text-[#EBE5DD] font-light text-lg opacity-80 hidden md:inline">| 연차 관리 시스템</span>
            </h1>
            
            <div className="flex gap-3 mt-4 md:mt-0 items-center">
                {/* 탭 메뉴: 모바일에서는 현황표만 보이게 신청서 버튼을 숨김(hidden md:flex) */}
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
                
                {/* 로그인 상태 버튼 */}
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
            <div className="bg-white rounded-2xl shadow-sm p-4 md:p-8 border border-[#F0EAE4]">
                <div className="flex justify-between items-end mb-6 pb-6 border-b border-[#F0EAE4]">
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-[#5C5552] flex items-center gap-2">
                           <User className="w-6 h-6 text-[#A4907C]" /> 
                           <span className="hidden md:inline">직원 연차 현황 (2026년)</span>
                           <span className="md:hidden">연차 현황</span>
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
                      {/* 1. 데스크탑 뷰 (테이블) */}
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
                                              {/* 데스크탑: 발생/사용 연차 수정 불가 (요청사항 반영) */}
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
                      {/* 2. 모바일 뷰 (카드 리스트) */}
                      {/* ======================= */}
                      <div className="md:hidden space-y-4">
                        {staffData.map((staff, index) => {
                           const remain = (parseFloat(staff.total) || 0) - (parseFloat(staff.used) || 0);
                           const isSessionActive = !!session;

                           return (
                             <div key={index} className="bg-white p-5 rounded-2xl shadow-sm border border-[#F0EAE4] flex flex-col gap-3 relative">
                                {/* 상단: 이름, 직급, 삭제버튼 */}
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

                                {/* 중간: 입사일 */}
                                <div className="flex items-center gap-2 text-sm text-[#8D7B68]">
                                   <span className="text-xs bg-[#F2EBE5] px-2 py-0.5 rounded text-[#8D7B68]">입사일</span>
                                   <input type="date" value={staff.date} 
                                        onChange={(e) => handleUpdate(index, 'date', e.target.value)} 
                                        onBlur={handleBlur} 
                                        readOnly={!isSessionActive}
                                        className="bg-transparent outline-none text-[#5C5552] text-sm w-32"
                                   />
                                </div>

                                {/* 하단: 연차 통계 (카드 형태) */}
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

                                {/* 메모 */}
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
        )}

        {/* 탭 2: 연차 신청서 (데스크탑에서만 보임 - md:hidden 처리 대신 탭 버튼을 숨겼으므로 여기는 렌더링 되어도 접근 불가하지만, 안전하게 숨김 처리 가능) */}
        {activeTab === 'form' && (
          <div className="p-8 bg-[#FDFBF7] flex flex-col items-center">
             {/* ... 기존 신청서 코드 유지 ... */}
             <div className="w-full flex justify-end mb-6 print:hidden">
                <button onClick={() => window.print()} className={`flex items-center gap-2 ${theme.primary} text-white px-5 py-2.5 rounded-xl transition shadow-md text-sm font-bold`}>
                    <Printer className="w-4 h-4" /> 인쇄하기
                </button>
            </div>

            <div className="bg-white p-[15mm] w-[210mm] min-h-[297mm] shadow-lg mx-auto text-[#333] relative rounded-sm print:shadow-none print:w-full print:m-0">
                {/* ... 신청서 내부 내용은 기존과 동일 ... */}
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
