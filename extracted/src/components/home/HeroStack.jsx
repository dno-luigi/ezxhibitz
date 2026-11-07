// The approved artwork: a large upright, deeply fanned stack of document pages
// with exhibit tabs, sitting on a pale green oval. Built in CSS so it stays sharp.
const TABS = ["#E4572E", "#0E7A54", "#0E7A54", "#0E7A54", "#0E7A54", "#0E7A54", "#0E7A54", "#0E7A54"];
const LINES = [92, 86, 90, 70, 88, 80, 60, 0, 90, 84, 66];

export default function HeroStack() {
  const n = TABS.length;
  return (
    <div className="flex h-[350px] items-center justify-center overflow-visible sm:h-[520px] lg:h-auto">
    <div
      role="img"
      aria-label="A fanned stack of white document pages with colored exhibit tabs"
      className="relative left-1/2 aspect-[1/1] w-[330px] max-w-none shrink-0 -translate-x-1/2 sm:w-[440px] lg:left-0 lg:mx-auto lg:w-[560px] lg:translate-x-0"
    >
      <div className="absolute inset-x-0 inset-y-[8%] rounded-[50%] bg-surface" />
      <div className="absolute left-[51%] top-[19%] aspect-[8.5/11] w-[47%] lg:left-[30%]">
        {TABS.map((tab, i) => {
          const back = n - 1 - i;
          const front = i === n - 1;
          return (
            <div
              key={i}
              className="absolute inset-0 rounded-[4px] border border-[#E6ECE8] bg-[#FDFDFB]"
              style={{
                transformOrigin: "50% 100%",
                transform: `translateX(${-back * 8}%) rotate(${-8 - back * 2.2}deg)`,
                boxShadow: front
                  ? "0 28px 50px -22px rgba(15,32,25,0.38)"
                  : "-2px 6px 14px -8px rgba(15,32,25,0.22)",
              }}
            >
              <span
                className="absolute -top-[3.5%] right-[6%] h-[4.5%] w-[12%] rounded-[2px]"
                style={{ background: tab }}
              />
              {front ? (
                <div className="absolute inset-[11%_10%] flex flex-col gap-[4.5%]" aria-hidden="true">
                  <span className="h-[2.6%] w-[40%] rounded bg-[#D9DEDB]" />
                  <span className="h-[2%]" />
                  {LINES.map((w, k) =>
                    w ? (
                      <span key={k} className="h-[1.8%] rounded bg-[#E0E5E2]" style={{ width: `${w}%` }} />
                    ) : (
                      <span key={k} className="h-[1.8%]" />
                    )
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
