// src/components/theme-generator/theme-preview.tsx
import type { ThemeColors } from "@/lib/theme";

interface Props {
  colors: ThemeColors;
}

export default function ThemePreview({ colors }: Props) {
  const style = Object.fromEntries(
    Object.entries(colors).map(([key, value]) => [`--color-${key}`, value]),
  ) as React.CSSProperties;

  return (
    <div
      className="h-full overflow-auto rounded-box bg-base-100 p-4"
      style={style}
    >
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-base-content">Sample Blog Post</h2>
          <p className="text-sm text-base-content/60">
            By Author Name • January 25, 2026
          </p>
          <p className="text-base-content">
            This is a preview of how your theme will look. The colors you select
            will be applied to various UI elements throughout the site.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary btn-sm">
              Primary
            </button>
            <button type="button" className="btn btn-secondary btn-sm">
              Secondary
            </button>
            <button type="button" className="btn btn-accent btn-sm">
              Accent
            </button>
            <button type="button" className="btn btn-neutral btn-sm">
              Neutral
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="badge badge-info">Info</span>
            <span className="badge badge-success">Success</span>
            <span className="badge badge-warning">Warning</span>
            <span className="badge badge-error">Error</span>
          </div>

          <div className="mt-4 space-y-2">
            <div className="rounded bg-base-100 p-2 text-sm">Base 100</div>
            <div className="rounded bg-base-200 p-2 text-sm">Base 200</div>
            <div className="rounded bg-base-300 p-2 text-sm">Base 300</div>
          </div>

          <div className="card-actions mt-4 justify-end">
            <button type="button" className="btn btn-primary">
              Read More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
