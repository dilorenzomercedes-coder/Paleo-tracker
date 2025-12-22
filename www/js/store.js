class Store {
    constructor() {
        this.STORAGE_KEY_HALLAZGOS = 'paleo_hallazgos';
        this.STORAGE_KEY_ASTILLAS = 'paleo_astillas';
        this.STORAGE_KEY_ROUTES = 'paleo_routes';
        // Max image dimension for compression
        this.MAX_IMAGE_DIMENSION = 800;
        this.IMAGE_QUALITY = 0.6;
    }

    // --- Helpers ---
    _getData(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    }

    _saveData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                alert('⚠️ Sin espacio de almacenamiento.\n\nLas fotos ocupan mucho espacio. Intenta:\n1. Eliminar registros antiguos\n2. Hacer un backup y limpiar datos\n3. Usar fotos más pequeñas');
                console.error('QuotaExceededError: Storage is full');
            } else {
                alert('Error al guardar: ' + e.message);
                console.error('Save error:', e);
            }
            return false;
        }
    }

    _generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Compress image before storing
    async compressImage(base64String) {
        if (!base64String || !base64String.startsWith('data:image')) {
            return base64String;
        }

        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Scale down if larger than max dimension
                if (width > this.MAX_IMAGE_DIMENSION || height > this.MAX_IMAGE_DIMENSION) {
                    if (width > height) {
                        height = Math.round((height * this.MAX_IMAGE_DIMENSION) / width);
                        width = this.MAX_IMAGE_DIMENSION;
                    } else {
                        width = Math.round((width * this.MAX_IMAGE_DIMENSION) / height);
                        height = this.MAX_IMAGE_DIMENSION;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to JPEG with compression
                const compressed = canvas.toDataURL('image/jpeg', this.IMAGE_QUALITY);
                resolve(compressed);
            };
            img.onerror = () => {
                resolve(base64String); // Return original if compression fails
            };
            img.src = base64String;
        });
    }

    // --- Hallazgos ---
    getHallazgos() {
        return this._getData(this.STORAGE_KEY_HALLAZGOS);
    }

    addHallazgo(hallazgo) {
        const list = this.getHallazgos();
        hallazgo.id = this._generateId();
        hallazgo.timestamp = new Date().toISOString();
        list.push(hallazgo);
        this._saveData(this.STORAGE_KEY_HALLAZGOS, list);
        return hallazgo;
    }

    updateHallazgo(id, updatedData) {
        const list = this.getHallazgos();
        const index = list.findIndex(h => h.id === id);
        if (index !== -1) {
            list[index] = { ...list[index], ...updatedData };
            this._saveData(this.STORAGE_KEY_HALLAZGOS, list);
            return list[index];
        }
        return null;
    }

    deleteHallazgo(id) {
        const list = this.getHallazgos();
        const filtered = list.filter(h => h.id !== id);
        this._saveData(this.STORAGE_KEY_HALLAZGOS, filtered);
    }

    // --- Astillas ---
    getAstillas() {
        return this._getData(this.STORAGE_KEY_ASTILLAS);
    }

    addAstilla(astilla) {
        const list = this.getAstillas();
        astilla.id = this._generateId();
        astilla.timestamp = new Date().toISOString();
        list.push(astilla);
        this._saveData(this.STORAGE_KEY_ASTILLAS, list);
        return astilla;
    }

    updateAstilla(id, updatedData) {
        const list = this.getAstillas();
        const index = list.findIndex(a => a.id === id);
        if (index !== -1) {
            list[index] = { ...list[index], ...updatedData };
            this._saveData(this.STORAGE_KEY_ASTILLAS, list);
            return list[index];
        }
        return null;
    }

    deleteAstilla(id) {
        const list = this.getAstillas();
        const filtered = list.filter(a => a.id !== id);
        this._saveData(this.STORAGE_KEY_ASTILLAS, filtered);
    }

    // --- Routes (Caminos) ---
    getRoutes() {
        return this._getData(this.STORAGE_KEY_ROUTES);
    }

    addRoute(route) {
        const list = this.getRoutes();
        route.id = this._generateId();
        route.timestamp = new Date().toISOString();
        // Default color if not present
        if (!route.color) route.color = '#FF5722';
        list.push(route);
        this._saveData(this.STORAGE_KEY_ROUTES, list);
        return route;
    }

    updateRoute(id, updatedData) {
        const list = this.getRoutes();
        const index = list.findIndex(r => r.id === id);
        if (index !== -1) {
            list[index] = { ...list[index], ...updatedData };
            this._saveData(this.STORAGE_KEY_ROUTES, list);
            return list[index];
        }
        return null;
    }

    deleteRoute(id) {
        const list = this.getRoutes();
        const filtered = list.filter(r => r.id !== id);
        this._saveData(this.STORAGE_KEY_ROUTES, filtered);
    }

    // --- Folders ---
    getFolders() {
        const hallazgos = this.getHallazgos();
        const astillas = this.getAstillas();
        const folders = new Set();

        hallazgos.forEach(h => { if (h.folder) folders.add(h.folder); });
        astillas.forEach(a => { if (a.folder) folders.add(a.folder); });

        return Array.from(folders).sort();
    }

    // --- Export ---
    getAllDataForExport() {
        return {
            hallazgos: this.getHallazgos(),
            astillas: this.getAstillas(),
            routes: this.getRoutes()
        };
    }
    // --- Import/Export JSON ---
    importData(jsonData) {
        let addedCount = 0;
        let skippedCount = 0;

        const processItem = (item, list, saveKey) => {
            // Check if item with same ID exists
            const exists = list.some(existing => existing.id === item.id);
            if (!exists) {
                list.push(item);
                addedCount++;
                return true;
            } else {
                skippedCount++;
                return false;
            }
        };

        if (jsonData.hallazgos && Array.isArray(jsonData.hallazgos)) {
            const list = this.getHallazgos();
            let changed = false;
            jsonData.hallazgos.forEach(item => {
                if (processItem(item, list)) changed = true;
            });
            if (changed) this._saveData(this.STORAGE_KEY_HALLAZGOS, list);
        }

        if (jsonData.astillas && Array.isArray(jsonData.astillas)) {
            const list = this.getAstillas();
            let changed = false;
            jsonData.astillas.forEach(item => {
                if (processItem(item, list)) changed = true;
            });
            if (changed) this._saveData(this.STORAGE_KEY_ASTILLAS, list);
        }

        if (jsonData.routes && Array.isArray(jsonData.routes)) {
            const list = this.getRoutes();
            let changed = false;
            jsonData.routes.forEach(item => {
                if (processItem(item, list)) changed = true;
            });
            if (changed) this._saveData(this.STORAGE_KEY_ROUTES, list);
        }

        return { added: addedCount, skipped: skippedCount };
    }
}
