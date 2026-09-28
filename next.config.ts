import type { NextConfig } from "next";

const securityHeaders = [
  // Cegah clickjacking — halaman tidak bisa di-embed di iframe orang lain
  { key: "X-Frame-Options", value: "DENY" },
  // Cegah browser menebak tipe konten (MIME sniffing)
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Paksa HTTPS selama 2 tahun (hanya aktif di production HTTPS)
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Kontrol info referer yang dikirim ke pihak ketiga
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Nonaktifkan fitur browser sensitif yang tidak dipakai
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Terapkan ke semua route
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
