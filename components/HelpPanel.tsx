'use client';

import { FileText, Shield, MousePointerClick, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

export default function HelpPanel() {
  return (
    <div className="bg-white dark:bg-[#1E1E1E] p-5 rounded-2xl shadow-sm border border-[#F0EAE4] dark:border-[#333333] sticky top-6 h-fit transition-colors duration-300">
      <div className="flex justify-between items-center mb-5">
        <h3 className="font-bold text-lg text-[#5C5552] dark:text-[#E0E0E0] flex items-center gap-2">
          <Info className="w-5 h-5 text-[#8D7B68]" /> 사용 가이드
        </h3>
      </div>
      
      <div className="space-y-6">
        
        {/* 1. 권한 안내 */}
        <div>
          <h4 className="font-bold text-[#8D7B68] dark:text-[#A4907C] mb-2 flex items-center gap-1.5 text-sm">
            <Shield className="w-4 h-4" /> 권한 안내
          </h4>
          <div className="text-xs space-y-1.5 text-[#5C5552] dark:text-[#A0A0A0]">
            <p className="flex justify-between">
              <span>👑 <strong className="text-[#5C5552] dark:text-[#E0E0E0]">관리자</strong></span>
              <span>연차/오프 관리, 직원 수정</span>
            </p>
            <p className="flex justify-between">
              <span>👤 <strong className="text-[#A4907C] dark:text-[#C4B09C]">사용자</strong></span>
              <span>현황 및 달력 조회</span>
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-dashed border-[#F0EAE4] dark:border-[#333333] space-y-1 text-left">
            <p className="text-[10px] text-[#5C5552] dark:text-[#A0A0A0] opacity-80 pl-1">
              * 모든 데이터는 구글 스프레드시트로 관리됩니다.
            </p>
            <p className="text-[10px] text-[#8D7B68] dark:text-[#A4907C] pl-1">
              * 편집 권한 요청: 최지원에게 구글 계정(이메일) 전달
            </p>
          </div>
        </div>

        <div className="h-px bg-[#F0EAE4] dark:bg-[#333333]"></div>

        {/* 2. 연차 vs 오프 */}
        <div>
           <h4 className="font-bold text-[#8D7B68] dark:text-[#A4907C] mb-2 flex items-center gap-1.5 text-sm">
            <CheckCircle2 className="w-4 h-4" /> 연차 vs 오프
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-center">
            <div className="bg-[#FDFBF7] dark:bg-[#252525] p-2 rounded border border-[#EBE5DD] dark:border-[#444444]">
              <div className="font-bold mb-1">🏖️ 연차</div>
              <div className="text-[10px] text-gray-500">연차 일수 <span className="text-red-500 font-bold">차감 O</span></div>
            </div>
            <div className="bg-[#F0F7FF] dark:bg-[#1A202C] p-2 rounded border border-blue-100 dark:border-blue-900">
              <div className="font-bold mb-1">🔵 오프</div>
              <div className="text-[10px] text-gray-500">연차 일수 <span className="text-blue-500 font-bold">차감 X</span></div>
            </div>
          </div>
        </div>

        <div className="h-px bg-[#F0EAE4] dark:bg-[#333333]"></div>

        {/* 3. 사용 방법 */}
        <div>
          <h4 className="font-bold text-[#8D7B68] dark:text-[#A4907C] mb-3 flex items-center gap-1.5 text-sm">
            <MousePointerClick className="w-4 h-4" /> 사용 방법
          </h4>
          
          <div className="space-y-3 text-xs text-[#5C5552] dark:text-[#A0A0A0]">
            <div>
              <strong className="block mb-1 text-[#5C5552] dark:text-[#E0E0E0]">1. 등록하기</strong>
              <ul className="list-disc pl-4 space-y-1">
                <li>달력 날짜의 <span className="bg-[#EBE5DD] dark:bg-[#444444] px-1 rounded font-bold text-[#8D7B68] dark:text-[#A4907C] text-[10px]">+</span> 버튼 (연차)</li>
                <li>달력 날짜의 <span className="text-blue-500 font-bold text-[10px]">OFF</span> 버튼 (오프)</li>
                <li>또는 구글 시트에 날짜 직접 입력</li>
              </ul>
            </div>
            
            <div>
              <strong className="block mb-1 text-[#5C5552] dark:text-[#E0E0E0]">2. 수정/삭제</strong>
              <p className="pl-1">등록된 연차/오프 박스를 클릭하세요.</p>
            </div>

            <div className="bg-[#FDFBF7] dark:bg-[#121212] p-2.5 rounded-lg border border-[#F0EAE4] dark:border-[#333333] space-y-1.5 font-mono text-[11px] mt-2">
              <div className="flex justify-between items-center">
                <span>종일</span>
                <span className="font-bold text-[#5C5552] dark:text-[#E0E0E0] bg-white dark:bg-[#333] px-1 rounded">01/15</span>
              </div>
              <div className="flex justify-between items-center text-yellow-700 dark:text-yellow-400">
                <span>오전</span>
                <span className="font-bold bg-white dark:bg-[#333] px-1 rounded">01/15 AM</span>
              </div>
              <div className="flex justify-between items-center text-orange-700 dark:text-orange-400">
                <span>오후</span>
                <span className="font-bold bg-white dark:bg-[#333] px-1 rounded">01/15 PM</span>
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-[#F0EAE4] dark:bg-[#333333]"></div>

        {/* 4. 주의사항 */}
        <div>
          <h4 className="font-bold text-[#8D7B68] dark:text-[#A4907C] mb-2 flex items-center gap-1.5 text-sm">
            <AlertTriangle className="w-4 h-4" /> 주의사항
          </h4>
          <ul className="list-disc pl-4 space-y-1.5 text-xs text-[#5C5552] dark:text-[#A0A0A0]">
            <li>데이터 수정 시 <strong>1초 후 자동 저장</strong>됩니다.</li>
            <li>직원 이름은 시트 연결 기준이므로 <span className="text-red-500 font-bold">수정 불가</span>합니다.</li>
            <li><span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1 rounded font-bold">중복</span> 입력 시 빨간색으로 표시됩니다.</li>
            <li><span className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-1 rounded font-bold">형식 오류</span> 시 노란색 경고가 뜹니다.</li>
          </ul>
        </div>

        <a 
          href="https://docs.google.com/spreadsheets/d/1dmMlb4IxUQO9AZBVSAgS72cXDJqWDLicx-FL0IzH5Eo/edit#gid=191374435"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center bg-[#8D7B68] dark:bg-[#6D5B4B] hover:bg-[#7A6A59] dark:hover:bg-[#5C4A3A] text-white px-4 py-3 rounded-xl transition-colors font-bold text-sm shadow-sm flex items-center justify-center gap-2"
        >
          <FileText className="w-4 h-4" /> 구글 시트 바로가기
        </a>
      </div>
    </div>
  );
}
