const inPlugin = [...(location.ancestorOrigins || [])].some((origin) => origin.startsWith('chrome-extension://'));
if (inPlugin && window.navigation) {
  navigation.addEventListener('navigate', (event) => {
    const url = (event.destination && event.destination.url) || '';
    if (!url.includes('linkedin.com')) return;
    event.preventDefault();
    window.postMessage({ source: 'profilereel-plugin', type: 'linkedin' }, '*');
  });
}
