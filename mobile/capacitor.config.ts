import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'bo.org.cecasem.mesadeayuda',
  appName: 'Mesa de Ayuda CECASEM',
  webDir: 'www',
  server: {
    androidScheme: 'http',
    cleartext: true,
  },
};

export default config;

