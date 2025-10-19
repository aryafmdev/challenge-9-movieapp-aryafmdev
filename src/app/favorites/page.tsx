'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import TrailerModal from '@/components/TrailerModal'
import type { TMDBItem, MediaType } from '@/types/tmdb'
import { Heart, PlayCircle } from 'lucide-react'

function getTitle(item: TMDBItem): string {
  return (
    ('title' in item ? item.title : 'name' in item ? item.name : undefined) ??
    'Untitled'
  )
}

function getMediaType(item: TMDBItem): MediaType {
  return item.media_type ?? ('title' in item ? 'movie' : 'tv')
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<TMDBItem[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null)
  const [modalTitle, setModalTitle] = useState<string | undefined>(undefined)

  // load favorites from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('favorites')
      if (raw) {
        const parsed: TMDBItem[] = JSON.parse(raw)
        setFavorites(Array.isArray(parsed) ? parsed : [])
      }
    } catch (e) {
      setFavorites([])
    }
  }, [])

  const removeFavorite = (id: number) => {
    setFavorites((prev) => {
      const next = prev.filter((item) => item.id !== id)
      localStorage.setItem('favorites', JSON.stringify(next))
      return next
    })
  }

  const openTrailer = async (item: TMDBItem) => {
    const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY
    const mediaType = getMediaType(item)
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/${mediaType}/${item.id}/videos?api_key=${apiKey}&language=en-US`,
        { cache: 'no-store' }
      )
      if (res.ok) {
        const data = (await res.json()) as {
          results?: Array<{ site: string; type: string; key: string }>
        }
        const trailer = data.results?.find(
          (v) => v.site === 'YouTube' && v.type === 'Trailer'
        )
        const url = trailer
          ? `https://www.youtube.com/embed/${trailer.key}?autoplay=1&playsinline=1&mute=1&controls=1&rel=0&modestbranding=1`
          : null
        setTrailerUrl(url)
        setModalTitle(getTitle(item))
        setIsModalOpen(!!url)
      } else {
        setTrailerUrl(null)
        setIsModalOpen(false)
      }
    } catch (err) {
      setTrailerUrl(null)
      setIsModalOpen(false)
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setTrailerUrl(null)
  }

  return (
    <section className='container mx-auto px-6 sm:px-12 py-20'>
      <h2 className='text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6 pt-20'>
        Favorites
      </h2>

      {favorites.length === 0 ? (
        <div className='flex flex-col items-center justify-center text-center py-24'>
          <div className=''>
            <Image src='/frame.png' alt='frame' width={100} height={100} />
          </div>
          <p className='text-sm text-gray-300 font-medium'>Data Empty</p>
          <p className='text-xs sm:text-sm text-gray-400 mt-1'>
            You don&apos;t have a favorite movie yet
          </p>
          <Link
            href='/movies'
            className='mt-4 inline-flex items-center justify-center text-md px-5 py-2 rounded-full bg-[#961200] text-white font-semibold hover:bg-[#961200]/80'
          >
            Explore Movie
          </Link>
        </div>
      ) : (
        <div className='space-y-8'>
          {favorites.map((item) => {
            const displayTitle = getTitle(item)
            const overview = 'overview' in item ? item.overview : ''
            const posterPath = 'poster_path' in item ? item.poster_path : null
            const voteAverage = 'vote_average' in item ? item.vote_average : undefined
            const mediaType = getMediaType(item)
            return (
              <div
                key={item.id}
                className='flex gap-4 items-start border-t border-white/10 pt-6'
              >
                <Image
                  src={
                    posterPath
                      ? `https://image.tmdb.org/t/p/w500${posterPath}`
                      : '/default-poster.jpg'
                  }
                  alt={displayTitle}
                  width={96}
                  height={144}
                  className='w-24 h-auto aspect-[2/3] object-cover rounded-lg'
                  quality={75}
                />

                <div className='flex-1 min-w-0'>
                  <Link
                    href={{
                      pathname: '/details',
                      query: { id: item.id, media_type: mediaType },
                    }}
                  >
                    <h3 className='text-base sm:text-lg font-semibold text-white hover:underline'>
                      {displayTitle}
                    </h3>
                  </Link>
                  <p className='mt-1 text-sm text-yellow-400'>
                    ⭐ {voteAverage != null ? voteAverage.toFixed(1) : 'N/A'}/10
                  </p>
                  <p className='mt-2 text-sm text-gray-300 line-clamp-3'>
                    {overview || 'No overview available.'}
                  </p>

                  <div className='mt-3'>
                    <button
                      onClick={() => openTrailer(item)}
                      className='inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#961200] text-white font-semibold hover:bg-[#961200]/80'
                    >
                      <PlayCircle className='w-4 h-4' />
                      Watch Trailer
                    </button>
                  </div>
                </div>

                <button
                  aria-label='Remove from favorites'
                  className='p-2 rounded-full border border-white/10 bg-[#0F1117] text-white hover:bg-[#141822]'
                  onClick={() => removeFavorite(item.id)}
                  title='Remove favorite'
                >
                  <Heart className='w-4 h-4 text-red-500 fill-current' />
                </button>
              </div>
            )
          })}
        </div>
      )}

      <TrailerModal
        isOpen={isModalOpen}
        onClose={closeModal}
        trailerUrl={trailerUrl}
        title={modalTitle}
      />
    </section>
  )
}