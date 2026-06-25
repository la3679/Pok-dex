const escapeCsv = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;

export function stringifyExport(data) {
  return JSON.stringify(data, null, 2);
}

export function comparisonCsv(comparison = []) {
  const metrics = [
    ['Name', 'name'], ['Types', 'types'], ['HP', 'stats.hp'], ['Attack', 'stats.attack'], ['Defense', 'stats.defense'], ['Sp. Attack', 'stats.special_attack'], ['Sp. Defense', 'stats.special_defense'], ['Speed', 'stats.speed'], ['Height (m)', 'height'], ['Weight (kg)', 'weight'], ['Capture rate', 'capture_rate'],
  ];
  if (comparison.length < 2) return '';
  const header = ['Metric', ...comparison.map((entry) => entry.name)];
  const rows = metrics.map(([label, key]) => [label, ...comparison.map((entry) => key.split('.').reduce((value, part) => value?.[part], entry) ?? '')]);
  return [header, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');
}

export function downloadText(filename, text, mimeType) {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
