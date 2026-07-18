"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ESSENTIAL_STORAGE_NOTICE_TEXT } from "@/data/privacy-policy";

export const ESSENTIAL_STORAGE_NOTICE_SESSION_KEY =
  "sibau-degree-advisor:essential-storage-notice:v1";

export function EssentialStorageNotice() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsVisible(
        window.sessionStorage.getItem(ESSENTIAL_STORAGE_NOTICE_SESSION_KEY) !==
          "dismissed",
      );
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  if (!isVisible) return null;

  function dismiss() {
    try {
      window.sessionStorage.setItem(
        ESSENTIAL_STORAGE_NOTICE_SESSION_KEY,
        "dismissed",
      );
    } finally {
      setIsVisible(false);
    }
  }

  return (
    <aside className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-4xl rounded-2xl border border-slate-300 bg-white p-4 shadow-2xl sm:p-5" aria-label="Essential browser storage notice">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-slate-700">
          {ESSENTIAL_STORAGE_NOTICE_TEXT}{" "}
          <Link href="/privacy" className="font-bold text-teal-700 underline decoration-2 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2">
            Read the privacy notice
          </Link>
          .
        </p>
        <button type="button" onClick={dismiss} className="secondary-button shrink-0">
          Dismiss
        </button>
      </div>
    </aside>
  );
}
