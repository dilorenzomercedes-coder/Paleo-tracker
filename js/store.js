class Store {
  constructor() {
    this.db = new Dexie('paleo_heritage');
    this.db.version(2).stores({
      hallazgos: 'id,folder,timestamp,updatedAt',
      astillas: 'id,folder,timestamp,updatedAt',
      routes: 'id,timestamp',
      tracks: 'id,timestamp,active'
    });

    this.hallazgos = [];
    this.astillas = [];
    this.routes = [];
    this.tracks = [];
    this._ready = this._init();
  }

  async _init() {
    // Load IndexedDB data
    const [hallazgos, astillas, routes, tracks] = await Promise.all([
      this.db.hallazgos.toArray(),
      this.db.astillas.toArray(),
      this.db.routes.toArray(),
      this.db.tracks.toArray()
    ]);

    this.hallazgos = hallazgos;
    this.astillas = astillas;
    this.routes = routes;
    this.tracks = tracks;

    // Migrate any legacy localStorage data only once (empty DB)
    if (this.hallazgos.length === 0 && localStorage.getItem('paleo_hallazgos')) {
      const legacyHallazgos = JSON.parse(localStorage.getItem('paleo_hallazgos') || '[]');
      const legacyAstillas = JSON.parse(localStorage.getItem('paleo_astillas') || '[]');
      const legacyRoutes = JSON.parse(localStorage.getItem('paleo_routes') || '[]');

      await this.db.transaction('rw', this.db.hallazgos, this.db.astillas, this.db.routes, async () => {
        await this.db.hallazgos.bulkPut(legacyHallazgos);
        await this.db.astillas.bulkPut(legacyAstillas);
        await this.db.routes.bulkPut(legacyRoutes);
      });

      this.hallazgos = legacyHallazgos;
      this.astillas = legacyAstillas;
      this.routes = legacyRoutes;
    }
  }

  async ready() {
    await this._ready;
  }

  _generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  _touch(item) {
    return { ...item, updatedAt: new Date().toISOString(), dirty: true };
  }

  // --- Hallazgos ---
  getHallazgos() {
    return this.hallazgos;
  }

  addHallazgo(hallazgo) {
    const item = this._touch({
      ...hallazgo,
      id: this._generateId(),
      timestamp: new Date().toISOString()
    });
    this.hallazgos.push(item);
    this.db.hallazgos.put(item).catch(console.error);
    return item;
  }

  updateHallazgo(id, updatedData) {
    const idx = this.hallazgos.findIndex((h) => h.id === id);
    if (idx === -1) return null;
    this.hallazgos[idx] = this._touch({ ...this.hallazgos[idx], ...updatedData });
    this.db.hallazgos.put(this.hallazgos[idx]).catch(console.error);
    return this.hallazgos[idx];
  }

  deleteHallazgo(id) {
    this.hallazgos = this.hallazgos.filter((h) => h.id !== id);
    this.db.hallazgos.delete(id).catch(console.error);
  }

  // --- Astillas ---
  getAstillas() {
    return this.astillas;
  }

  addAstilla(astilla) {
    const item = this._touch({
      ...astilla,
      id: this._generateId(),
      timestamp: new Date().toISOString()
    });
    this.astillas.push(item);
    this.db.astillas.put(item).catch(console.error);
    return item;
  }

  updateAstilla(id, updatedData) {
    const idx = this.astillas.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    this.astillas[idx] = this._touch({ ...this.astillas[idx], ...updatedData });
    this.db.astillas.put(this.astillas[idx]).catch(console.error);
    return this.astillas[idx];
  }

  deleteAstilla(id) {
    this.astillas = this.astillas.filter((a) => a.id !== id);
    this.db.astillas.delete(id).catch(console.error);
  }

  // --- Routes (Caminos) ---
  getRoutes() {
    return this.routes;
  }

  addRoute(route) {
    const item = this._touch({
      ...route,
      id: this._generateId(),
      timestamp: new Date().toISOString(),
      color: route.color || '#FF5722'
    });
    this.routes.push(item);
    this.db.routes.put(item).catch(console.error);
    return item;
  }

  updateRoute(id, updatedData) {
    const idx = this.routes.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    this.routes[idx] = this._touch({ ...this.routes[idx], ...updatedData });
    this.db.routes.put(this.routes[idx]).catch(console.error);
    return this.routes[idx];
  }

  deleteRoute(id) {
    this.routes = this.routes.filter((r) => r.id !== id);
    this.db.routes.delete(id).catch(console.error);
  }

  // --- GPS Tracks (raw points for continuo) ---
  startTrackSession(meta = {}) {
    const track = this._touch({
      id: this._generateId(),
      name: meta.name || `tracking_${new Date().toISOString()}`,
      points: [],
      startedAt: new Date().toISOString(),
      active: true
    });
    this.tracks.push(track);
    this.db.tracks.put(track).catch(console.error);
    return track;
  }

  appendTrackPoint(trackId, point) {
    const track = this.tracks.find((t) => t.id === trackId);
    if (!track || !track.active) return;
    track.points.push({ ...point, ts: point.ts || new Date().toISOString() });
    track.updatedAt = new Date().toISOString();
    this.db.tracks.put(track).catch(console.error);
  }

  finishTrackSession(trackId, extra = {}) {
    const track = this.tracks.find((t) => t.id === trackId);
    if (!track) return;
    track.active = false;
    track.finishedAt = new Date().toISOString();
    track.meta = { ...track.meta, ...extra };
    track.updatedAt = new Date().toISOString();
    this.db.tracks.put(track).catch(console.error);
    return track;
  }

  getActiveTrack() {
    return this.tracks.find((t) => t.active);
  }

  // --- Folders ---
  getFolders() {
    const folders = new Set();
    this.hallazgos.forEach((h) => { if (h.folder) folders.add(h.folder); });
    this.astillas.forEach((a) => { if (a.folder) folders.add(a.folder); });
    return Array.from(folders).sort();
  }

  // --- Export ---
  getAllDataForExport() {
    return {
      hallazgos: this.hallazgos,
      astillas: this.astillas,
      routes: this.routes,
      tracks: this.tracks
    };
  }

  // --- Import/Export JSON ---
  importData(jsonData) {
    let addedCount = 0;
    let skippedCount = 0;

    const processItem = (item, list, table) => {
      const exists = list.some((existing) => existing.id === item.id);
      if (!exists) {
        list.push(item);
        table.put(item).catch(console.error);
        addedCount++;
        return true;
      } else {
        skippedCount++;
        return false;
      }
    };

    if (jsonData.hallazgos && Array.isArray(jsonData.hallazgos)) {
      jsonData.hallazgos.forEach((item) => processItem(item, this.hallazgos, this.db.hallazgos));
    }

    if (jsonData.astillas && Array.isArray(jsonData.astillas)) {
      jsonData.astillas.forEach((item) => processItem(item, this.astillas, this.db.astillas));
    }

    if (jsonData.routes && Array.isArray(jsonData.routes)) {
      jsonData.routes.forEach((item) => processItem(item, this.routes, this.db.routes));
    }

    if (jsonData.tracks && Array.isArray(jsonData.tracks)) {
      jsonData.tracks.forEach((item) => processItem(item, this.tracks, this.db.tracks));
    }

    return { added: addedCount, skipped: skippedCount };
  }
}
