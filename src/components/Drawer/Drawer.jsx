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
  const roundness = isLeft ? "rounded-r-[28px]" : "rounded-l-[28px]";

  return (
    <div className={`fixed inset-0 ${zClass} ${mobileOnly ? "lg:hidden" : ""}`}>
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-[3px] transition-opacity duration-300 ${
          show ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <div
        className={`absolute top-0 ${sidePos} h-full ${widthClass} border-gray-100 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          show ? "translate-x-0" : closedPos
        } ${roundness} ${panelClassName} overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50 shrink-0">
            <h2 className="font-bold text-gray-900 text-base">{title}</h2>
            <button 
              onClick={onClose} 
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all text-2xl leading-none"
            >
              ×
            </button>
          </div>
        )}
        <div className={`flex-1 overflow-y-auto ${bodyClassName}`}>{children}</div>
        {footer && <div className="shrink-0">{footer}</div>}
      </div>
    </div>
  );
}
