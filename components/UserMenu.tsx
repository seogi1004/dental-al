'use client';

import { useState } from 'react';
import { User, LogIn, LogOut, CheckCircle } from 'lucide-react';

interface UserMenuProps {
  session: {
    user?: {
      name?: string | null;
      image?: string | null;
    };
    isAdmin: boolean;
  } | null;
  signIn: (provider: string) => void;
  signOut: () => void;
}

export default function UserMenu({ session, signIn, signOut }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  if (!session) {
    return (
      <button onClick={() => signIn("google")} className="ml-2 bg-[#7A6A59] dark:bg-[#4A3B2F] hover:bg-[#6B5D4D] text-[#EBE5DD] hover:text-white px-4 py-2 rounded-full transition text-sm font-bold flex items-center gap-2 shadow-sm">
        <LogIn className="w-4 h-4" /> 로그인
      </button>
    );
  }

  return (
    <div className="relative ml-2">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center justify-center w-10 h-10 rounded-full overflow-hidden border-2 border-[#7A6A59] dark:border-[#444444] hover:border-[#EBE5DD] transition focus:outline-none"
        title="사용자 메뉴"
      >
        {session.user?.image ? (
          <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[#7A6A59] flex items-center justify-center text-white">
            <User className="w-5 h-5" />
          </div>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10 cursor-default" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#2C2C2C] rounded-xl shadow-xl border border-[#F0EAE4] dark:border-[#444444] z-20 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
            <div className="px-4 py-3 border-b border-[#F0EAE4] dark:border-[#444444]">
              <p className="text-sm font-bold text-[#5C5552] dark:text-[#E0E0E0] truncate">{session.user?.name || '사용자'}</p>
              <p className="text-xs text-[#A4907C] dark:text-[#A0A0A0] mt-1 flex items-center gap-1">
                {session.isAdmin ? (
                  <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded flex items-center gap-1 font-medium">
                    <CheckCircle className="w-3 h-3" /> 관리자 (Editor)
                  </span>
                ) : (
                  <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded font-medium">
                    일반 사용자 (Viewer)
                  </span>
                )}
              </p>
            </div>
            <button 
              onClick={() => signOut()} 
              className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-[#F9F7F2] dark:hover:bg-[#3D3D3D] flex items-center gap-2 transition-colors font-medium"
            >
              <LogOut className="w-4 h-4" /> 로그아웃
            </button>
          </div>
        </>
      )}
    </div>
  );
}
