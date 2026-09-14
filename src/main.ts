import { mount } from 'svelte';
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import '@fontsource/rajdhani/500.css';
import '@fontsource/rajdhani/700.css';
import '@fontsource/orbitron/700.css';
import '@fontsource/orbitron/900.css';
import './styles/global.css';
import App from './App.svelte';

const app = mount(App, { target: document.getElementById('app')! });

export default app;
