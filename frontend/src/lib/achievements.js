const definitions = [
  { id: 'first-favorite', title: 'First Favorite', description: 'Save your first Pokémon to favorites.', icon: '♥', target: 1, value: (profile) => profile.favorites.length },
  { id: 'first-win', title: 'First Victory', description: 'Win a battle in the Battle Arena.', icon: '⚔', target: 1, value: (profile) => profile.battles.wins },
  { id: 'field-researcher', title: 'Field Researcher', description: 'View 10 different Pokémon records.', icon: '◉', target: 10, value: (profile) => profile.recentlyViewed.length },
  { id: 'team-captain', title: 'Team Captain', description: 'Save your first strategy team.', icon: '▣', target: 1, value: (profile) => profile.savedTeams.length },
  { id: 'comparison-expert', title: 'Comparison Expert', description: 'Compare 5 different Pokémon.', icon: '⇄', target: 5, value: (profile) => profile.activity?.comparedPokemonIds?.length || 0 },
  { id: 'legend-spotter', title: 'Legend Spotter', description: 'Open a legendary or mythical Pokémon record.', icon: '✦', target: 1, value: (profile) => profile.activity?.legendaryPokemonIds?.length || 0 },
  { id: 'map-scout', title: 'Map Scout', description: 'Open the sightings map.', icon: '⌖', target: 1, value: (profile) => profile.activity?.mapVisits || 0 },
];

export function achievementsFor(profile) {
  return definitions.map((achievement) => {
    const value = achievement.value(profile);
    return { ...achievement, value, unlocked: value >= achievement.target, progress: Math.min(100, Math.round((value / achievement.target) * 100)) };
  });
}

export function achievementSummary(profile) {
  const achievements = achievementsFor(profile);
  return { achievements, unlocked: achievements.filter((achievement) => achievement.unlocked).length, total: achievements.length };
}
