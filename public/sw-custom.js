// Custom service worker additions for share target handling

// Handle POST requests for share target (shared files from Android)
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Handle share target POST requests
    if (url.pathname === '/share-target' && event.request.method === 'POST') {
        event.respondWith(handleShareTarget(event.request));
    }
});

async function handleShareTarget(request) {
    const formData = await request.formData();

    // Get shared files
    const files = formData.getAll('video');

    // Store the file in a temporary cache for the client to pick up
    if (files.length > 0 && files[0] instanceof File) {
        const cache = await caches.open('shared-files');

        // Create a response from the file
        const file = files[0];
        const fileResponse = new Response(file, {
            headers: {
                'Content-Type': file.type,
                'X-File-Name': encodeURIComponent(file.name)
            }
        });

        await cache.put('/shared-video', fileResponse);

        // Redirect to home with a flag
        return Response.redirect('/?file=shared', 303);
    }

    // Handle URL shares (text/url params)
    const title = formData.get('title') || '';
    const text = formData.get('text') || '';
    const url = formData.get('url') || '';

    const sharedUrl = url || text;
    const redirectUrl = `/?title=${encodeURIComponent(title)}&text=${encodeURIComponent(sharedUrl)}`;

    return Response.redirect(redirectUrl, 303);
}
