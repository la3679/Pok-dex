import { describe, expect, it } from 'vitest';
import { clusterSightings, heatmapBuckets } from './map';

describe('sightings clustering', () => {
  it('groups nearby valid points and ignores malformed coordinates', () => {
    const clusters = clusterSightings([
      { id: 'one', location: { coordinates: [-112.1, 33.4] } },
      { id: 'two', location: { coordinates: [-112.2, 33.5] } },
      { id: 'invalid', location: { coordinates: ['bad', null] } },
    ]);

    expect(clusters).toHaveLength(1);
    expect(clusters[0].count).toBe(2);
  });

  it('aggregates heatmap points into pixel buckets without Google HeatmapLayer', () => {
    const buckets = heatmapBuckets([
      { location: { coordinates: [-80, 30] } },
      { location: { coordinates: [-80.1, 30.1] } },
      { location: { coordinates: ['bad', 30] } },
    ], (lat, lng) => ({ x: Math.round(lng * 10), y: Math.round(lat * 10) }), 10);

    expect(buckets).toHaveLength(2);
    expect(buckets.reduce((total, bucket) => total + bucket.count, 0)).toBe(2);
  });
});
