export function saveSettings(name, theme) {
    localStorage.setItem('playerName', name);
    localStorage.setItem('theme', theme);
}

export function loadSettings() {
    return {
        playerName: localStorage.getItem('playerName') || '',
        theme: localStorage.getItem('theme') || 'light'
    };
}
