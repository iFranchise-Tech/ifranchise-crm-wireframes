"use client";

import { useEffect, useMemo, useState } from "react";

/** Store enquiry codes so Lead Management and Lead Assignment share favourites. */
export function useLeadFavourites(profileId: string) {
  const [favourites, setFavourites] = useState<{ profile: string; ids: string[] }>({ profile: "", ids: [] });
  const favouriteIds = useMemo(() => new Set(favourites.profile === profileId ? favourites.ids : []), [favourites, profileId]);

  useEffect(() => {
    let ids: string[] = [];
    try {
      const stored: unknown = JSON.parse(window.localStorage.getItem(`ifranchise:lead-favourites:${profileId}`) ?? "[]");
      if (Array.isArray(stored)) ids = [...new Set(stored.filter((id): id is string => typeof id === "string"))];
    } catch { /* Ignore outdated or unavailable browser preferences. */ }
    setFavourites({ profile: profileId, ids });
  }, [profileId]);

  useEffect(() => {
    if (favourites.profile !== profileId) return;
    try {
      window.localStorage.setItem(`ifranchise:lead-favourites:${profileId}`, JSON.stringify(favourites.ids));
    } catch { /* Keep favourites available in this session when storage is unavailable. */ }
  }, [favourites, profileId]);

  function toggleFavourite(id: string) {
    setFavourites(current => {
      const ids = new Set(current.profile === profileId ? current.ids : []);
      if (ids.has(id)) ids.delete(id); else ids.add(id);
      return { profile: profileId, ids: [...ids] };
    });
  }

  return { favouriteIds, toggleFavourite };
}
