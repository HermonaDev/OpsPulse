import React from "react";

const colorMap = {
  success: "bg-green-500/20 text-green-300",
  warning: "bg-yellow-500/20 text-yellow-300",
  danger: "bg-red-500/20 text-red-300",
  info: "bg-accent/20 text-accent",
  neutral: "bg-bg-primary text-text-secondary",
};

export default function Badge({ tone = "neutral", children }) {
  return (
    <span className={`inline-block text-xs px-2 py-1 rounded ${colorMap[tone] || colorMap.neutral}`}>
      {children}
    </span>
  );
}


