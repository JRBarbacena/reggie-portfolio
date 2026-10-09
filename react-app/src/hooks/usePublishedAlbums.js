import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase.js";
import { loadPublishedAlbums } from "../lib/published-albums.js";

export default function usePublishedAlbums(destination, enabled = true) {
  const [albums, setAlbums] = useState([]);
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    if (!enabled) return undefined;
    if (!supabase) {
      setAlbums([]);
      setStatus("unavailable");
      return undefined;
    }

    let live = true;
    setStatus("loading");
    loadPublishedAlbums(supabase, destination)
      .then((data) => {
        if (!live) return;
        setAlbums(data);
        setStatus("ready");
      })
      .catch(() => {
        if (!live) return;
        setAlbums([]);
        setStatus("error");
      });

    return () => { live = false; };
  }, [destination, enabled]);

  return { albums, status };
}
