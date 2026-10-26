import type { ReactNode, SVGProps } from 'react'

// Our own line icons, drawn to match the house illustration: 24 x 24, round ends, one stroke weight.
// Same names as the icons they replace, so screens import them the same way.

type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'> & { size?: number; strokeWidth?: number }

function make(name: string, body: ReactNode) {
  const Icon = ({ size = 20, strokeWidth = 2, className, ...rest }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" className={`icon icon-${name} ${className ?? ''}`} focusable="false" {...rest}>
      {body}
    </svg>
  )
  Icon.displayName = name
  return Icon
}

const dot = (cx: number, cy: number) => <circle cx={cx} cy={cy} r="1.1" fill="currentColor" stroke="none" />

export const Check = make('check', <path d="M5 12.5l4.5 4.5L19 7.5" />)
export const X = make('x', <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />)
export const Plus = make('plus', <path d="M12 5v14M5 12h14" />)
export const ArrowLeft = make('arrow-left', <path d="M19 12H5.5M11 6l-6 6 6 6" />)
export const ArrowRight = make('arrow-right', <path d="M5 12h13.5M13 6l6 6-6 6" />)
// Opens another website.
export const ArrowUpRight = make('out', <path d="M8 16L17 7M9.5 7H17v7.5" />)
export const ExternalLink = ArrowUpRight
export const ChevronDown = make('chevron-down', <path d="M6 9.5l6 6 6-6" />)
export const ChevronRight = make('chevron-right', <path d="M9.5 6l6 6-6 6" />)
export const Phone = make('phone', <path d="M7.2 3.8l2.4.4 1.3 3.6-1.8 1.4a11 11 0 0 0 5.7 5.7l1.4-1.8 3.6 1.3.4 2.4c-.2 1.6-1.6 2.6-3.2 2.4C10.6 18.4 5.6 13.4 5 7c-.2-1.6.7-3 2.2-3.2z" />)
// A door with an arrow walking out of it.
export const LogOut = make('exit', <><path d="M13.5 4.5H6.5v15h7" /><path d="M10 12h10M16.5 8.5L20 12l-3.5 3.5" /></>)
export const MapPin = make('pin', <><path d="M12 21s6.5-5.8 6.5-11a6.5 6.5 0 0 0-13 0c0 5.2 6.5 11 6.5 11z" /><circle cx="12" cy="10" r="2.3" /></>)
export const Zap = make('bolt', <path d="M13.5 2.5L5.5 13.5h6l-1 8 8-11h-6l1-8z" />)
export const Flame = make('flame', <path d="M12 21.5c-4 0-6.5-2.8-6.5-6.3 0-3.6 3-5.6 3.5-9.2 2.2 1.3 3.5 3.3 3.6 5.3 1-1 1.5-2.4 1.5-3.8 2.6 1.9 4.4 4.8 4.4 7.7 0 3.5-2.5 6.3-6.5 6.3z" />)
export const Mail = make('mail', <><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="M4 7.5l8 6 8-6" /></>)
export const ShoppingBasket = make('basket', <><path d="M3.5 10h17l-2 9.5h-13z" /><path d="M8 10l3-5.5M16 10l-3-5.5M9.5 13.5v3M14.5 13.5v3" /></>)
export const Siren = make('siren', <><path d="M6.5 18v-5.5a5.5 5.5 0 0 1 11 0V18" /><path d="M4.5 18h15v2.5h-15zM12 2.5v2M3.5 7l1.5 1M20.5 7L19 8" /></>)
export const Printer = make('printer', <><path d="M7 9V3.5h10V9" /><rect x="3.5" y="9" width="17" height="8" rx="1.5" /><path d="M7 14.5h10v6H7z" /></>)
export const ShieldCheck = make('shield', <><path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.2-7.5 9.5-4.3-1.3-7.5-4.9-7.5-9.5V6z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></>)
export const Users = make('people', <><circle cx="9" cy="8" r="3.2" /><path d="M3 19.5c.5-3.5 3-5.5 6-5.5s5.5 2 6 5.5" /><circle cx="17" cy="9" r="2.5" /><path d="M16 14.2c2.6.2 4.5 2 5 4.8" /></>)
export const CircleHelp = make('question', <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.6 2.6 0 0 1 5 .9c0 1.7-2.5 2.2-2.5 3.6" />{dot(12, 17)}</>)
export const Info = make('info', <><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5" />{dot(12, 7.8)}</>)
export const CalendarClock = make('calendar', <><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>)
// Clock with a turned-back arrow: earlier rules.
export const History = make('history', <><path d="M4 12a8 8 0 1 0 2.4-5.7" /><path d="M4 4.5V8h3.5M12 8v4.5l3 2" /></>)
export const Landmark = make('office', <><path d="M3.5 9.5L12 4l8.5 5.5z" /><path d="M5.5 10v8M10 10v8M14 10v8M18.5 10v8M3.5 19.5h17" /></>)
export const TramFront = make('bus', <><rect x="5.5" y="3.5" width="13" height="14" rx="3" /><path d="M5.5 11h13M8 17.5l-1.5 3M16 17.5l1.5 3" />{dot(9, 14.5)}{dot(15, 14.5)}</>)
