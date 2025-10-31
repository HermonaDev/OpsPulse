import React from "react";

export default function MapPanel({ src }) {
  return (
    <div className="bg-bg-secondary/90 rounded-2xl border border-bg-primary/60 p-4">
      <div className="w-full h-72 rounded-xl overflow-hidden border border-accent/30">
        <iframe
          src={src}
          style={{ width: "100%", height: "100%", border: "none" }}
          title="Live Map"
        />
      </div>
    </div>
  );
}


