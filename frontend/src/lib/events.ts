import { Job } from "@/types";

export interface CoverLetterStudioOptions {
  job?: Job | null;
  url?: string;
  tab?: "link" | "job";
}

export function openCoverLetterStudio(options?: CoverLetterStudioOptions) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("open-cover-letter-studio", { detail: options })
    );
  }
}
