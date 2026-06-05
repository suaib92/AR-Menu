import type { Metadata } from 'next';
import LandingPage from './LandingPage';

export const metadata: Metadata = {
  title: 'Interactive 3D & AR menus for restaurants',
  description:
    'Turn any restaurant menu into an immersive 3D / AR experience customers scan from a QR code. Track views, take orders, grow revenue.',
};

export default function Page() {
  return <LandingPage />;
}
