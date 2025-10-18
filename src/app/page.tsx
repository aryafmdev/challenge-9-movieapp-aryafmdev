import HeroSection from '@/components/HeroSection';
import TrendingMovies from '@/components/TrendingMovies';
import NewRelease from '@/components/NewRelease';

export default function Home() {
  return (
    <div className='bg-black min-h-screen text-white'>
      <HeroSection />
      <TrendingMovies />
      <NewRelease />
    </div>
  );
}
