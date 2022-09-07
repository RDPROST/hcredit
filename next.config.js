/** @type {import('next').NextConfig} */
// const nextConfig = {
//   reactStrictMode: true
// }
//
// module.exports = nextConfig
window.process = process.env

module.exports = {
  // basePath: process.env.NEXT_PUBLIC_DIR,
  async rewrites () {
    return [
      {
        source: "/_wt/default",
        destination: process.env.NEXT_PUBLIC_HOSTNAME + "/_wt/default"
      },
      {
        source: "/view_doc.html",
        destination: process.env.NEXT_PUBLIC_HOSTNAME + "/view_doc.html"
      },
      {
        source: "/home",
        destination: process.env.NEXT_PUBLIC_HOSTNAME + "/home"
      },
      {
        source: "/openapi.html",
        destination: process.env.NEXT_PUBLIC_HOSTNAME + "/openapi.html"
      },
      {
        source: "/download_file.html",
        destination: process.env.NEXT_PUBLIC_HOSTNAME + "/download_file.html"
      },
      {
        source: "/default.html",
        destination: process.env.NEXT_PUBLIC_HOSTNAME + "/default.html"
      },
      {
        source: "/oapi/:path*",
        destination: process.env.NEXT_PUBLIC_HOSTNAME + "/oapi/:path*"
      }
    ];
  },
  images: {
    loader: 'akamai',
    path: ''
  }
};