import { Outlet } from 'react-router-dom';

export default function PlayerLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center overflow-x-hidden">
      {/* Decorative background elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-900/20 blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-900/20 blur-[100px]"></div>
      </div>
      
      <main className="relative z-10 flex-grow w-full max-w-5xl flex flex-col p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}
