import { mount } from 'svelte';
import App from './App.svelte';
import './app.css';
import './records.css';
import './readable.css';

mount(App, { target: document.getElementById('app') });

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Service worker gagal didaftarkan:', error);
    });
  });
}
