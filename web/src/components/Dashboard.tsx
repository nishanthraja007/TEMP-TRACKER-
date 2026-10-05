import React, { useState, useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { Play, Pause, Search, ArrowUpDown, X, Filter, Flame, CloudRain, Wind } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { EventTrack, AnomalyMapResponse } from '../types';

interface DashboardProps {
  tracks: EventTrack[];
}

export default function Dashboard({ tracks }: DashboardProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  // States
  const [selectedTrack, setSelectedTrack] = useState<EventTrack | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'heatwave' | 'rainfall' | 'cyclone'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'start_date' | 'peak_intensity' | 'max_area_km2' | 'mean_velocity_km_day'>('start_date');
  const [sortAsc, setSortAsc] = useState(false);
  
  // Timeline playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [timelineIndex, setTimelineIndex] = useState(0);
  const [anomalyData, setAnomalyData] = useState<AnomalyMapResponse | null>(null);

  const dates = [
    '2022-01-31', '2022-02-01', '2022-02-02', '2022-02-03', '2022-02-04',
    '2022-05-02', '2022-05-03', '2022-05-04', '2022-05-05',
    '2022-06-06', '2022-06-07', '2022-06-08', '2022-06-09', '2022-06-10',
    '2022-07-15', '2022-07-16', '2022-07-17', '2022-07-18', '2022-07-19',
    '2022-11-08', '2022-11-09', '2022-11-10', '2022-11-11', '2022-11-12',
    '2023-04-27', '2023-04-28', '2023-04-29', '2023-04-30', '2023-05-01',
    '2023-07-15', '2023-07-16', '2023-07-17', '2023-07-18', '2023-07-19', '2023-07-20',
  ];

  const currentDate = dates[timelineIndex] || '2022-05-02';

  // Load live anomaly data for currentDate
  useEffect(() => {
    fetch(`/api/anomalies?date=${currentDate}&type=${filterType}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setAnomalyData(data);
      })
      .catch((err) => console.log('Live anomaly fetch fallback', err));
  }, [currentDate, filterType]);

  // Map Initialization
  useEffect(() => {
    if (!mapContainer.current) return;

    const darkStyle: maplibregl.StyleSpecification = {
      version: 8,
      sources: {
        'osm-tiles': {
          type: 'raster',
          tiles: [
            'https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
          ],
          tileSize: 256,
          attribution: '&copy; OpenStreetMap contributors, &copy; CARTO',
        },
      },
      layers: [
        {
          id: 'osm-layer',
          type: 'raster',
          source: 'osm-tiles',
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    };

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: darkStyle,
      center: [78.9629, 22.5937], // Centered over India / South Asia
      zoom: 4.2,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
    mapRef.current = map;

    map.on('load', () => {
      // Add Tracks GeoJSON Source
      map.addSource('tracks-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: tracks.map((t) => ({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: t.path,
            },
            properties: {
              id: t.id,
              type: t.type,
              peak: t.peak_intensity,
            },
          })),
        },
      });

      // Track Lines Layer
      map.addLayer({
        id: 'tracks-line',
        type: 'line',
        source: 'tracks-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': [
            'match',
            ['get', 'type'],
            'heatwave', '#ff5a36',
            'rainfall', '#3b82f6',
            'cyclone', '#a78bfa',
            '#22d3ee',
          ],
          'line-width': 3,
          'line-opacity': 0.85,
        },
      });

      // Anomaly Heatmap / Polygon Layer
      map.addSource('anomalies-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id: 'anomalies-fill',
        type: 'fill',
        source: 'anomalies-source',
        paint: {
          'fill-color': [
            'match',
            ['get', 'event_type'],
            'heatwave', '#ff5a36',
            'rainfall', '#3b82f6',
            '#22d3ee',
          ],
          'fill-opacity': 0.45,
        },
      });
    });

    return () => {
      map.remove();
    };
  }, [tracks]);

  // Update Anomaly Layer on Data Change
  useEffect(() => {
    if (!mapRef.current) return;
    const src = mapRef.current.getSource('anomalies-source') as maplibregl.GeoJSONSource;
    if (src && anomalyData && anomalyData.geojson) {
      src.setData(anomalyData.geojson);
    }
  }, [anomalyData]);

  // Playback timer
  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setTimelineIndex((prev) => (prev + 1) % dates.length);
      }, 1200);
    }
    return () => clearInterval(timer);
  }, [isPlaying, dates.length]);

  // Filter and sort tracks
  const filteredTracks = tracks
    .filter((t) => (filterType === 'all' ? true : t.type === filterType))
    .filter((t) => t.id.toLowerCase().includes(searchQuery.toLowerCase()) || t.type.includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const vA = a[sortField];
      const vB = b[sortField];
      if (typeof vA === 'string') {
        return sortAsc ? vA.localeCompare(vB as string) : (vB as string).localeCompare(vA);
      }
      return sortAsc ? (vA as number) - (vB as number) : (vB as number) - (vA as number);
    });

  return (
    <div id="dashboard" className="w-full bg-[#050505] text-[#f5f5f7] py-10 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="label text-accent mb-1">INTERACTIVE SPATIO-TEMPORAL DASHBOARD</div>
          <h2 className="text-3xl font-display font-bold">Event Tracking & Anomaly Overlays</h2>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 p-1 rounded-full border border-white/10 bg-surface">
          {(['all', 'heatwave', 'rainfall', 'cyclone'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${
                filterType === t
                  ? 'bg-accent text-black font-semibold shadow-[0_0_12px_rgba(34,211,238,0.4)]'
                  : 'text-[#8a8a93] hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Main Map Box & Timeline */}
      <div className="card border-white/10 overflow-hidden relative mb-8">
        <div ref={mapContainer} className="w-full h-[520px] bg-black" />

        {/* Timeline Floating Control Bar */}
        <div className="absolute bottom-4 left-4 right-4 card p-4 border-white/10 bg-black/80 backdrop-blur-xl flex flex-col md:flex-row items-center gap-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-3 rounded-full bg-accent text-black hover:bg-cyan-300 transition-all shadow-[0_0_15px_rgba(34,211,238,0.4)] flex-shrink-0"
            title={isPlaying ? 'Pause Timeline' : 'Play Timeline'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          <div className="flex-1 w-full flex flex-col gap-1">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-accent font-semibold">{currentDate}</span>
              <span className="text-[#8a8a93]">{timelineIndex + 1} / {dates.length} TIMESTEPS</span>
            </div>
            <input
              type="range"
              min={0}
              max={dates.length - 1}
              value={timelineIndex}
              onChange={(e) => setTimelineIndex(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-white/20 rounded-lg appearance-none"
            />
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-[#8a8a93] border-l border-white/10 pl-4 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5a36]" />
              <span>Heat</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />
              <span>Rain</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#a78bfa]" />
              <span>Cyclone</span>
            </div>
          </div>
        </div>
      </div>

      {/* Events Table Section */}
      <div className="card p-6 border-white/10 bg-surface/80">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-display font-semibold">Identified Extreme Weather Tracks</h3>
            <span className="px-2 py-0.5 text-xs font-mono rounded bg-white/5 text-[#8a8a93]">
              {filteredTracks.length} events
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8a93]" />
            <input
              type="text"
              placeholder="Search by ID or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl bg-surface2 border border-white/10 focus:border-cyan-400 focus:outline-none text-[#f5f5f7] font-mono"
            />
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 text-[#8a8a93] uppercase">
                <th className="py-3 px-4">Track ID</th>
                <th className="py-3 px-4">Type</th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-white"
                  onClick={() => {
                    setSortField('start_date');
                    setSortAsc(!sortAsc);
                  }}
                >
                  <div className="flex items-center gap-1">
                    Dates <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Duration</th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-white"
                  onClick={() => {
                    setSortField('peak_intensity');
                    setSortAsc(!sortAsc);
                  }}
                >
                  <div className="flex items-center gap-1">
                    Peak Anomaly <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-white"
                  onClick={() => {
                    setSortField('max_area_km2');
                    setSortAsc(!sortAsc);
                  }}
                >
                  <div className="flex items-center gap-1">
                    Max Area <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-white"
                  onClick={() => {
                    setSortField('mean_velocity_km_day');
                    setSortAsc(!sortAsc);
                  }}
                >
                  <div className="flex items-center gap-1">
                    Velocity <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredTracks.map((trk) => {
                const isSelected = selectedTrack?.id === trk.id;
                return (
                  <tr
                    key={trk.id}
                    onClick={() => setSelectedTrack(trk)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-cyan-500/10' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-bold text-accent">{trk.id}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] capitalize font-medium ${
                          trk.type === 'heatwave'
                            ? 'bg-[#ff5a36]/10 text-[#ff5a36] border border-[#ff5a36]/20'
                            : trk.type === 'rainfall'
                            ? 'bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20'
                            : 'bg-[#a78bfa]/10 text-[#a78bfa] border border-[#a78bfa]/20'
                        }`}
                      >
                        {trk.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#8a8a93]">
                      {trk.start_date} → {trk.end_date}
                    </td>
                    <td className="py-3.5 px-4">{trk.duration_days} days</td>
                    <td className="py-3.5 px-4 text-emerald-400 font-semibold">
                      +{trk.peak_intensity} {trk.type === 'heatwave' ? 'K' : 'mm/d'}
                    </td>
                    <td className="py-3.5 px-4 text-[#8a8a93]">
                      {Math.round(trk.max_area_km2).toLocaleString()} km²
                    </td>
                    <td className="py-3.5 px-4">{trk.mean_velocity_km_day} km/d</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTrack(trk);
                        }}
                        className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-xs text-[#f5f5f7] transition-all"
                      >
                        Details →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Event Detail Drawer Modal */}
      {selectedTrack && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm p-4 sm:p-6 animate-fadeIn">
          <div className="card max-w-xl w-full h-[90vh] bg-surface2 border-white/20 p-6 flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-accent uppercase">
                  EVENT PROFILE INSPECTOR
                </span>
                <h3 className="text-2xl font-display font-bold text-white">{selectedTrack.id}</h3>
              </div>
              <button
                onClick={() => setSelectedTrack(null)}
                className="p-2 rounded-full hover:bg-white/10 text-[#8a8a93] hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="card p-3 border-white/5 bg-black/50 text-center">
                <div className="label text-[#8a8a93] text-[9px]">Peak Anomaly</div>
                <div className="num text-base font-bold text-emerald-400">
                  +{selectedTrack.peak_intensity}
                </div>
              </div>
              <div className="card p-3 border-white/5 bg-black/50 text-center">
                <div className="label text-[#8a8a93] text-[9px]">Duration</div>
                <div className="num text-base font-bold text-accent">
                  {selectedTrack.duration_days} days
                </div>
              </div>
              <div className="card p-3 border-white/5 bg-black/50 text-center">
                <div className="label text-[#8a8a93] text-[9px]">Max Area</div>
                <div className="num text-base font-bold text-purple-300">
                  {Math.round(selectedTrack.max_area_km2 / 1000)}k km²
                </div>
              </div>
            </div>

            {/* Intensity & Area Evolution Charts */}
            <div className="mb-6">
              <div className="label text-accent mb-2">SPATIO-TEMPORAL INTENSITY EVOLUTION</div>
              <div className="card p-3 border-white/10 bg-black/40 h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={selectedTrack.history}>
                    <defs>
                      <linearGradient id="intensityGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#8a8a93" fontSize={9} tickLine={false} />
                    <YAxis stroke="#8a8a93" fontSize={9} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#0b0b0d', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="intensity_anomaly"
                      stroke="#22d3ee"
                      fillOpacity={1}
                      fill="url(#intensityGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Propagation Velocity Evolution Chart */}
            <div className="mb-6">
              <div className="label text-accent mb-2">PROPAGATION VELOCITY (KM/DAY)</div>
              <div className="card p-3 border-white/10 bg-black/40 h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedTrack.history}>
                    <XAxis dataKey="date" stroke="#8a8a93" fontSize={9} tickLine={false} />
                    <YAxis stroke="#8a8a93" fontSize={9} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#0b0b0d', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="velocity_km_day"
                      stroke="#ff5a36"
                      strokeWidth={2}
                      dot={{ fill: '#ff5a36', r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Centroid Path Waypoints */}
            <div className="mt-auto pt-4 border-t border-white/10">
              <div className="label text-[#8a8a93] mb-2">KALMAN-SMOOTHED CENTROIDS</div>
              <div className="flex flex-wrap gap-2">
                {selectedTrack.path.map(([lon, lat], i) => (
                  <span key={i} className="px-2 py-1 rounded bg-black/60 border border-white/5 text-[10px] font-mono text-cyan-200">
                    Day {i + 1}: {lat.toFixed(2)}°N, {lon.toFixed(2)}°E
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
