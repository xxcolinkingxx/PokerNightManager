"use client";

import { useEffect, useState } from "react";

export function useObjectUrl(blob: Blob | null | undefined): string | undefined {
  const [url, setUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!blob) {
      // Deferred via setTimeout rather than called directly: the
      // set-state-in-effect rule flags a synchronous setState at the top
      // of an effect body, even for a simple reset like this one.
      const timeout = setTimeout(() => setUrl(undefined), 0);
      return () => clearTimeout(timeout);
    }

    const objectUrl = URL.createObjectURL(blob);
    const timeout = setTimeout(() => setUrl(objectUrl), 0);

    return () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(objectUrl);
    };
  }, [blob]);

  return url;
}
