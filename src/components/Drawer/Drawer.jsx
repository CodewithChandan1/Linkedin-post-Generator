"use client";

import { useState, useEffect } from "react";

/**
 * Reusable sliding drawer. Handles mount/unmount, the slide + backdrop-fade
 * animation, and a header/body/footer layout. Used by the mobile sidebars,
 * the Edit Profile drawer and the Reminder Settings drawer.
 *
 * Props:
 *  - open, onClose
 *  - side: "left" | "right"            which edge it slides from
 *  - title: header text (header hidden if omitted)
 *  - footer: node rendered as a non-scrolling footer (hidden if omitted)
 *  - mobileOnly: add `lg:hidden` so it only exists below the lg breakpoint
 *  - widthClass / panelClassName / bodyClassName / zClass: style overrides
 */
export default function Drawer({
  open,
  onClose,
  side = "left",
  title,
  footer,
  children,
  mobileOnly = false,
  widthClass = "w-full max-w-md",
  panelClassName = "bg-white",
  bodyClassName = "",
  zClass = "z-40",
}) {
  const [render, setRender] = useState(false);
  const [show, setShow] = useState(false);

  // Mount on open; keep mounted during the closing transition.
  useEffect(() => {
    if (open) {
      setRender(true);
      return;
    }
    setShow(false);
    const t = setTimeout(() => setRender(false), 300);
    return () => clearTimeout(t);
  }, [open]);

  // Trigger the enter animation only after the off-screen state has painted.
  // useEffect runs post-paint, so the closed position is committed first.
  useEffect(() => {
    if (!render) return;
    const id = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(id);
  }, [render]);

  if (!render) return null;

  const isLeft = side === "left";
  const closedPos = isLeft ? "-translate-x-full" : "translate-x-full";
  const sidePos = isLeft ? "left-0 border-r" : "right-0 border-l";

  return (
    <div className={`fixed inset-0 ${zClass} ${mobileOnly ? "lg:hidden" : ""}`}>
      <div
        className={`absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 ${
          show ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <div
        className={`absolute top-0 ${sidePos} h-full ${widthClass} border-slate-200 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          show ? "translate-x-0" : closedPos
        } ${panelClassName}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white shrink-0">
            <h2 className="font-semibold text-slate-900 text-base">{title}</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
          </div>
        )}
        <div className={`flex-1 overflow-y-auto ${bodyClassName}`}>{children}</div>
        {footer && <div className="shrink-0">{footer}</div>}
      </div>
    </div>
  );
}
