export function getMangroveCycle(date = new Date()) {
  const hour = date.getHours();

  if (hour >= 5 && hour < 9) {
    return {
      phase: "Dawn Tide",
      accent: "text-emerald-300",
      description: "The habitat is waking up. Small actions set the tone for the whole day."
    };
  }

  if (hour >= 9 && hour < 17) {
    return {
      phase: "Canopy Light",
      accent: "text-cyan-300",
      description: "This is the busiest energy window. Efficient travel and device use matter most now."
    };
  }

  if (hour >= 17 && hour < 21) {
    return {
      phase: "Sunset Current",
      accent: "text-amber-300",
      description: "Evening routines shape your footprint. Batch tasks and avoid wasteful trips."
    };
  }

  return {
    phase: "Night Root",
    accent: "text-violet-300",
    description: "The system quiets down. A simpler interface helps reduce distraction and energy use."
  };
}

export function getDegrowthStage(ecoScore: number) {
  if (ecoScore >= 85) {
    return "Quiet canopy";
  }

  if (ecoScore >= 65) {
    return "Stable grove";
  }

  return "Restoration mode";
}
