import type { ReactNode } from "react";

// Responsive iPhone frame: seamless native viewport on mobile screens, elegant Apple device shell on desktop.
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-radial-spot flex items-center justify-center md:px-4 md:py-8">
      <div className="relative w-full h-full md:h-auto md:max-w-[410px]">
        {/* Device shell (styled as iPhone 16 Pro on desktop, full-bleed on mobile) */}
        <div className="relative md:rounded-[3rem] md:p-[6px] md:bg-gradient-to-b md:from-white/20 md:to-white/5 md:shadow-[0_40px_120px_-20px_rgba(0,0,0,0.85)] min-h-screen md:min-h-0">
          <div className="relative md:rounded-[2.7rem] overflow-hidden bg-background md:border md:border-white/10 min-h-screen md:min-h-0 flex flex-col">
            {/* Dynamic island (discreet on mobile, styled on desktop) */}
            <div className="hidden md:block absolute top-2.5 left-1/2 -translate-x-1/2 z-50 h-7 w-28 rounded-full bg-black shadow-inner" />

            {/* Apple Status bar */}
            <div className="relative z-40 flex items-center justify-between px-6 md:px-7 pt-3 pb-2 text-[11px] font-semibold text-foreground/80 shrink-0">
              <span className="tabular-nums">9:41</span>
              <span className="flex items-center gap-1.5 opacity-80">
                <span className="text-[10px] uppercase font-bold text-primary">5G</span>
                <span className="inline-block w-4 h-2.5 rounded-sm border border-current p-[1px]">
                  <span className="block h-full w-full bg-primary rounded-[1px]" />
                </span>
              </span>
            </div>

            {/* Main scrollable app body */}
            <div className="flex-1 md:h-[760px] overflow-y-auto overflow-x-hidden scrollbar-thin flex flex-col">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
