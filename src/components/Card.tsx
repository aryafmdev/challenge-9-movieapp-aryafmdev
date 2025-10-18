'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { TMDBItem, MediaType } from '@/types/tmdb';



export default function Card({ media }: { media: TMDBItem }) {
  // derive fields safely from union type
  const id = media.id;
  const posterPath = media.poster_path;
  const voteAverage = media.vote_average;
  const mediaType: MediaType = media.media_type ?? ('title' in media ? 'movie' : 'tv');
  const displayTitle = (
    'title' in media ? media.title : 'name' in media ? media.name : undefined
  ) ?? 'Untitled';


  return (
    <div className='flex-none w-44 md:w-52 lg:w-56 xl:w-60 min-w-[176px] max-w-[240px] bg-[#18181b] rounded-lg overflow-hidden shadow-lg snap-start'>
      <Link href={`/details?id=${id}&media_type=${mediaType}`}>
        <div className='relative aspect-[2/3] group cursor-pointer'>
          <Image
            src={
              posterPath
                ? `https://image.tmdb.org/t/p/w500${posterPath}`
                : '/default-poster.jpg'
            }
            alt={displayTitle}
            fill
            className='object-cover rounded-t-lg transition-all group-hover:brightness-95'
            sizes='(min-width: 1280px) 240px, (min-width: 1024px) 224px, (min-width: 768px) 208px, 176px'
            quality={75}
          />
        </div>
      </Link>

      <div className='p-4 flex flex-col gap-2'>
        <Link href={`/details?id=${id}&media_type=${mediaType}`}>
          <h3 className='text-base sm:text-lg my-1 font-semibold text-white line-clamp-2 h-12 sm:h-14 cursor-pointer hover:underline'>
            {displayTitle}
          </h3>
        </Link>
        <p className='text-xs sm:text-sm text-yellow-400'>
          ⭐ {voteAverage != null ? voteAverage.toFixed(1) : 'N/A'}
        </p>
      </div>
    </div>
  );
}
