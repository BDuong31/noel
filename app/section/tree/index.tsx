"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function TreeIframe() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name") || ""; 
  
  const htmlSrc = `/tree.html?name=${encodeURIComponent(name)}`;

  return (
    <div className="w-screen h-screen bg-[#050d1a] overflow-hidden">
      <iframe
        src={htmlSrc}
        className="w-full h-full border-none"
        title="Christmas Tree"
        allow="camera; microphone; fullscreen; accelerometer; gyroscope" 
      />
    </div>
  );
}

export default function TreePage() {
  return (
    <Suspense fallback={<div className="text-[#d4af37] bg-black h-screen flex items-center justify-center">Loading...</div>}>
      <TreeIframe />
    </Suspense>
  );
}