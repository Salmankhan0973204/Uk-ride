import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /**
   * Retired addresses. Old bookmarks and emailed links still land somewhere
   * useful: sign-up moved to /signup and email links were replaced by codes
   * (step 1.13); the account pages became /profile (step 2.8); the vehicles
   * page became the fleet section of the home page (step 3.9).
   */
  async redirects() {
    return [
      { source: '/register', destination: '/signup', permanent: true },
      { source: '/reset-password', destination: '/forgot-password', permanent: true },
      { source: '/verify-email', destination: '/profile', permanent: true },
      { source: '/account', destination: '/profile', permanent: true },
      { source: '/account/edit', destination: '/profile', permanent: true },
      { source: '/account/password', destination: '/profile/password', permanent: true },
      { source: '/vehicles', destination: '/#fleet', permanent: true },
    ];
  },
};

export default nextConfig;
