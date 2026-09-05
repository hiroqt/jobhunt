// Service worker placeholder to prevent 404/500 dev console spam
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", () => self.clients.claim());
