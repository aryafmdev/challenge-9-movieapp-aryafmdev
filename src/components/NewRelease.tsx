'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/Card';
import type { TMDBMovieSummary, PaginatedResponse } from '@/types/tmdb';

// fetch a page of new release (now playing) movies from TMDB
async function fetchNewReleasePage(page: number): Promise<PaginatedResponse<TMDBMovieSummary>> {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/now_playing?api_key=${apiKey}&page=${page}`,
    { cache: 'no-store' }
  );
  if (!res.ok) {
    return { page, results: [], total_pages: page, total_results: 0 };
  }
  return (await res.json()) as PaginatedResponse<TMDBMovieSummary>;
}

export default function NewRelease() {
  const [movies, setMovies] = useState<TMDBMovieSummary[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // initial load
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    fetchNewReleasePage(1).then((data) => {
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
    const data = await fetchNewReleasePage(nextPage);
    setMovies((prev) => [...prev, ...(data.results ?? [])]);
    setPage(nextPage);
    setTotalPages(data.total_pages ?? nextPage);
    setIsLoading(false);
  };

  return (
    <section className='py-8 px-4 sm:px-6 md:px-20 bg-black text-white'>
      <h2 className='text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4'>
        New Release
      </h2>

      {/* grid 5 columns, stacked vertically */}
      {movies.length > 0 ? (
        <div className='flex justify-center'>
          <div
            className='inline-grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 justify-items-center gap-4 sm:gap-5 md:gap-6 max-w-[1400px] w-full'
             style={{ minWidth: 'min-content' }}
          >
            {movies.map((movie) => (
              <Card key={movie.id} media={movie} />
            ))}
          </div>
        </div>
      ) : (
        <p className='text-gray-400'>No New Release Found</p>
      )}

      {/* Load More button */}
      {page < totalPages && (
        <div className='flex justify-center mt-6'>
          <button
            onClick={loadMore}
            disabled={isLoading}
            className={`px-5 py-2 rounded-full border border-white/10 bg-[#0F1117] text-white hover:bg-[#141822] transition-colors ${
              isLoading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </section>
  );
}
