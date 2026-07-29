// Feather-style line icons. Every icon shares the same 24x24 stroke frame and
// follows `currentColor`, so color and size are controlled by the surrounding
// text style.

export type IconProps = Omit<React.SVGProps<SVGSVGElement>, "children"> & {
  /** Edge length in pixels. Defaults to 24 (the design grid). */
  size?: number;
};

function Icon({ size = 24, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const ImageIcon = (props: IconProps) => (
  <Icon {...props}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></Icon>
);
export const CubeIcon = (props: IconProps) => (
  <Icon {...props}><path d="M21 8l-9-5-9 5v8l9 5 9-5z" /><path d="M3 8l9 5 9-5" /><path d="M12 13v8" /></Icon>
);
export const LayersIcon = (props: IconProps) => (
  <Icon {...props}><path d="M12 2 2 7l10 5 10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></Icon>
);
export const SlidersIcon = (props: IconProps) => (
  <Icon {...props}><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" /></Icon>
);
export const WandIcon = (props: IconProps) => (
  <Icon {...props}><path d="M15 4V2M15 10V8M12.5 5.5h-2M19.5 5.5h-2M18 3l-1 1M12 6l-1 1M4 20l10-10-2-2L2 18z" /></Icon>
);
export const UploadIcon = (props: IconProps) => (
  <Icon {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></Icon>
);
export const DownloadIcon = (props: IconProps) => (
  <Icon {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></Icon>
);
export const RotateIcon = (props: IconProps) => (
  <Icon {...props}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></Icon>
);
export const SunIcon = (props: IconProps) => (
  <Icon {...props}><circle cx="12" cy="12" r="4" /><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" /></Icon>
);
export const MoonIcon = (props: IconProps) => (
  <Icon {...props}><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" /></Icon>
);
export const PlayIcon = (props: IconProps) => (
  <Icon {...props}><path d="M6 4l14 8-14 8z" fill="currentColor" stroke="none" /></Icon>
);
export const StopIcon = (props: IconProps) => (
  <Icon {...props}><rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor" stroke="none" /></Icon>
);
export const FilmIcon = (props: IconProps) => (
  <Icon {...props}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 4v16M17 4v16M3 9h4M17 9h4M3 15h4M17 15h4" /></Icon>
);
export const CheckIcon = (props: IconProps) => (
  <Icon {...props}><path d="M20 6 9 17l-5-5" /></Icon>
);
