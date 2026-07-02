/** SVG flags — emoji flags often fail to render on Windows. */
export default function LocaleFlag({ locale, className = 'h-5 w-7 rounded-[3px] shadow-sm' }) {
  if (locale === 'es') {
    return (
      <svg viewBox="0 0 21 15" className={className} aria-hidden>
        <rect width="21" height="15" fill="#AA151B" />
        <rect y="3.75" width="21" height="7.5" fill="#F1BF00" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 21 15" className={className} aria-hidden>
      <rect width="21" height="15" fill="#B22234" />
      <rect y="1.15" width="21" height="1.15" fill="#fff" />
      <rect y="3.46" width="21" height="1.15" fill="#fff" />
      <rect y="5.77" width="21" height="1.15" fill="#fff" />
      <rect y="8.08" width="21" height="1.15" fill="#fff" />
      <rect y="10.38" width="21" height="1.15" fill="#fff" />
      <rect y="12.69" width="21" height="1.15" fill="#fff" />
      <rect width="8.4" height="8.05" fill="#3C3B6E" />
      <circle cx="1.4" cy="1.2" r="0.45" fill="#fff" />
      <circle cx="2.8" cy="1.2" r="0.45" fill="#fff" />
      <circle cx="4.2" cy="1.2" r="0.45" fill="#fff" />
      <circle cx="5.6" cy="1.2" r="0.45" fill="#fff" />
      <circle cx="7" cy="1.2" r="0.45" fill="#fff" />
      <circle cx="2.1" cy="2.4" r="0.45" fill="#fff" />
      <circle cx="3.5" cy="2.4" r="0.45" fill="#fff" />
      <circle cx="4.9" cy="2.4" r="0.45" fill="#fff" />
      <circle cx="6.3" cy="2.4" r="0.45" fill="#fff" />
      <circle cx="1.4" cy="3.6" r="0.45" fill="#fff" />
      <circle cx="2.8" cy="3.6" r="0.45" fill="#fff" />
      <circle cx="4.2" cy="3.6" r="0.45" fill="#fff" />
      <circle cx="5.6" cy="3.6" r="0.45" fill="#fff" />
      <circle cx="7" cy="3.6" r="0.45" fill="#fff" />
      <circle cx="2.1" cy="4.8" r="0.45" fill="#fff" />
      <circle cx="3.5" cy="4.8" r="0.45" fill="#fff" />
      <circle cx="4.9" cy="4.8" r="0.45" fill="#fff" />
      <circle cx="6.3" cy="4.8" r="0.45" fill="#fff" />
      <circle cx="1.4" cy="6" r="0.45" fill="#fff" />
      <circle cx="2.8" cy="6" r="0.45" fill="#fff" />
      <circle cx="4.2" cy="6" r="0.45" fill="#fff" />
      <circle cx="5.6" cy="6" r="0.45" fill="#fff" />
      <circle cx="7" cy="6" r="0.45" fill="#fff" />
    </svg>
  );
}
