import { defineConfig } from "vite";
import prefresh from '@prefresh/vite';

export default defineConfig({
  server: {
    hmr: process.env.GITPOD_WORKSPACE_URL
      ? {
        // Due to port fowarding, we have to replace
        // 'https' with the forwarded port, as this
        // is the URI created by Gitpod.
        host: process.env.GITPOD_WORKSPACE_URL.replace("https://", "3000-"),
        protocol: "wss",
        clientPort: 443
      }
      : true
  },
  plugins: [prefresh()],
  resolve: {
    alias: {
      react: 'preact/compat',
      'react-dom': 'preact/compat'
    },
  }
});
