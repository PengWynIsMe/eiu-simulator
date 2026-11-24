import { useCallback, useEffect, useState } from 'react';
import { useLangStore } from '../../store/useLangStore';
import { useWalkStore } from '../../store/useWalkStore';
import {
  b4LocalToWorld,
  b4WalkYaw,
  b4WorldToLocal,
  LIBRARY_SERVICES,
  LIBRARY_TOUR_FLOORS,
  type LibraryWaypoint,
} from './libraryTourData';

function svgX(v: number): number {
  return 4 + ((28 - v) / 28) * 132;
}

function svgY(u: number): number {
  return 4 + (u / 67) * 260;
}

function svgRect(u1: number, u2: number, v1: number, v2: number) {
  const x1 = svgX(Math.max(v1, v2));
  const x2 = svgX(Math.min(v1, v2));
  const y1 = svgY(Math.min(u1, u2));
  const y2 = svgY(Math.max(u1, u2));
  return { x: x1, y: y1, width: Math.max(1, x2 - x1), height: Math.max(1, y2 - y1) };
}

function FloorMinimapSvg({
  floor,
  playerU,
  playerV,
  onSelectSpot,
}: {
  floor: 1 | 2 | 3;
  playerU: number;
  playerV: number;
  onSelectSpot: (spot: LibraryWaypoint) => void;
}) {
  const floorMenu = LIBRARY_TOUR_FLOORS.find((f) => f.floor === floor) ?? LIBRARY_TOUR_FLOORS[0];
  const pins = floorMenu ? [floorMenu.landing, ...floorMenu.spots] : [];

  const px = Math.max(6, Math.min(134, svgX(playerV)));
  const py = Math.max(6, Math.min(262, svgY(playerU)));

  return (
    <svg viewBox="0 0 140 268" className="h-auto w-full rounded-lg border border-white/15 bg-slate-900/95">
      {/* Khung nền tổng thể */}
      <rect x={4} y={4} width={132} height={260} fill="#9ca3af" stroke="#f8fafc" strokeWidth={1.5} />

      {/* Lõi Tây Bắc & Tây Nam chung */}
      <rect {...svgRect(0, 11.5, 10.5, 17.5)} fill="#e2e8f0" />
      <rect {...svgRect(3.5, 10.2, 19.6, 25.4)} fill="#eab308" />

      {floor === 1 && (
        <>
          {/* Góc trao đổi sách (Đông Bắc / trên phải) */}
          <rect {...svgRect(0.2, 10.5, 0.2, 10.5)} fill="#4d7c0f" />
          {/* 6 khoang Tự học (olive) */}
          {[11.5, 23.0, 34.5].map((u) => (
            <g key={`f1-ol-${u}`}>
              <rect {...svgRect(u, u + 11.0, 17.8, 27.6)} fill="#857b26" stroke="#f8fafc" strokeWidth={0.6} />
              <rect {...svgRect(u, u + 11.0, 0.4, 10.2)} fill="#857b26" stroke="#f8fafc" strokeWidth={0.6} />
            </g>
          ))}
          {/* Quầy thông tin (cam) */}
          <rect {...svgRect(35.0, 44.5, 12.6, 15.4)} fill="#f59e0b" rx={1} />
          {/* Khu máy in (tượng trưng xám đậm) */}
          <rect {...svgRect(46.8, 51.0, 1.5, 8.2)} fill="#475569" />
          {/* 2 Phòng máy tính đỏ (Bắc & Nam) */}
          <rect {...svgRect(52.2, 66.6, 17.8, 27.6)} fill="#991b1b" />
          <rect {...svgRect(52.2, 66.6, 0.4, 10.2)} fill="#991b1b" />
          {/* Cầu thang gáy sách trung tâm */}
          <rect {...svgRect(50.6, 66.6, 10.6, 17.4)} fill="#f59e0b" />
        </>
      )}

      {floor === 2 && (
        <>
          {/* WC Tây Bắc (xanh lá) & Phòng kỹ thuật (đỏ) */}
          <rect {...svgRect(0.2, 10.5, 0.2, 10.5)} fill="#3f6212" />
          <rect {...svgRect(0.2, 11.2, 24.0, 27.8)} fill="#991b1b" />
          {/* Khu tự học Tầng 2 (Bắc — 3 khoang olive) */}
          {[12.0, 25.5, 39.0].map((u) => (
            <rect key={`f2-n-${u}`} {...svgRect(u, u + 12.8, 0.4, 10.2)} fill="#857b26" stroke="#f8fafc" strokeWidth={0.6} />
          ))}
          {/* Khu học nhóm mở (Nam giữa — olive) */}
          {[12.0, 22.8, 33.6, 44.4].map((u) => (
            <rect key={`f2-s-${u}`} {...svgRect(u, u + 10.2, 17.6, 22.4)} fill="#857b26" stroke="#f8fafc" strokeWidth={0.6} />
          ))}
          {/* Phòng 09 đa năng + 8 phòng học nhóm 08..01 (cam dọc cạnh trái) */}
          <rect {...svgRect(11.5, 22.5, 22.6, 27.8)} fill="#d97706" stroke="#f8fafc" strokeWidth={0.7} />
          {Array.from({ length: 8 }, (_, i) => (
            <rect
              key={`f2-r-${i}`}
              {...svgRect(22.5 + i * 5.5, 28.0 + i * 5.5, 22.6, 27.8)}
              fill="#d97706"
              stroke="#f8fafc"
              strokeWidth={0.7}
            />
          ))}
          {/* Phòng 202 Server Room (đỏ góc dưới phải) */}
          <rect {...svgRect(52.0, 66.6, 0.4, 10.5)} fill="#991b1b" />
          {/* Giếng cầu thang trung tâm */}
          <rect {...svgRect(50.6, 66.6, 10.8, 17.2)} fill="#f59e0b" />
        </>
      )}

      {floor === 3 && (
        <>
          {/* WC Tây Bắc */}
          <rect {...svgRect(0.2, 10.5, 0.2, 10.5)} fill="#3f6212" />
          {/* Kệ sách trắng trên sơ đồ Tầng 3 */}
          {[13.5, 16.0, 18.5, 21.0, 41.0, 43.5, 46.0, 48.5, 53.5, 56.0, 58.5, 61.0].map((u) => (
            <g key={`f3-sh-${u}`}>
              <rect {...svgRect(u - 0.6, u + 0.6, 2.8, 8.6)} fill="#f8fafc" stroke="#475569" strokeWidth={0.4} />
              <rect {...svgRect(u - 0.6, u + 0.6, 19.4, 25.2)} fill="#f8fafc" stroke="#475569" strokeWidth={0.4} />
            </g>
          ))}
          {/* 2 Quầy lưu hành (cam) & khối STAFF ONLY (đỏ) */}
          <rect {...svgRect(19.5, 23.4, 11.2, 16.8)} fill="#f59e0b" />
          <rect {...svgRect(23.5, 35.5, 11.2, 16.8)} fill="#991b1b" />
          <rect {...svgRect(35.6, 40.0, 11.2, 16.8)} fill="#f59e0b" />
          {/* 2 Bàn tròn sách mới (xanh đậm) */}
          <circle cx={svgX(14.0)} cy={svgY(45.0)} r={5.5} fill="#365314" />
          <circle cx={svgX(14.0)} cy={svgY(15.2)} r={5.5} fill="#365314" />
          {/* Sảnh cầu thang LỐI RA EXIT */}
          <rect {...svgRect(49.8, 66.6, 10.6, 17.4)} fill="#f59e0b" />
        </>
      )}

      {/* Điểm ghim tham quan tương tác */}
      {pins.map((pin) => {
        const cx = svgX(pin.v);
        const cy = svgY(pin.u);
        return (
          <g key={pin.id} className="cursor-pointer" onClick={() => onSelectSpot(pin)}>
            <circle cx={cx} cy={cy} r={6} fill="transparent" />
            <circle cx={cx} cy={cy} r={3.2} fill="#0f172a" stroke="#f8fafc" strokeWidth={1} />
          </g>
        );
      })}

      {/* Vị trí người chơi hiện tại theo thời gian thực */}
      <circle cx={px} cy={py} r={6} fill="#38bdf8" fillOpacity={0.35} />
      <circle cx={px} cy={py} r={3.5} fill="#facc15" stroke="#0f172a" strokeWidth={1.2} />
    </svg>
  );
}

export default function LibraryHud() {
  const walkMode = useWalkStore((s) => s.walkMode);
  const interior = useWalkStore((s) => s.interior);
  const playerPos = useWalkStore((s) => s.playerPos);
  const lang = useLangStore((s) => s.lang);

  const isLibrary = Boolean(walkMode && interior?.buildingId.toLowerCase() === 'b4');
  const currentFloor = (interior?.floor === 2 || interior?.floor === 3 ? interior.floor : 1) as 1 | 2 | 3;

  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  const [minimapOpen, setMinimapOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  const [servicesOpen, setServicesOpen] = useState(false);
  const [activeServiceTab, setActiveServiceTab] = useState(LIBRARY_SERVICES[0]?.id ?? 'opac');
  const [activeSpotId, setActiveSpotId] = useState<string>('f1-main');

  const teleportToSpot = useCallback((spot: LibraryWaypoint) => {
    const store = useWalkStore.getState();
    const curFloor = store.interior?.floor ?? 1;
    const [x, z] = b4LocalToWorld(spot.u, spot.v);
    const yaw = b4WalkYaw(spot.dirU, spot.dirV);

    setActiveSpotId(spot.id);
    if (curFloor !== spot.floor) {
      store.setInteriorFloor(spot.floor);
    }

    const applyPose = () => {
      window.dispatchEvent(
        new CustomEvent('campussim:set-player-pose', {
          detail: { x, z, y: 0, yaw },
        })
      );
      useWalkStore.getState().setPlayerPos({ x, z, y: 0, floor: spot.floor });
    };

    applyPose();
    requestAnimationFrame(applyPose);

    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, []);

  // Tự thu gọn sidebar/minimap khi thu hẹp cửa sổ xuống giao diện di động
  useEffect(() => {
    let wasDesktop = typeof window !== 'undefined' ? window.innerWidth >= 768 : true;
    const onResize = () => {
      const isDesktop = window.innerWidth >= 768;
      if (wasDesktop && !isDesktop) {
        setSidebarOpen(false);
        setMinimapOpen(false);
      }
      wasDesktop = isDesktop;
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Esc đóng modal Dịch vụ trước khi thoát chế độ đi bộ
  useEffect(() => {
    if (!servicesOpen || !isLibrary) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        setServicesOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [servicesOpen, isLibrary]);

  if (!isLibrary) return null;

  const [playerU, playerV] = b4WorldToLocal(playerPos.x, playerPos.z);
  const activeService = LIBRARY_SERVICES.find((s) => s.id === activeServiceTab) ?? LIBRARY_SERVICES[0];

  return (
    <>
      {/* 1. THANH MENU BÊN TRÁI KIỂU EIU LIBRARY TOUR (có nút thu gọn / mở rộng) */}
      {sidebarOpen ? (
        <aside
          aria-label="Menu tham quan Thư viện EIU"
          className="fixed bottom-16 left-3 top-16 z-40 flex w-[258px] max-h-[calc(100dvh-10.5rem)] flex-col overflow-hidden rounded-2xl border border-[#A88753]/45 bg-[#151c27]/92 text-slate-100 shadow-2xl backdrop-blur-md md:max-h-none"
        >
          {/* Header thương hiệu vàng đồng EIU */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <div className="text-base font-extrabold tracking-wider text-[#d4af6a]">EIU LIBRARY</div>
              <div className="text-[10px] uppercase tracking-wide text-slate-300">
                {lang === 'vi' ? 'Trường ĐH Quốc tế Miền Đông' : 'Eastern International University'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              title={lang === 'vi' ? 'Ẩn danh mục' : 'Hide menu'}
              aria-label={lang === 'vi' ? 'Ẩn danh mục' : 'Hide menu'}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-white/25 bg-black/50 text-xs font-bold text-white hover:bg-[#A88753]"
            >
              ‹
            </button>
          </div>

          {/* Danh sách tầng & phân khu (Accordion) */}
          <nav className="flex-1 overflow-y-auto px-2.5 py-2">
            <div className="mb-1.5 px-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {lang === 'vi' ? 'THƯ VIỆN EIU' : 'EIU LIBRARY'}
            </div>
            <div className="space-y-1">
              {LIBRARY_TOUR_FLOORS.map((fl) => {
                const isFloorActive = currentFloor === fl.floor;
                return (
                  <div key={fl.floor} className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
                    <button
                      type="button"
                      onClick={() => teleportToSpot(fl.landing)}
                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs font-bold tracking-wide transition ${
                        isFloorActive
                          ? 'bg-[#A88753] text-white'
                          : 'text-slate-200 hover:bg-white/10'
                      }`}
                    >
                      <span>{fl.label[lang]}</span>
                      <span className="text-[10px] opacity-80">{isFloorActive ? '▾' : '▸'}</span>
                    </button>
                    {isFloorActive && (
                      <div className="divide-y divide-white/5 bg-black/25">
                        {fl.spots.map((spot) => {
                          const isSelectedSpot = activeSpotId === spot.id;
                          return (
                            <button
                              key={spot.id}
                              type="button"
                              onClick={() => teleportToSpot(spot)}
                              className={`block w-full px-3 py-1.5 text-left text-xs transition ${
                                isSelectedSpot
                                  ? 'bg-[#A88753]/25 font-semibold text-[#f3d494]'
                                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
                              }`}
                            >
                              {spot.title[lang]}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </nav>

          {/* Footer liên hệ & nút Dịch vụ */}
          <div className="space-y-2 border-t border-white/10 bg-black/30 px-3.5 py-2.5 text-[11px] text-slate-300">
            <button
              type="button"
              onClick={() => setServicesOpen(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#A88753] px-3 py-2 text-xs font-bold text-white shadow transition hover:bg-[#967643]"
            >
              <span>ⓘ</span>
              <span>{lang === 'vi' ? 'DỊCH VỤ & TIỆN ÍCH' : 'SERVICES & FACILITIES'}</span>
            </button>
            <div className="leading-snug text-[10px] text-slate-400">
              <div className="font-semibold text-[#d4af6a]">
                {lang === 'vi' ? 'THƯ VIỆN EIU · Block 4' : 'EIU LIBRARY · Block 4'}
              </div>
              <div>(+84) 274 222 1193 · lib@eiu.edu.vn</div>
              <a
                href="https://lib.eiu.edu.vn"
                target="_blank"
                rel="noreferrer"
                className="text-sky-300 underline underline-offset-2 hover:text-sky-200"
              >
                lib.eiu.edu.vn
              </a>
            </div>
          </div>
        </aside>
      ) : (
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="fixed bottom-44 left-3 z-40 flex items-center gap-1.5 rounded-xl border border-[#A88753]/60 bg-[#151c27]/90 px-3 py-1.5 text-xs font-bold text-[#f3d494] shadow-xl backdrop-blur-md hover:bg-[#1e2736] md:bottom-auto md:top-16"
        >
          <span>☰</span>
          <span>{lang === 'vi' ? 'Thư viện' : 'Library'}</span>
        </button>
      )}

      {/* 2. SƠ ĐỒ MẶT BẰNG TƯƠNG TÁC (GÓC PHẢI DƯỚI TRÊN DESKTOP / GỌN GÀNG TRÊN MOBILE) */}
      {minimapOpen && (
        <div className="fixed bottom-56 right-3 z-40 w-[136px] rounded-2xl border border-[#A88753]/50 bg-[#151c27]/92 p-2 text-white shadow-2xl backdrop-blur-md md:bottom-28 md:right-4 md:w-[152px]">
          <div className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#d4af6a]">
            <span>{lang === 'vi' ? `Sơ đồ Tầng ${currentFloor}` : `Floor ${currentFloor} Map`}</span>
            <button
              type="button"
              onClick={() => setMinimapOpen(false)}
              className="rounded px-1 text-slate-300 hover:bg-white/10"
              aria-label={lang === 'vi' ? 'Ẩn sơ đồ' : 'Hide map'}
            >
              ✕
            </button>
          </div>
          <FloorMinimapSvg
            floor={currentFloor}
            playerU={playerU}
            playerV={playerV}
            onSelectSpot={teleportToSpot}
          />
          <div className="mt-1 text-center text-[9px] text-slate-400">
            {lang === 'vi' ? 'Chạm điểm trên sơ đồ để đi tới' : 'Tap pins on map to jump'}
          </div>
        </div>
      )}

      {/* 3. THANH CHUYỂN TẦNG NHANH & CÔNG CỤ (GÓC PHẢI DƯỚI — KHÔNG ĐÈ JOYSTICK HAY GỢI Ý) */}
      <div className="fixed bottom-44 right-3 z-40 flex items-center gap-1 rounded-full border border-white/15 bg-[#151c27]/90 p-1 shadow-xl backdrop-blur-md md:bottom-16 md:right-4 md:gap-1.5 md:px-2 md:py-1.5">
        {LIBRARY_TOUR_FLOORS.map((fl) => {
          const active = currentFloor === fl.floor;
          return (
            <button
              key={fl.floor}
              type="button"
              onClick={() => teleportToSpot(fl.landing)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition md:px-3 md:text-xs ${
                active
                  ? 'bg-[#A88753] text-white shadow'
                  : 'text-slate-200 hover:bg-white/10'
              }`}
            >
              <span className="md:hidden">{`T${fl.floor}`}</span>
              <span className="hidden md:inline">{fl.label[lang]}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setMinimapOpen((v) => !v)}
          title={lang === 'vi' ? 'Ẩn/Hiện sơ đồ thư viện' : 'Toggle floorplan map'}
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition md:text-xs ${
            minimapOpen ? 'bg-sky-600 text-white' : 'bg-white/10 text-slate-200 hover:bg-white/20'
          }`}
        >
          🗺️
        </button>
        <button
          type="button"
          onClick={() => setServicesOpen(true)}
          title={lang === 'vi' ? 'Dịch vụ & Tiện ích' : 'Services & Facilities'}
          className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-[#f3d494] transition hover:bg-[#A88753] hover:text-white md:text-xs"
        >
          i
        </button>
      </div>

      {/* 4. MODAL DỊCH VỤ & TIỆN ÍCH (THIẾT KẾ THEO TOUR THƯ VIỆN EIU) */}
      {servicesOpen && activeService && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
          onClick={() => setServicesOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="eiu-lib-services-title"
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#A88753]/60 bg-[#151c27]/95 text-slate-100 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
              <div>
                <h2 id="eiu-lib-services-title" className="text-base font-extrabold tracking-wide text-[#d4af6a] md:text-lg">
                  {lang === 'vi' ? 'DỊCH VỤ & TIỆN ÍCH THƯ VIỆN EIU' : 'EIU LIBRARY SERVICES & FACILITIES'}
                </h2>
                <p className="text-xs text-slate-400">
                  {lang === 'vi' ? 'Thông tin phục vụ bạn đọc tại Block 4' : 'Reader services at Block 4'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setServicesOpen(false)}
                className="rounded-lg bg-white/10 px-2.5 py-1 text-sm font-bold text-slate-200 hover:bg-white/20"
                aria-label={lang === 'vi' ? 'Đóng' : 'Close'}
              >
                ✕
              </button>
            </div>

            {/* 5 Tab xanh lam theo giao diện tour eiu_lib */}
            <div className="flex flex-wrap gap-2 border-b border-white/10 bg-black/25 px-5 py-3">
              {LIBRARY_SERVICES.map((tab) => {
                const isActive = tab.id === activeService.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveServiceTab(tab.id)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                      isActive
                        ? 'bg-sky-500 text-white shadow'
                        : 'bg-sky-900/60 text-sky-100 hover:bg-sky-700/70'
                    }`}
                  >
                    {tab.label[lang]}
                  </button>
                );
              })}
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              <h3 className="text-base font-bold text-white">{activeService.heading[lang]}</h3>
              <p className="text-sm leading-relaxed text-slate-200">{activeService.summary[lang]}</p>
              <ul className="space-y-2 rounded-xl border border-white/10 bg-black/25 p-3.5 text-xs leading-relaxed text-slate-200">
                {activeService.bullets.map((b, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="font-bold text-[#d4af6a]">•</span>
                    <span>{b[lang]}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-black/30 px-5 py-3">
              <span className="text-xs text-slate-400">
                Hotline: (+84) 274 222 1193 · lib@eiu.edu.vn
              </span>
              <a
                href="https://lib.eiu.edu.vn"
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-[#A88753] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#967643]"
              >
                {lang === 'vi' ? 'Mở cổng lib.eiu.edu.vn ↗' : 'Open lib.eiu.edu.vn ↗'}
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
