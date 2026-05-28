import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import logo from '../logo.png';

document.querySelector<HTMLLinkElement>('#app-favicon')?.setAttribute('href', logo);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
