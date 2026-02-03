'use client';

import { FileText } from 'lucide-react';

export default function HelpPanel() {
  return (
    <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-2xl shadow-sm border border-[#F0EAE4] dark:border-[#333333] sticky top-6 h-fit transition-colors duration-300">
      <h3 className="font-bold text-lg mb-4 text-[#5C5552] dark:text-[#E0E0E0] flex items-center gap-2">
        💡 사용 가이드
      </h3>
      
      <div className="space-y-6 text-sm text-[#5C5552] dark:text-[#A0A0A0]">
        
        <div>
          <h4 className="font-bold text-[#8D7B68] dark:text-[#A4907C] mb-2 flex items-center gap-2">
            1. 권한 안내
          </h4>
          <ul className="list-disc pl-4 space-y-1">
            <li><strong className="text-[#5C5552] dark:text-[#E0E0E0]">관리자</strong>: 연차 추가/수정/삭제, 직원 관리 <span className="text-xs text-green-600">(편집 권한 필요)</span></li>
            <li><strong className="text-[#A4907C] dark:text-[#C4B09C]">일반 사용자</strong>: 달력 조회만 가능</li>
          </ul>
        </div>

        <div className="h-px bg-[#F0EAE4] dark:bg-[#333333]"></div>

        <div>
          <h4 className="font-bold text-[#8D7B68] dark:text-[#A4907C] mb-2">
            2. 연차 등록 및 관리
          </h4>
          <p className="mb-2">두 가지 방법으로 가능합니다:</p>
          <ul className="list-disc pl-4 space-y-1 mb-3 text-xs">
            <li><strong>웹에서 추가</strong>: 달력 날짜에 마우스를 올리고 <span className="bg-[#EBE5DD] dark:bg-[#444444] px-1 rounded font-bold text-[#8D7B68] dark:text-[#A4907C]">+</span> 버튼 클릭</li>
            <li><strong>구글 시트</strong>: 빈 칸에 날짜 직접 입력 (예: 01/15)</li>
          </ul>
          <div className="bg-[#FDFBF7] dark:bg-[#121212] p-3 rounded-lg border border-[#F0EAE4] dark:border-[#333333] space-y-2 font-mono text-xs mb-3">
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
          <p className="text-xs text-[#5C5552] dark:text-[#A0A0A0] bg-[#F2EBE5] dark:bg-[#2D2D2D] p-2 rounded">
            💡 <strong>Tip:</strong> 날짜 셀에 마우스를 올리면 + 버튼이 나타납니다. 클릭하여 <strong>수정/삭제</strong>도 가능합니다!
          </p>
        </div>

        <div className="flex items-start gap-3 p-3 bg-[#F9F5F1] dark:bg-[#2C2C2C] rounded-xl border border-[#F0EAE4] dark:border-[#333333]">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400">
            <span className="text-xs font-bold">OFF</span>
          </div>
          <div>
            <h4 className="font-bold text-[#5C5552] dark:text-[#E0E0E0] text-sm mb-1">오프(Off) 관리</h4>
            <p className="text-xs text-[#8D7B68] dark:text-[#A0A0A0] leading-relaxed">
              달력 날짜 우측 상단의 <span className="font-bold text-blue-500">OFF</span> 버튼을 눌러 정기 휴무를 등록하세요.
              <br className="mb-1" />
              수정/삭제하려면 달력에 표시된 파란색 오프 박스를 클릭하세요.
            </p>
          </div>
        </div>

        <div className="h-px bg-[#F0EAE4] dark:bg-[#333333]"></div>

        <div>
          <h4 className="font-bold text-[#8D7B68] dark:text-[#A4907C] mb-2">
            3. 데이터 확인 및 경고
          </h4>
          <ul className="list-disc pl-4 space-y-1">
            <li><span className="text-red-500 font-bold">빨간 배경</span>: 같은 날 중복 입력 시 표시됩니다.</li>
            <li><span className="text-amber-500 font-bold">⚠️ 스프레드시트 확인</span>: 날짜 형식 오류 시 우측 상단에 표시됩니다.</li>
            <li>상세 오류 목록은 달력 위에서 확인 가능합니다.</li>
          </ul>
        </div>

        <div className="h-px bg-[#F0EAE4] dark:bg-[#333333]"></div>

        <div>
          <h4 className="font-bold text-[#8D7B68] dark:text-[#A4907C] mb-2">
            4. 주의사항
          </h4>
          <ul className="list-disc pl-4 space-y-1">
            <li>구글 시트의 <strong>편집 권한</strong>이 있어야 관리자 기능이 활성화됩니다.</li>
            <li>직원 이름은 <strong>수정 불가</strong>합니다. (데이터 연결 기준)</li>
            <li>오타 발생 시 삭제 후 다시 추가해주세요.</li>
            <li>시트 데이터는 <strong>1초 후 자동 동기화</strong>됩니다.</li>
          </ul>
        </div>

        <a 
          href="https://docs.google.com/spreadsheets/d/1dmMlb4IxUQO9AZBVSAgS72cXDJqWDLicx-FL0IzH5Eo/edit#gid=191374435"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 w-full flex items-center justify-center gap-2 bg-[#8D7B68] dark:bg-[#6D5B4B] hover:bg-[#7A6A59] dark:hover:bg-[#5C4A3A] text-white px-4 py-3 rounded-xl transition-colors font-bold text-sm shadow-sm"
        >
          <FileText className="w-4 h-4" /> 구글 시트 바로가기
        </a>
      </div>
    </div>
  );
}
