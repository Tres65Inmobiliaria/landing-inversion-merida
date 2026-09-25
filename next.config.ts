import type { NextConfig } from "next";

/**
 * Sitio 100% estático (`next build` genera la carpeta `out/`), compatible con
 * GitHub Pages. Si se publica en https://<usuario>.github.io/<repo>/, definir
 * NEXT_PUBLIC_BASE_PATH=/<repo> al construir. Con dominio propio, dejarlo vacío.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: basePath || undefined,
  images: { unoptimized: true },
};

export default nextConfig;
