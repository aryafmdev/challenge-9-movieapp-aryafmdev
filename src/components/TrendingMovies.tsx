'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/Card';
import type { TMDBMovieSummary, PaginatedResponse } from '@/types/tmdb';
import { ChevronRight } from 'lucide-react';

// fetch a page of trending movies of the week from TMDB
async function fetchTrendingMoviesPage(page: number): Promise<PaginatedResponse<TMDBMovieSummary>> {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  const res = await fetch(
    `https://api.themoviedb.org/3/trending/movie/week?api_key=${apiKey}&page=${page}`,
    { cache: 'no-store' }
  );
  if (!res.ok) {
    return { page, results: [], total_pages: page, total_results: 0 };
  }
  return (await res.json()) as PaginatedResponse<TMDBMovieSummary>;
}

export default function TrendingMovies() {
  const [movies, setMovies] = useState<TMDBMovieSummary[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    fetchTrendingMoviesPage(1).then((data) => {
      if (!mounted) return;
      setMovies(data.results ?? []);
      setTotalPages(data.total_pages ?? 1);
      setPage(1);
      setIsLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const loadMore = async (): Promise<void> => {
    if (isLoading) return;
    if (page >= totalPages) return;
    setIsLoading(true);
    const nextPage = page + 1;
    const data = await fetchTrendingMoviesPage(nextPage);
    // replace current visible items with next page results (no horizontal scroll)
    setMovies(data.results ?? []);
    setPage(nextPage);
    setTotalPages(data.total_pages ?? nextPage);
    setIsLoading(false);
  };

  return (
    <section className='py-8 px-4 sm:px-6 md:px-20 bg-black text-white'>
      <h2 className='text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4'>
        Trending Now
      </h2>

      {movies.length > 0 ? (
        <div className='relative w-full max-w-[1400px] mx-auto'>
          <div className='flex overflow-hidden gap-4 sm:gap-5 md:gap-6 pb-2'>
            {movies.map((movie) => (
              <div key={movie.id} className='flex-none'>
                <Card media={movie} />
              </div>
            ))}
          </div>
          <div className='pointer-events-none absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-black to-transparent'></div>
          {page < totalPages && (
            <button
              onClick={loadMore}
              disabled={isLoading}
              aria-label='Next trending'
              className={`absolute right-3 top-1/2 -translate-y-1/2 size-10 sm:size-12 rounded-full bg-[#0F1117]/80 text-white border border-white/10 shadow-lg hover:bg-[#141822] transition-colors z-10 ${
                isLoading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <ChevronRight className='size-10 items-center justify-center' />
            </button>
          )}
        </div>
      ) : (
        <p className='text-gray-400'>No Trending Movies Found</p>
      )}


    </section>
  );
}
