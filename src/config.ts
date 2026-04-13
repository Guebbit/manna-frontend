export function getMannaBaseUrl(): string {
    return (
        localStorage.getItem('manna-base-url') ??
        import.meta.env.VITE_MANNA_URL ??
        'http://localhost:3001'
    );
}

export function setMannaBaseUrl(url: string): void {
    localStorage.setItem('manna-base-url', url);
}
