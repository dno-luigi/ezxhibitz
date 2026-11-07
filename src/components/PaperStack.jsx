import { cn } from "@wron/kit";

// The settled packet as layered CSS rectangles: the 3D scene's fallback for
// reduced motion and weak devices, and the compact packet thumbnail after upload.
// Eight warm-white sheets, faint gray rules, green identifier tabs, one orange.
const TABS = ["#E4572E", "#0E7A54", "#0E7A54", "#0E7A54", "#0E7A54", "#0E7A54", "#0E7A54", "#0E7A54"];

export default function PaperStack({ className, sheets = 8, oval = true, label = "A settled stack of packet pages" }) {
  const list = TABS.slice(0, sheets);
  return (
    <div role="img" aria-label={label} className={cn("relative aspect-[4/3] w-full", className)}>
      {oval ? <div className="absolute inset-[6%_2%] rounded-[50%] bg-surface" /> : null}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative h-[72%] w-[42%] -rotate-[8deg]">
          {list.map((tab, i) => {
            const offset = (list.length - 1 - i) * 1.6;
            return (
              <div
                key={i}
                className="absolute inset-0 rounded-[6px] border border-[#E3EAE6] bg-[#FDFCF9]"
                style={{
                  transform: `translate(${-offset}%, ${-offset * 0.9}%)`,
                  boxShadow: i === list.length - 1 ? "0 18px 40px -18px rgba(15,32,25,0.28)" : "0 1px 2px rgba(15,32,25,0.06)",
                }}
              >
                <span
                  className="absolute -top-[4%] h-[5%] w-[9%] rounded-[2px]"
                  style={{ background: tab, right: `${6 + i * 9}%` }}
                />
                {i === list.length - 1 ? (
                  <div className="absolute inset-[12%_10%] flex flex-col gap-[5%]">
                    <span className="h-[3%] w-[40%] rounded bg-[#D9DEDB]" />
                    {[92, 86, 90, 70, 88, 80, 60, 0, 90, 84, 66].map((w, k) =>
                      w ? <span key={k} className="h-[2%] rounded bg-[#E2E6E4]" style={{ width: `${w}%` }} /> : <span key={k} className="h-[2%]" />
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
