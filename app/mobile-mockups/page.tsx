import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Bot,
  CalendarClock,
  Camera,
  Check,
  ChevronRight,
  CreditCard,
  Eye,
  FileSearch,
  Fingerprint,
  Gauge,
  Gift,
  Home,
  Lock,
  MessageCircle,
  Plane,
  Plus,
  ScanLine,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  WalletCards,
  Zap,
  type LucideIcon,
} from "lucide-react";

type ScreenProps = {
  name: string;
  children: React.ReactNode;
  theme?: "dark" | "light";
};

const navItems = [
  { label: "Home", icon: Home },
  { label: "Cards", icon: CreditCard },
  { label: "CIRA", icon: Sparkles },
  { label: "Scan", icon: ScanLine },
  { label: "Rewards", icon: Star },
];

const screenShell =
  "relative h-[812px] w-[375px] overflow-hidden rounded-[38px] border border-white/10 shadow-[0_28px_80px_rgba(5,10,25,0.28)]";

function StatusBar({ dark = true }: { dark?: boolean }) {
  return (
    <div className={`flex items-center justify-between px-6 pt-4 text-[13px] font-semibold ${dark ? "text-white/85" : "text-slate-950"}`}>
      <span>9:41</span>
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-4 rounded-sm border border-current" />
        <span className="h-3 w-3 rounded-full border border-current" />
        <span className="h-2.5 w-5 rounded-sm bg-current" />
      </div>
    </div>
  );
}

function Phone({ name, children, theme = "dark" }: ScreenProps) {
  const dark = theme === "dark";
  return (
    <section>
      <div
        className={
          screenShell +
          " " +
          (dark
            ? "bg-[#070A13] text-white"
            : "bg-[#F8F4EC] text-[#101A2E]")
        }
      >
        <StatusBar dark={dark} />
        {children}
        <div className="absolute bottom-2 left-1/2 h-1 w-32 -translate-x-1/2 rounded-full bg-white/45" />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <h3 className="text-base font-semibold tracking-normal text-[#142950]">{name}</h3>
        <span className="rounded-full border border-[#142950]/10 px-3 py-1 text-xs font-medium text-[#5A6A8A]">MVP</span>
      </div>
    </section>
  );
}

function BottomNav({ active, variant = "dark" }: { active: string; variant?: "dark" | "light" }) {
  const light = variant === "light";
  return (
    <div className={`absolute bottom-0 left-0 right-0 px-4 pb-6 pt-3 backdrop-blur-xl ${light ? "border-t border-[#142950]/10 bg-[#FBF7F0]/92" : "border-t border-white/10 bg-black/55"}`}>
      <div className="grid grid-cols-5 items-end gap-1">
        {navItems.map(({ label, icon: Icon }) => {
          const selected = active === label;
          if (label === "CIRA") {
            return (
              <div key={label} className="relative -mt-8 flex flex-col items-center gap-1">
                <CiraOrb size="nav" active={selected} />
                <span className={`text-[10px] font-bold ${selected ? (light ? "text-[#142950]" : "text-white") : (light ? "text-[#5A6A8A]" : "text-white/55")}`}>CIRA</span>
              </div>
            );
          }
          return (
            <div key={label} className={`flex flex-col items-center gap-1 rounded-2xl py-1.5 ${selected ? (light ? "text-[#142950]" : "text-white") : (light ? "text-[#8A95AE]" : "text-white/35")}`}>
              <Icon size={22} strokeWidth={selected ? 2.8 : 2} />
              <span className="text-[10px] font-medium">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CiraOrb({ size = "md", active = true }: { size?: "mini" | "nav" | "md" | "hero"; active?: boolean }) {
  const shell = {
    mini: "h-11 w-11 rounded-[16px]",
    nav: "h-[62px] w-[62px] rounded-[24px]",
    md: "h-16 w-16 rounded-[22px]",
    hero: "h-24 w-24 rounded-[30px]",
  };
  const logo = {
    mini: "h-7 w-7 rounded-[10px]",
    nav: "h-10 w-10 rounded-[14px]",
    md: "h-11 w-11 rounded-[15px]",
    hero: "h-16 w-16 rounded-[20px]",
  };

  return (
    <div className={`ciq-cira-orb relative grid place-items-center ${shell[size]} ${active ? "ciq-cira-orb-active" : ""}`}>
      <span className="ciq-cira-ring ciq-cira-ring-a" />
      <span className="ciq-cira-ring ciq-cira-ring-b" />
      <img src="/creditiq_logo_512.png" alt="CIRA by CreditIQ" className={`relative z-10 object-cover shadow-[0_12px_28px_rgba(20,41,80,0.22)] ${logo[size]}`} />
      <span className="absolute right-1.5 top-1.5 z-20 h-2.5 w-2.5 rounded-full border border-white bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)]" />
      <Sparkles className="absolute -right-1 bottom-2 z-20 text-[#D89B2A]" size={size === "hero" ? 20 : 13} strokeWidth={2.6} />
    </div>
  );
}

function CiraTypingDots() {
  return (
    <div className="flex items-center gap-1">
      <span className="ciq-cira-dot" />
      <span className="ciq-cira-dot [animation-delay:0.16s]" />
      <span className="ciq-cira-dot [animation-delay:0.32s]" />
    </div>
  );
}

function Pill({ children, tone = "blue" }: { children: React.ReactNode; tone?: "blue" | "gold" | "green" | "red" | "slate" }) {
  const tones = {
    blue: "bg-[#2F5DFF]/15 text-[#83A0FF] border-[#2F5DFF]/30",
    gold: "bg-[#D89B2A]/15 text-[#F2C658] border-[#D89B2A]/35",
    green: "bg-emerald-400/15 text-emerald-300 border-emerald-300/25",
    red: "bg-rose-400/15 text-rose-300 border-rose-300/25",
    slate: "bg-white/8 text-white/70 border-white/10",
  };
  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${tones[tone]}`}>{children}</span>;
}

function DarkCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`ciq-dark-panel rounded-[22px] border border-white/10 bg-white/[0.075] p-4 text-white ${className}`}>{children}</div>;
}

function LightCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-[22px] border border-[#142950]/10 bg-white p-4 shadow-sm ${className}`}>{children}</div>;
}

function CreditCardVisual({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`ciq-dark-panel ${compact ? "h-36" : "h-48"} overflow-hidden rounded-[24px] border border-[#D89B2A]/25 bg-[linear-gradient(135deg,#1B1114_0%,#24161A_52%,#B5811E_53%,#5F4219_100%)] p-5 text-white shadow-2xl`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-lg font-bold tracking-normal">HDFC</p>
          <p className="mt-1 text-xs text-white/55">Regalia Gold</p>
        </div>
        <div className="rounded-full bg-white/90 px-2 py-1 text-xs font-bold text-[#142950]">IQ A-</div>
      </div>
      <div className="mt-10 h-8 w-11 rounded-md bg-gradient-to-br from-[#f2f2f2] to-[#8f8f8f]" />
      <p className="mt-4 text-xs text-white/55">Points value</p>
      <p className="text-2xl font-black tracking-tight">₹5.5K - ₹60.5K</p>
    </div>
  );
}

function MockHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 pt-6">
      <h2 className="text-[34px] font-black leading-none tracking-[-0.04em] text-white">{title}</h2>
      {action}
    </div>
  );
}

function AppLogo() {
  return (
    <img
      src="/creditiq_logo_512.png"
      alt="CreditIQ"
      className="h-16 w-16 rounded-[20px] object-cover shadow-[0_20px_60px_rgba(20,41,80,0.32)]"
    />
  );
}

function SplashScreen() {
  const trustItems: Array<{ label: string; Icon: LucideIcon }> = [
    { label: "No card numbers", Icon: ShieldCheck },
    { label: "No bank login", Icon: Lock },
    { label: "Unbiased math", Icon: Gauge },
  ];

  return (
    <Phone name="01 Splash / Trust" theme="light">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(216,155,42,0.18),transparent_32%),linear-gradient(180deg,#FBF7F0_0%,#EFE7D8_100%)]" />
      <div className="relative flex h-[720px] flex-col items-center justify-center px-8 text-center">
        <AppLogo />
        <h1 className="mt-8 text-5xl font-black tracking-[-0.05em] text-[#142950]">CreditIQ</h1>
        <p className="mt-4 max-w-[260px] text-base leading-6 text-[#5A6A8A]">Your credit operating system for cards, points, bills, offers, and smarter redemptions.</p>
        <div className="mt-12 grid grid-cols-3 gap-3 text-left">
          {trustItems.map(({ label, Icon }) => (
            <div key={label} className="rounded-2xl border border-[#142950]/10 bg-white p-3 shadow-sm">
              <Icon className="text-[#8C5F12]" size={20} />
              <p className="mt-2 text-[10px] font-semibold leading-4 text-[#142950]">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </Phone>
  );
}

function LoginScreen() {
  return (
    <Phone name="02 OTP Login" theme="light">
      <div className="px-6 pt-12">
        <button className="grid h-11 w-11 place-items-center rounded-full bg-[#142950]/5 text-[#142950]">
          <ChevronRight className="rotate-180" size={22} />
        </button>
        <h1 className="mt-12 text-[42px] font-black leading-[0.98] tracking-[-0.05em] text-[#101A2E]">Create your CreditIQ account</h1>
        <p className="mt-4 text-lg leading-7 text-[#5A6A8A]">Enter your mobile number to secure your credit profile.</p>
        <div className="mt-10 rounded-[24px] border border-[#142950]/15 bg-white px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8A95AE]">Mobile number</p>
          <div className="mt-2 flex items-center gap-3 text-2xl font-bold">
            <span className="text-[#5A6A8A]">+91</span>
            <span>98765 43210</span>
          </div>
        </div>
        <div className="mt-6 flex items-center gap-3 rounded-2xl bg-[#EAF7EF] p-4 text-[#1F6D3D]">
          <ShieldCheck size={22} />
          <p className="text-sm font-medium leading-5">We never ask for full card numbers, CVV, Aadhaar, or bank passwords.</p>
        </div>
      </div>
      <div className="absolute bottom-10 left-6 right-6">
        <button className="flex h-15 w-full items-center justify-center gap-2 rounded-[20px] bg-[#142950] text-lg font-bold text-white">
          Send OTP <ArrowRight size={20} />
        </button>
      </div>
    </Phone>
  );
}

function IntentScreen() {
  const options: Array<{ title: string; desc: string; Icon: LucideIcon }> = [
    { title: "Use my current cards better", desc: "Track value, dues, benefits, and missed rewards.", Icon: WalletCards },
    { title: "Find my next card", desc: "Get one unbiased recommendation from CIRA.", Icon: Search },
    { title: "Plan travel with points", desc: "Find transfer partners and award seats.", Icon: Plane },
  ];
  return (
    <Phone name="03 Intent Selection" theme="light">
      <div className="px-6 pt-12">
        <AppLogo />
        <h1 className="mt-9 text-[40px] font-black leading-[1.02] tracking-[-0.05em] text-[#101A2E]">What should CreditIQ solve first?</h1>
        <div className="mt-8 space-y-4">
          {options.map(({ title, desc, Icon }, index) => (
            <LightCard key={title} className={index === 0 ? "border-[#2F5DFF] shadow-[0_16px_40px_rgba(47,93,255,0.10)]" : ""}>
              <div className="flex items-center gap-4">
                <div className={`grid h-12 w-12 place-items-center rounded-2xl ${index === 0 ? "bg-[#2F5DFF] text-white" : "bg-[#142950]/5 text-[#142950]"}`}>
                  <Icon size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold tracking-normal text-[#101A2E]">{title}</h3>
                  <p className="mt-1 text-sm leading-5 text-[#5A6A8A]">{desc}</p>
                </div>
                {index === 0 ? <Check className="text-[#2F5DFF]" size={22} /> : <ChevronRight className="text-[#8A95AE]" size={22} />}
              </div>
            </LightCard>
          ))}
        </div>
      </div>
      <div className="absolute bottom-10 left-6 right-6">
        <button className="h-15 w-full rounded-[20px] bg-[#2F5DFF] text-lg font-bold text-white">Continue</button>
      </div>
    </Phone>
  );
}

function AddCardScreen() {
  return (
    <Phone name="04 Add First Card" theme="light">
      <div className="px-6 pt-12">
        <h1 className="text-[40px] font-black leading-[1.02] tracking-[-0.05em] text-[#101A2E]">Add your first card</h1>
        <p className="mt-3 text-base leading-6 text-[#5A6A8A]">Manual entry is enough to unlock card health, devaluation alerts, and redemption values.</p>
        <div className="mt-8 space-y-4">
          <LightCard className="border-[#D89B2A]/40 bg-[#FFFAEF]">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#D89B2A] text-white">
                <CreditCard size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold tracking-normal text-[#101A2E]">Add manually</h3>
                <p className="text-sm text-[#5A6A8A]">Bank, card type, last 4, points.</p>
              </div>
              <ArrowRight size={22} />
            </div>
          </LightCard>
          <LightCard>
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#142950]/5 text-[#142950]">
                <FileSearch size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold tracking-normal text-[#101A2E]">Upload statement</h3>
                <p className="text-sm text-[#5A6A8A]">Find fees and missed rewards.</p>
              </div>
              <ChevronRight size={22} />
            </div>
          </LightCard>
          <LightCard>
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#142950]/5 text-[#142950]">
                <MessageCircle size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold tracking-normal text-[#101A2E]">Ask CIRA to guide me</h3>
                <p className="text-sm text-[#5A6A8A]">Start with plain English.</p>
              </div>
              <ChevronRight size={22} />
            </div>
          </LightCard>
        </div>
      </div>
      <div className="ciq-dark-panel absolute bottom-10 left-6 right-6 rounded-[22px] bg-[#101A2E] p-4 text-white">
        <p className="text-sm font-semibold text-white">First result preview</p>
        <p className="mt-1 text-sm leading-5 text-white/70">Add one card and we show its best redemption value in under 30 seconds.</p>
      </div>
    </Phone>
  );
}

function HomeScreen() {
  return (
    <Phone name="05 Home Command Center" theme="light">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#FBF7F0_0%,#EFE7D8_100%)]" />
      <div className="relative px-5 pt-7">
        <div className="flex items-center justify-between">
          <CiraOrb size="mini" />
          <Pill tone="green">₹18,420 unlocked</Pill>
        </div>
        <h1 className="mt-7 text-[38px] font-black leading-[0.98] tracking-[-0.05em] text-[#142950]">Good morning, Goverdhan</h1>
        <DarkCard className="mt-6 bg-[linear-gradient(135deg,#142950,#1E3A5F)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">Today&apos;s best action</p>
              <h3 className="mt-1 text-xl font-bold tracking-normal text-white">Move 55K points to Accor</h3>
              <p className="mt-2 text-sm leading-5 text-white/60">Worth up to ₹60.5K vs ₹11K cashback.</p>
            </div>
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#F2C658] text-[#142950]"><Zap size={26} /></div>
          </div>
        </DarkCard>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <LightCard>
            <p className="text-xs text-[#5A6A8A]">Total points value</p>
            <p className="mt-2 text-2xl font-black text-[#142950]">₹60.5K</p>
          </LightCard>
          <LightCard>
            <p className="text-xs text-[#5A6A8A]">Upcoming dues</p>
            <p className="mt-2 text-2xl font-black text-[#142950]">₹0</p>
          </LightCard>
        </div>
        <div className="mt-6 flex items-center justify-between">
          <h3 className="text-xl font-bold tracking-normal text-[#142950]">Action Center</h3>
          <span className="text-sm text-[#83A0FF]">View all</span>
        </div>
        <LightCard className="mt-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-[#F2C658]" size={22} />
            <div className="flex-1">
              <p className="font-semibold text-[#142950]">HDFC SmartBuy change detected</p>
              <p className="text-xs text-[#5A6A8A]">CIRA found 4 community signals.</p>
            </div>
            <ChevronRight size={20} />
          </div>
        </LightCard>
      </div>
      <BottomNav active="Home" variant="light" />
    </Phone>
  );
}

function CardsScreen() {
  return (
    <Phone name="06 Cards Dashboard" theme="light">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#FBF7F0,#EFE7D8)]" />
      <div className="relative px-5 pt-7">
        <div className="flex items-center justify-between">
          <h2 className="text-[34px] font-black leading-none tracking-[-0.04em] text-[#142950]">Cards</h2>
          <button className="grid h-11 w-11 place-items-center rounded-full bg-[#142950] text-white"><Plus /></button>
        </div>
        <DarkCard className="mt-6 bg-[linear-gradient(180deg,#142950,#0C1328)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/52">Portfolio value</p>
              <p className="mt-1 text-4xl font-black tracking-tight">₹60.5K</p>
              <p className="text-sm text-white/52">55,000 reward points</p>
            </div>
            <div className="grid h-16 w-16 place-items-center rounded-full bg-[#D89B2A] text-[#142950]"><WalletCards size={30} /></div>
          </div>
        </DarkCard>
        <div className="mt-6">
          <CreditCardVisual compact />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <LightCard className="p-3 text-center text-[#142950]"><Gift className="mx-auto" size={22} /><p className="mt-2 text-xs text-[#142950]">294 offers</p></LightCard>
          <LightCard className="p-3 text-center text-[#142950]"><TrendingUp className="mx-auto" size={22} /><p className="mt-2 text-xs text-[#142950]">Earn more</p></LightCard>
          <LightCard className="p-3 text-center text-[#142950]"><FileSearch className="mx-auto" size={22} /><p className="mt-2 text-xs text-[#142950]">Statement</p></LightCard>
        </div>
        <LightCard className="mt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-[#142950]">Card health: A-</p>
              <p className="text-xs text-[#5A6A8A]">Strong for travel, weak for Amazon.</p>
            </div>
            <ArrowRight className="text-[#83A0FF]" />
          </div>
        </LightCard>
      </div>
      <BottomNav active="Cards" variant="light" />
    </Phone>
  );
}

function CardDetailScreen() {
  const rows = [
    ["Hotel transfer", "₹60.5K", "Best"],
    ["Brand vouchers", "₹35.8K", "Good"],
    ["Cashback", "₹11K", "Weak"],
  ];
  return (
    <Phone name="07 Card Detail">
      <div className="absolute inset-0 bg-[#070A13]" />
      <div className="relative px-5 pt-7">
        <div className="flex items-center gap-3">
          <button className="grid h-11 w-11 place-items-center rounded-full bg-white/10"><ChevronRight className="rotate-180" /></button>
          <div>
            <h1 className="text-[30px] font-black tracking-[-0.04em]">Regalia Gold</h1>
            <p className="text-sm text-white/52">55,000 points detected</p>
          </div>
        </div>
        <div className="mt-6 overflow-hidden rounded-[24px] border border-[#F2C658]/25 bg-[#F2C658]/10 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-[#F2C658]" />
            <p className="text-sm font-medium leading-5 text-[#F2C658]">Reward points expire 3 years from earning date.</p>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {rows.map(([label, value, tag]) => (
            <DarkCard key={label}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold">{label}</p>
                  <p className="mt-1 text-2xl font-black">{value}</p>
                </div>
                <Pill tone={tag === "Best" ? "green" : tag === "Weak" ? "red" : "gold"}>{tag}</Pill>
              </div>
            </DarkCard>
          ))}
        </div>
        <DarkCard className="mt-5">
          <div className="flex items-center gap-3">
            <Camera className="text-[#83A0FF]" />
            <div>
              <p className="font-semibold">Statement Truth</p>
              <p className="text-xs text-white/50">Check fees, missed points, GST, and reversals.</p>
            </div>
          </div>
        </DarkCard>
      </div>
      <BottomNav active="Cards" />
    </Phone>
  );
}

function ScanSaveScreen() {
  return (
    <Phone name="08 Scan & Save" theme="light">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#FBF7F0,#EFE7D8)]" />
      <div className="relative px-5 pt-7">
        <h2 className="text-[34px] font-black leading-none tracking-[-0.04em] text-[#142950]">Scan & Save</h2>
        <div className="mt-8 grid h-56 place-items-center rounded-[32px] border border-dashed border-[#142950]/22 bg-white">
          <div className="text-center">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-[26px] bg-[#142950] text-[#F2C658]"><ScanLine size={38} /></div>
            <p className="mt-4 text-lg font-bold text-[#142950]">Scan merchant or bill</p>
            <p className="mt-1 text-sm text-[#5A6A8A]">We pick the best card before you pay.</p>
          </div>
        </div>
        <DarkCard className="mt-6 bg-white/[0.09]">
          <p className="text-sm text-white/52">Example result</p>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <p className="text-xl font-bold">Use HDFC Regalia Gold</p>
              <p className="mt-1 text-sm text-white/52">Best for hotels via SmartBuy.</p>
            </div>
            <p className="text-2xl font-black text-emerald-300">₹820</p>
          </div>
        </DarkCard>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button className="h-14 rounded-[18px] border border-[#142950]/10 bg-white font-bold text-[#142950]">Search merchant</button>
          <button className="h-14 rounded-[18px] bg-[#142950] font-bold text-white">Enter amount</button>
        </div>
      </div>
      <BottomNav active="Scan" variant="light" />
    </Phone>
  );
}

function RewardsScreen() {
  const partners = [
    ["Accor ALL", "₹60.5K", "2:1"],
    ["ITC Hotels", "₹27.5K", "2:1"],
    ["United Airlines", "₹35.8K", "2:1"],
  ];
  return (
    <Phone name="09 Travel & Rewards" theme="light">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#FBF7F0,#EFE7D8)]" />
      <div className="relative px-5 pt-7">
        <h2 className="text-[34px] font-black leading-none tracking-[-0.04em] text-[#142950]">Rewards</h2>
        <div className="mt-6 grid grid-cols-3 gap-2">
          {["Hotels", "Flights", "Cashback"].map((tab, i) => (
            <div key={tab} className={`rounded-2xl px-3 py-3 text-center text-sm font-bold ${i === 0 ? "bg-[#142950] text-white" : "bg-white text-[#8A95AE]"}`}>{tab}</div>
          ))}
        </div>
        <DarkCard className="mt-5 bg-[linear-gradient(135deg,#142950,#111827)]">
          <p className="text-sm text-white/52">Best redemption today</p>
          <div className="mt-2 flex items-end justify-between">
            <div>
              <h3 className="text-2xl font-black tracking-tight">Accor hotel transfer</h3>
              <p className="mt-1 text-sm text-white/52">5.5x better than cashback.</p>
            </div>
            <Plane className="text-[#F2C658]" size={34} />
          </div>
        </DarkCard>
        <div className="mt-5 space-y-3">
          {partners.map(([name, value, ratio]) => (
            <DarkCard key={name}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold">{name}</p>
                  <p className="text-sm text-white/50">Transfer ratio {ratio}</p>
                </div>
                <p className="text-xl font-black">{value}</p>
              </div>
            </DarkCard>
          ))}
        </div>
      </div>
      <BottomNav active="Rewards" variant="light" />
    </Phone>
  );
}

function CiraScreen() {
  return (
    <Phone name="10 CIRA Assistant" theme="light">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_14%,rgba(216,155,42,0.22),transparent_32%),radial-gradient(circle_at_18%_36%,rgba(47,93,255,0.10),transparent_30%),linear-gradient(180deg,#FBF7F0,#EFE7D8)]" />
      <div className="relative flex h-[720px] flex-col px-5 pt-5">
        <div className="flex justify-center">
          <CiraOrb size="hero" />
        </div>
        <div className="mt-4 text-center">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8C5F12]">CIRA online</p>
          <h1 className="mt-2 text-[36px] font-black leading-[0.98] tracking-[-0.05em] text-[#142950]">Ask CIRA anything</h1>
          <p className="mx-auto mt-3 max-w-[275px] text-sm leading-5 text-[#5A6A8A]">Your AI layer for card choices, reward math, bill risk, offers, and travel redemptions.</p>
        </div>
        <div className="mt-5 space-y-2.5">
          <div className="mr-10 rounded-[22px] border border-[#142950]/10 bg-white p-3.5 shadow-sm">
            <p className="text-sm leading-6 text-[#142950]">I found a Regalia Gold change from community posts and bank updates. Want the short version?</p>
          </div>
          <div className="ml-12 rounded-[22px] bg-[#142950] p-3.5 text-white shadow-[0_16px_36px_rgba(20,41,80,0.18)]">
            <p className="text-sm leading-6 text-white">Yes. Also tell me if I should keep this card.</p>
          </div>
          <div className="mr-8 rounded-[22px] border border-[#D89B2A]/35 bg-[#FFFAEF] p-3.5 shadow-sm">
            <p className="text-sm font-bold text-[#8C5F12]">Verdict: Keep for travel, not shopping.</p>
            <p className="mt-2 text-xs leading-5 text-[#5A6A8A]">Best route: hotel transfer at Rs 60.5K vs Rs 11K cashback.</p>
            <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-[#142950]">
              <CiraTypingDots />
              <span>Checking live offers</span>
            </div>
          </div>
        </div>
        <div className="absolute bottom-12 left-5 right-5 flex items-center gap-3 rounded-[24px] border border-[#142950]/10 bg-white p-3 shadow-[0_18px_45px_rgba(20,41,80,0.14)]">
          <span className="flex-1 pl-2 text-sm text-[#8A95AE]">Ask about any card, fee, offer...</span>
          <button className="grid h-11 w-11 place-items-center rounded-2xl bg-[#142950] text-white"><ArrowRight size={20} /></button>
        </div>
      </div>
      <BottomNav active="CIRA" variant="light" />
    </Phone>
  );
}

function ActionCenterScreen() {
  const actions: Array<{ title: string; desc: string; Icon: LucideIcon; time: string }> = [
    { title: "Enable devaluation alerts", desc: "Get notified when your card gets nerfed.", Icon: Bell, time: "2 min" },
    { title: "Enter bill cycle", desc: "Avoid late fees and utilization spikes.", Icon: CalendarClock, time: "1 min" },
    { title: "Upload latest statement", desc: "Find hidden charges and missed rewards.", Icon: FileSearch, time: "3 min" },
  ];
  return (
    <Phone name="11 Action Center" theme="light">
      <div className="px-6 pt-12">
        <h1 className="text-[42px] font-black leading-none tracking-[-0.05em] text-[#101A2E]">Action Center</h1>
        <p className="mt-4 text-base leading-6 text-[#5A6A8A]">A short checklist to make CreditIQ useful without asking for every permission upfront.</p>
        <div className="mt-8 space-y-4">
          {actions.map(({ title, desc, Icon, time }) => (
            <LightCard key={title}>
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#142950] text-white"><Icon size={23} /></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-bold tracking-normal text-[#101A2E]">{title}</h3>
                    <span className="text-xs text-[#8A95AE]">{time}</span>
                  </div>
                  <p className="mt-1 text-sm leading-5 text-[#5A6A8A]">{desc}</p>
                </div>
              </div>
            </LightCard>
          ))}
        </div>
      </div>
      <div className="absolute bottom-10 left-6 right-6">
        <button className="h-15 w-full rounded-[20px] bg-[#142950] text-lg font-bold text-white">Complete next action</button>
      </div>
    </Phone>
  );
}

function PrivacyScreen() {
  const items = [
    ["What we store", "Name, phone, chosen cards, last 4 digits, points balance."],
    ["What we never need", "CVV, full card number, Aadhaar, netbanking password."],
    ["Optional access", "Email, SMS, push alerts, and biometrics are asked only in context."],
  ];
  return (
    <Phone name="12 Privacy Center">
      <div className="absolute inset-0 bg-[#070A13]" />
      <div className="relative px-5 pt-7">
        <MockHeader title="Privacy" action={<ShieldCheck className="text-emerald-300" size={34} />} />
        <DarkCard className="mt-7 bg-[linear-gradient(135deg,rgba(16,185,129,0.2),rgba(47,93,255,0.12))]">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-300 text-[#07120D]"><Fingerprint size={30} /></div>
            <div>
              <p className="text-lg font-bold">Progressive trust</p>
              <p className="mt-1 text-sm leading-5 text-white/60">CreditIQ asks for data only when a feature needs it.</p>
            </div>
          </div>
        </DarkCard>
        <div className="mt-6 space-y-3">
          {items.map(([title, desc]) => (
            <DarkCard key={title}>
              <div className="flex gap-3">
                <Eye className="mt-1 text-[#83A0FF]" size={20} />
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="mt-1 text-sm leading-5 text-white/52">{desc}</p>
                </div>
              </div>
            </DarkCard>
          ))}
        </div>
        <button className="mt-6 h-14 w-full rounded-[18px] border border-white/12 bg-white/[0.06] font-bold">Disconnect optional data</button>
      </div>
      <BottomNav active="CIRA" />
    </Phone>
  );
}

export default function MobileMockupsPage() {
  return (
    <main className="min-h-screen bg-[#F5EFE6] px-6 py-10 text-[#142950]">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            body > div[style*="position: fixed"][style*="z-index: 1000"],
            body > div[style*="position: fixed"][style*="z-index: 999"],
            body > div[style*="position:fixed"][style*="z-index:1000"],
            body > div[style*="position:fixed"][style*="z-index:999"] {
              display: none !important;
            }
            .ciq-mockups .ciq-dark-panel p {
              color: rgba(255,255,255,0.72);
            }
            .ciq-mockups .ciq-dark-panel h3,
            .ciq-mockups .ciq-dark-panel .font-black,
            .ciq-mockups .ciq-dark-panel .font-bold,
            .ciq-mockups .ciq-dark-panel .font-semibold {
              color: #fff;
            }
            .ciq-mockups .ciq-cira-orb {
              background:
                radial-gradient(circle at 35% 26%, rgba(255,255,255,0.76), transparent 19%),
                linear-gradient(145deg, rgba(216,155,42,0.28), rgba(20,41,80,0.95) 52%, rgba(8,16,31,0.98));
              box-shadow: 0 18px 42px rgba(20,41,80,0.24), inset 0 0 0 1px rgba(255,255,255,0.28);
              animation: ciq-cira-float 3.4s ease-in-out infinite;
              isolation: isolate;
            }
            .ciq-mockups .ciq-cira-orb-active {
              box-shadow: 0 22px 55px rgba(216,155,42,0.28), 0 12px 36px rgba(20,41,80,0.24), inset 0 0 0 1px rgba(255,255,255,0.35);
            }
            .ciq-mockups .ciq-cira-orb::after {
              content: "";
              position: absolute;
              inset: 0;
              border-radius: inherit;
              background: linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.34) 44%, transparent 66%);
              transform: translateX(-120%);
              animation: ciq-cira-shimmer 3.8s ease-in-out infinite;
              z-index: 2;
              pointer-events: none;
            }
            .ciq-mockups .ciq-cira-ring {
              position: absolute;
              inset: -7px;
              border-radius: inherit;
              border: 1px solid rgba(216,155,42,0.38);
              animation: ciq-cira-pulse 2.8s ease-out infinite;
              pointer-events: none;
            }
            .ciq-mockups .ciq-cira-ring-b {
              inset: -13px;
              border-color: rgba(47,93,255,0.18);
              animation-delay: 0.7s;
            }
            .ciq-mockups .ciq-cira-dot {
              height: 5px;
              width: 5px;
              border-radius: 999px;
              background: #D89B2A;
              opacity: 0.45;
              animation: ciq-cira-dots 1.2s ease-in-out infinite;
            }
            @keyframes ciq-cira-float {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-5px); }
            }
            @keyframes ciq-cira-shimmer {
              0%, 52% { transform: translateX(-125%); }
              78%, 100% { transform: translateX(125%); }
            }
            @keyframes ciq-cira-pulse {
              0% { opacity: 0.72; transform: scale(0.92); }
              70%, 100% { opacity: 0; transform: scale(1.18); }
            }
            @keyframes ciq-cira-dots {
              0%, 70%, 100% { transform: translateY(0); opacity: 0.42; }
              35% { transform: translateY(-4px); opacity: 1; }
            }
          `,
        }}
      />
      <div className="ciq-mockups mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#8C5F12]">CreditIQ App Prototype</p>
            <h1 className="mt-3 max-w-3xl text-[44px] font-black leading-[0.98] tracking-[-0.05em] md:text-[72px]">
              MVP mobile screens for the credit operating system.
            </h1>
          </div>
          <div className="max-w-sm rounded-[24px] border border-[#142950]/10 bg-white p-5 shadow-sm">
            <p className="text-sm leading-6 text-[#5A6A8A]">
              These mockups turn the app brief into a Figma-ready screen pack: lower-friction onboarding, first-class manual card entry, CIRA everywhere, and daily credit actions.
            </p>
          </div>
        </div>
        <div className="grid gap-x-8 gap-y-12 md:grid-cols-2 xl:grid-cols-3">
          <SplashScreen />
          <LoginScreen />
          <IntentScreen />
          <AddCardScreen />
          <HomeScreen />
          <CardsScreen />
          <CardDetailScreen />
          <ScanSaveScreen />
          <RewardsScreen />
          <CiraScreen />
          <ActionCenterScreen />
          <PrivacyScreen />
        </div>
      </div>
    </main>
  );
}
