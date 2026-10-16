import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /**
   * Addresses retired in step 1.13. Old bookmarks and emailed links still
   * land somewhere useful: sign-up moved to /signup, and email links were
   * replaced by codes.
   */
  async redirects() {
    return [
      { source: '/register', destination: '/signup', permanent: true },
      { source: '/reset-password', destination: '/forgot-password', permanent: true },
      { source: '/verify-email', destination: '/account', permanent: true },
    ];
  },
};

export default nextConfig;
