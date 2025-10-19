'use client';

import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import Card from '@/components/Card';
import TrailerModal from '@/components/TrailerModal';
import { Suspense } from 'react';
import type {
  TMDBDetailedMovie,
  TMDBDetailedTv,
  TMDBCredits,
  TMDBVideosResponse,
  TMDBRecommendations,
  MediaType,
  TMDBItem,
} from '@/types/tmdb';
import {
  PlayCircle,
  Heart,
  Calendar,
  Star,
  Clock,
  Video,
  SmilePlus,
} from 'lucide-react';

// create a helper fetcher funtion for useSWR
const fetcher = <T,>(url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error('Failed To Fetch');
    return res.json() as Promise<T>;
  });

type MediaDetailsWithCredits = (TMDBDetailedMovie | TMDBDetailedTv) & {
  credits?: TMDBCredits;
};

function DetailsPageContent() {
  // get url parameters (id and media_type)
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const mediaType: MediaType =
    (searchParams.get('media_type') as MediaType) || 'movie';

  // control trailer modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // get the API key
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;

  // fetch main media details with credits
  const { data: media } = useSWR<MediaDetailsWithCredits>(
    id
      ? `https://api.themoviedb.org/3/${mediaType}/${id}?api_key=${apiKey}&language=en-US&append_to_response=credits`
      : null,
    fetcher
  );

  // fetch media trailer videos
  const { data: videos } = useSWR<TMDBVideosResponse>(
    id
      ? `https://api.themoviedb.org/3/${mediaType}/${id}/videos?api_key=${apiKey}&language=en-US`
      : null,
    fetcher
  );

  // fetch the recommendation movies
  const { data: recommendations } = useSWR<TMDBRecommendations>(
    id
      ? `https://api.themoviedb.org/3/${mediaType}/${id}/recommendations?api_key=${apiKey}&language=en-US`
      : null,
    fetcher
  );

  // derive recommendations list safely to avoid undefined checks in JSX
  const recommendationList: TMDBItem[] = recommendations?.results ?? [];
  const hasRecommendations = recommendationList.length > 0;

  // find the first youtube trailer
  const trailer = videos?.results?.find(
    (v) => v.site === 'YouTube' && v.type === 'Trailer'
  );
  const trailerUrl = trailer
    ? `https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1`
    : null;

  // modal open/close handler
  const openModal = () => trailerUrl && setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // create helper functions for displaying media info
  const isMovieDetails = (
    m: MediaDetailsWithCredits | undefined
  ): m is TMDBDetailedMovie & { credits?: TMDBCredits } => {
    return !!m && 'title' in m;
  };
  const isTvDetails = (
    m: MediaDetailsWithCredits | undefined
  ): m is TMDBDetailedTv & { credits?: TMDBCredits } => {
    return !!m && 'name' in m;
  };
  const getTitle = (): string => {
    if (isMovieDetails(media)) return media.title || 'Untitled';
    if (isTvDetails(media)) return media.name || 'Untitled';
    return 'Untitled';
  };
  const getDate = (): string => {
    if (isMovieDetails(media)) return media.release_date || 'N/A';
    if (isTvDetails(media)) return media.first_air_date || 'N/A';
    return 'N/A';
  };
  const formatDate = (dateStr: string): string => {
    if (!dateStr || dateStr === 'N/A') return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };
  const getGenres = (): string =>
    media?.genres?.map((g) => g.name).join(', ') || 'N/A';
  const getRating = (): string =>
    media?.vote_average != null ? media.vote_average.toFixed(1) : 'N/A';
  const getRunTime = (): string => {
    if (isMovieDetails(media)) {
      return media.runtime
        ? `${Math.floor(media.runtime / 60)} hr ${media.runtime % 60} min`
        : 'N/A';
    }
    if (isTvDetails(media)) {
      return media.number_of_seasons
        ? `${media.number_of_seasons} Season(s)`
        : 'N/A';
    }
    return 'N/A';
  };
  const getAgeLimit = (): string => {
    if (isMovieDetails(media)) {
      return media.adult ? '18' : '13';
    }
    return '13';
  };
  const getDirector = (): string => {
    if (isMovieDetails(media)) {
      return (
        media.credits?.crew?.find((p) => p.job === 'Director')?.name || 'N/A'
      );
    }
    if (isTvDetails(media)) {
      return media.created_by?.map((p) => p.name).join(', ') || 'N/A';
    }
    return 'N/A';
  };
  const getCast = () => media?.credits?.cast?.slice(0, 8) || [];

  useEffect(() => {
    try {
      const raw = localStorage.getItem('favorites');
      const list: TMDBItem[] = raw ? JSON.parse(raw) : [];
      const numericId = id ? Number(id) : NaN;
      setIsFavorite(list.some((f) => f.id === numericId));
    } catch {
      setIsFavorite(false);
    }
  }, [id]);

  const toggleFavorite = (): void => {
    if (!media) return;
    const item: TMDBItem = isMovieDetails(media)
      ? {
          id: media.id,
          title: media.title,
          poster_path: media.poster_path ?? null,
          vote_average: media.vote_average,
          overview: media.overview,
          media_type: 'movie',
        }
      : {
          id: (media as TMDBDetailedTv).id,
          name: (media as TMDBDetailedTv).name,
          poster_path: (media as TMDBDetailedTv).poster_path ?? null,
          vote_average: media.vote_average,
          overview: media.overview,
          media_type: 'tv',
        };
    try {
      const raw = localStorage.getItem('favorites');
      const list: TMDBItem[] = raw ? JSON.parse(raw) : [];
      const exists = list.some((f) => f.id === item.id);
      const next = exists
        ? list.filter((f) => f.id !== item.id)
        : [...list, item];
      localStorage.setItem('favorites', JSON.stringify(next));
      setIsFavorite(!exists);
    } catch {
      // noop
    }
  };

  // show loading message while data is being fetched
  if (!media)
    return <div className='text-white text-center mt-10'>Loading...</div>;

  // ensure backdrop URL uses local fallback correctly
  const backdropUrl = media.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${media.backdrop_path}`
    : '/default-poster.jpg';

  return (
    <div className='bg-black text-white min-h-screen'>
      {/* backdrop image */}
      <section
        className='relative min-h-200 w-full bg-cover bg-center z-0'
        style={{
          backgroundImage: `url(${backdropUrl})`,
        }}
      >
        <div className='absolute inset-0 bg-gradient-to-b from-black/10 to-black'></div>
      </section>

      {/* main details section */}
      <section className='container mx-auto px-6 sm:px-12 md:px-40 rounded-b-lg z-10 relative mt-[-120px] sm:mt-[-240px] md:mt-[-360px]'>
        <div className='bg-transparent flex flex-col md:flex-row gap-6 sm:gap-8 pt-4 pb-6 sm:pt-6 sm:pb-8 rounded-b-lg'>
          {/* poster and trailer button */}
          <div className='flex-none w-50 sm:max-w-[300px] mx-auto md:mx-0 flex flex-col items-center'>
            <Image
              src={
                media.poster_path
                  ? `https://image.tmdb.org/t/p/w500${media.poster_path}`
                  : '/default-poster.jpg'
              }
              alt={getTitle() || 'Poster'}
              width={300}
              height={450}
              className='w-auto object-cover rounded-lg'
              quality={75}
            />
          </div>

          {/* text info */}
          <div className='flex-1'>
            <h2 className='text-xl sm:text-2xl md:text-3xl font-semibold'>
              {getTitle()}
            </h2>
            <div className='flex flex-wrap items-center gap-3 sm:gap-4 mt-3'>
              <span className='flex items-center gap-2 text-xs sm:text-sm md:text-base text-gray-300'>
                <Clock className='w-4 h-4' /> {getRunTime()}
              </span>
              <span className='flex items-center gap-2 text-xs sm:text-sm md:text-base text-gray-300'>
                <Calendar className='w-4 h-4' /> {formatDate(getDate())}
              </span>
            </div>
            <div className='flex items-center gap-3 sm:gap-4 mt-2'>
              <button
                onClick={openModal}
                disabled={!trailerUrl}
                className={`inline-flex items-center gap-2 justify-center bg-[#961200] text-white px-4 py-2 sm:px-6 sm:py-2 rounded-full font-medium text-xs sm:text-sm hover:bg-[#961200]/70 transition-colors ${
                  !trailerUrl
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer'
                }`}
              >
                Watch Trailer <PlayCircle className='size-5 text-white' />
              </button>
              <button
                onClick={toggleFavorite}
                aria-label='Toggle favorite'
                className={`p-2 rounded-full border border-white/10 bg-[#0F1117] hover:bg-[#141822] transition-colors ${
                  isFavorite ? 'text-red-500' : 'text-white'
                }`}
                title={
                  isFavorite ? 'Remove from favorites' : 'Add to favorites'
                }
              >
                <Heart
                  className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`}
                />
              </button>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-5'>
              <div className='flex flex-col items-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-black'>
                <Star className='size-8 text-yellow-400 fill-current' />
                <div>
                  <p className='text-xs text-gray-400 text-center'>Rating</p>
                  <p className='text-sm text-center sm:text-base font-semibold'>
                    {getRating()} / 10
                  </p>
                </div>
              </div>
              <div className='flex flex-col items-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-black'>
                <Video className='size-8 text-white fill-current' />
                <div>
                  <p className='text-xs text-gray-400 text-center'>Genre</p>
                  <p className='text-sm text-center sm:text-base font-semibold'>
                    {getGenres()}
                  </p>
                </div>
              </div>
              <div className='flex flex-col items-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-black'>
                <SmilePlus className='size-8 text-white' />
                <div>
                  <p className='text-xs text-gray-400 text-center'>Age Limit</p>
                  <p className='text-sm text-center sm:text-base font-semibold'>
                    {getAgeLimit()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Overview & Cast full-width under image */}
        <div className='mt-6 sm:mt-8'>
          <h3 className='text-base sm:text-lg md:text-xl font-semibold mb-2'>
            Overview
          </h3>
          <p className='text-sm sm:text-base md:text-lg text-gray-300'>
            {media.overview || 'No description available'}
          </p>
        </div>

        <div className='mt-8 sm:mt-10'>
          <h3 className='text-base sm:text-lg md:text-xl font-semibold mb-3'>
            Cast & Crew
          </h3>
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6'>
            {getCast().map((actor, index) => (
              <div key={index} className='flex items-center gap-3'>
                <Image
                  src={
                    actor.profile_path
                      ? `https://image.tmdb.org/t/p/w200${actor.profile_path}`
                      : '/default-poster.jpg'
                  }
                  alt={actor.name || 'Cast'}
                  width={48}
                  height={48}
                  className='size-12 object-cover rounded-lg'
                  quality={75}
                />
                <div>
                  <p className='text-sm font-semibold text-white'>
                    {actor.name}
                  </p>
                  <p className='text-xs text-gray-400'>
                    {actor.character || ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* recommendation movies section */}
      {hasRecommendations && (
        <section className='container mx-auto px-6 sm:px-12 md:px-40 py-6 sm:py-8'>
          <h2 className='text-xl sm:text-2xl md:text-3xl font-semibold mb-3 sm:mb-4'>
            Recommended {mediaType === 'movie' ? 'Movies' : 'TV Series'}
          </h2>
          <div className='flex overflow-x-auto gap-3 sm:gap-4 pb-4'>
            {recommendationList.slice(0, 10).map((item) => (
              <div key={item.id} className='flex-none'>
                <Card media={{ ...item, media_type: mediaType }} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* trailer modal */}
      <TrailerModal
        isOpen={isModalOpen}
        onClose={closeModal}
        trailerUrl={trailerUrl}
        title={getTitle()}
      />
    </div>
  );
}

export default function DetailsPage() {
  return (
    <Suspense
      fallback={<div className='text-white text-center mt-10'>Loading...</div>}
    >
      <DetailsPageContent />
    </Suspense>
  );
}
