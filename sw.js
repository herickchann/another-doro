self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const shouldStopAlarm = !event.action || event.action === 'stop-alarm';

    if (!shouldStopAlarm) {
        return;
    }

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
            clients.forEach((client) => {
                client.postMessage({ type: 'stop-alarm' });
            });
        })
    );
});
