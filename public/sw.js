// Service worker Ngebola: hanya menampilkan Web Push dan membuka tautan saat diketuk.
self.addEventListener("push", (event) => {
  let data = { title: "Ngebola", url: "/" };
  try {
    data = { ...data, ...event.data.json() };
  } catch {}
  event.waitUntil(
    self.registration.showNotification(data.title, { body: "Ketuk untuk membuka Ngebola.", icon: "/icon-192.png", badge: "/icon-192.png", tag: data.tag, data: { url: data.url } }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const ada = list.find((c) => c.url.startsWith(self.location.origin));
      if (ada) return ada.navigate(url).then((c) => c && c.focus());
      return self.clients.openWindow(url);
    }),
  );
});
