import React from "react";

export default function Layout({ sidebar, topbar, children }) {
  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="flex">
        {sidebar}
        <div className="flex-1 min-w-0">
          {topbar}
          <main className="px-6 sm:px-8 lg:px-10 py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}


