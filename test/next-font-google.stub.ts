// next/font/google is a build-time transform (Next SWC plugin) and is not a real
// callable module under vitest. Any test that imports a component using next/font
// (e.g. WalletView -> DashboardHome -> cockpit-fonts) would otherwise throw
// "Newsreader is not a function". This stub returns the same shape the loader does.
const stubFont = () => ({ className: '', variable: '', style: { fontFamily: '' } })

export const Newsreader = stubFont
export const Instrument_Sans = stubFont
