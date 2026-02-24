import React from "react";
import MarkdownRenderer from "@/components/MarkdownRenderer";

export default function LocationDetails({ location }) {
  return (
    <div className="bg-[rgba(255,250,230,0.95)] border-2 border-amber-800 rounded-xl p-5 shadow-md space-y-3">
      <MarkdownRenderer content={location.description_md} />
    </div>
  );
}