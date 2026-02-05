'use client';

import { Clock, CheckCircle, RefreshCw } from 'lucide-react';


interface TodayStatusCardProps {
  todayLeaves: Array<{
    name: string;
    leaveType?: 'AM' | 'PM' | 'FULL';
  }>;
  todayOffs: Array<{
    name: string;
    memo?: string;
    type?: 'AM' | 'PM';
  }>;
  loading: boolean;
  statusMsg: string;
}

export default function TodayStatusCard({ todayLeaves, todayOffs, loading, statusMsg }: TodayStatusCardProps) {
  // 상태 메시지 결정
  let displayStatus = "자동 동기화";
  let StatusIcon = CheckCircle;
  let spin = false;

  if (loading || statusMsg === '저장 중...' || statusMsg === '수정 중...' || statusMsg === '삭제 중...' || statusMsg === '추가 중...') {
    displayStatus = statusMsg || "동기화 중...";
    StatusIcon = RefreshCw;
    spin = true;
  } else if (statusMsg) {
    displayStatus = statusMsg;
    StatusIcon = CheckCircle;
  }

  const uniqueAbsent = new Set([
    ...todayLeaves.map(l => l.name),
    ...todayOffs.map(o => o.name)
  ]);
  const totalAbsent = uniqueAbsent.size;

  return (
    <div className="bg-[#8D7B68] dark:bg-[#5C4A3A] text-white p-5 rounded-2xl shadow-lg flex items-center justify-between mb-4 h-full transition-colors duration-300">
      <div>
        <h3 className="text-sm opacity-90 mb-1 flex items-center gap-1"><Clock className="w-4 h-4"/> 오늘의 현황</h3>
        <p className="text-2xl font-bold">
          {totalAbsent > 0 ? `${totalAbsent}명 부재중` : "전원 출근"}
        </p>
        {todayLeaves.length > 0 && (
          <div className="text-xs mt-2 opacity-80 flex flex-wrap gap-2">
            <span className="font-bold mr-1">🏖️ 연차:</span>
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
         {todayOffs.length > 0 && (
           <div className="text-xs mt-2 opacity-90 flex flex-wrap gap-2 text-blue-100">
              <span className="font-bold mr-1">🔵 오프:</span>
              {todayOffs.map((p, i) => (
                <span key={i} className="flex items-center gap-1">
                  {p.name}
                  {p.type === 'AM' && <span className="bg-white/20 px-1 rounded text-[10px]">A</span>}
                  {p.type === 'PM' && <span className="bg-white/20 px-1 rounded text-[10px]">P</span>}
                  {i < todayOffs.length - 1 && <span>,</span>}
                </span>
              ))}
           </div>
         )}
      </div>
      <div className="flex flex-col items-end gap-1">
        <div className={`bg-white/20 p-3 rounded-full transition-all duration-300 ${spin ? 'animate-spin-slow' : ''}`}>
          <StatusIcon className="w-6 h-6 text-white" />
        </div>
        <span className="text-[10px] opacity-80 font-medium">{displayStatus}</span>
      </div>
    </div>
  );
}
