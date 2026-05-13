import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        clientes: resolve(__dirname, 'src/clientes.html'),
        negocios: resolve(__dirname, 'src/negocios.html'),
        repartidores: resolve(__dirname, 'src/repartidores.html'),
      }
    }
  }
})
