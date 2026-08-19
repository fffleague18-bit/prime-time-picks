import React, { createContext, useContext, useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const SeasonContext = createContext();

export function SeasonProvider({ children }) {
  const [seasons, setSeasons] = useState([]);
  const [currentSeason, setCurrentSeason] = useState(() => {
    return localStorage.getItem("selectedSeason") || "";
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSeasons = async () => {
      try {
        const seasonsData = await base44.entities.Season.list();
        setSeasons(seasonsData);

        // If no season selected, use the active one
        if (!currentSeason) {
          const activeSeason = seasonsData.find((s) => s.is_active);
          if (activeSeason) {
            setCurrentSeason(activeSeason.name);
            localStorage.setItem("selectedSeason", activeSeason.name);
          } else if (seasonsData.length > 0) {
            setCurrentSeason(seasonsData[0].name);
            localStorage.setItem("selectedSeason", seasonsData[0].name);
          }
        }
      } catch (err) {
        console.error("Failed to load seasons:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadSeasons();
  }, []);

  const changeSeason = (seasonName) => {
    setCurrentSeason(seasonName);
    localStorage.setItem("selectedSeason", seasonName);
  };

  return (
    <SeasonContext.Provider
      value={{ seasons, currentSeason, changeSeason, isLoading }}
    >
      {children}
    </SeasonContext.Provider>
  );
}

export function useSeason() {
  return useContext(SeasonContext);
}