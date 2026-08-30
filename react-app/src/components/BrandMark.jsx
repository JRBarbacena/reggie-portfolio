import { useId } from "react";

export default function BrandMark({ className = "" }) {
  const filterId = `rb-cutout-${useId().replaceAll(":", "")}`;

  return (
    <svg
      className={`brand-mark${className ? ` ${className}` : ""}`}
      viewBox="48 57 97 75"
      role="img"
      aria-label="RB"
      focusable="false"
    >
      <defs>
        <filter id={filterId} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -0.2126 -0.7152 -0.0722 0 1"
          />
          <feComponentTransfer>
            <feFuncA type="table" tableValues="0 0 0.12 0.88 1 1" />
          </feComponentTransfer>
        </filter>
      </defs>
      <image
        href="/images/brand/pwa-192.png"
        x="0"
        y="0"
        width="192"
        height="192"
        preserveAspectRatio="xMidYMid meet"
        filter={`url(#${filterId})`}
      />
    </svg>
  );
}
