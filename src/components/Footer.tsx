import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className='bg-black text-white border-t border-gray-700'>
      <div className='container mx-auto px-4 py-4 flex items-center justify-between'>
        {/* Logo section */}
        <Link href='/' className='flex flex-col items-center'>
          <Image
            src='/Logo.svg'
            alt='Logo'
            width={130}
            height={40}
            className='size-20 sm:size-24 md:size-28'
          />
        </Link>

        {/* Right: Copyright text with icon */}
        <div className='flex items-center space-x-1 text-xs md:text-sm lg:text-base'>
          <span>Copyright &copy; 2025 Movie Explorer</span>
        </div>
      </div>
    </footer>
  );
}
