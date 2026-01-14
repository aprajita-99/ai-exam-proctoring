import React from "react";

/* =========================
   Button Component
========================= */

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  ...props
}) => {
  const variants = {
    primary:
      "bg-slate-100 text-slate-950 hover:bg-white disabled:bg-slate-700 disabled:text-slate-500 shadow-lg shadow-white/5",
    secondary:
      "bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 disabled:opacity-50 shadow-sm",
    danger:
      "bg-red-600 text-white hover:bg-red-500 shadow-md shadow-red-900/20",
    ghost:
      "bg-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg font-semibold",
  };

  return (
    <button
      className={`rounded-lg transition-all duration-200 flex items-center justify-center gap-2 
        ${variants[variant]} 
        ${sizes[size]} 
        ${fullWidth ? "w-full" : ""} 
        ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

/* =========================
   Card Component
========================= */

export const Card = ({ children, className = "", ...props }) => {
  return (
    <div
      {...props}
      className={`rounded-lg border border-slate-800 bg-slate-900 ${className}`}
    >
      {children}
    </div>
  );
};


/* =========================
   Badge Component
========================= */

export const Badge = ({ risk }) => {
  const styles = {
    low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    high: "bg-red-500/10 text-red-400 border-red-500/20",
    active: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    completed: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  };

  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
        styles[risk] || styles.active
      }`}
    >
      {risk}
    </span>
  );
};

/* =========================
   Input Component
========================= */

export const Input = ({ label, className = "", type, ...props }) => {
  const isDateTime = type === "datetime-local";

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-400">
          {label}
        </label>
      )}
      <input
        type={type}
        className={`
          w-full px-4 py-2.5 rounded-lg border outline-none transition-all
          focus:ring-2 focus:border-transparent
          
          ${
            isDateTime
              ? "bg-white text-black border-slate-300 focus:ring-blue-500 datetime-light"
              : "bg-slate-950 border-slate-800 text-slate-200 focus:ring-slate-400 placeholder:text-slate-700"
          }

          ${className}
        `}
        {...props}
      />
    </div>
  );
};


/* =========================
   Textarea Component
========================= */

export const Textarea = ({ label, className = "", ...props }) => (
  <div className="space-y-1.5">
    {label && (
      <label className="block text-sm font-medium text-slate-400">
        {label}
      </label>
    )}
    <textarea
      className={`w-full px-4 py-3 bg-slate-950 border border-slate-800 text-slate-200 rounded-lg 
        focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none transition-all 
        placeholder:text-slate-700 resize-y min-h-[120px] ${className}`}
      {...props}
    />
  </div>
);

