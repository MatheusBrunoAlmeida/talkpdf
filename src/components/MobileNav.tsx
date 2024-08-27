'use client'

import { RegisterLink } from '@kinde-oss/kinde-auth-nextjs/server'
import { ArrowRight, Gem, Menu } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { buttonVariants } from './ui/button'
import { getUserSubscriptionPlan } from '@/lib/stripe'

const MobileNav = ({ isAuth, user }: { isAuth: boolean, user: any }) => {
  const [isOpen, setOpen] = useState<boolean>(false)

  const toggleOpen = () => setOpen((prev) => !prev)

  const pathname = usePathname()

  useEffect(() => {
    if (isOpen) toggleOpen()
  }, [pathname])

  const closeOnCurrent = (href: string) => {
    if (pathname === href) {
      toggleOpen()
    }
  }

  return (
    <div className='sm:hidden'>
      <Menu
        onClick={toggleOpen}
        className='relative z-50 h-5 w-5 text-zinc-700'
      />

      {isOpen ? (
        <div className='fixed animate-in slide-in-from-top-5 fade-in-20 inset-0 z-0 w-full'>
          <ul className='absolute bg-white border-b border-zinc-200 shadow-xl grid w-full gap-3 px-10 pt-20 pb-8'>
            {!isAuth ? (
              <>
                <li>
                  <RegisterLink
                    className={buttonVariants({
                      size: 'sm',
                    })}>
                    Começar{' '}
                    <ArrowRight className='ml-1.5 h-5 w-5' />
                  </RegisterLink>
                </li>
                <li className='my-3 h-px w-full bg-gray-300' />
                <li>
                  <Link
                    onClick={() =>
                      closeOnCurrent('/sign-in')
                    }
                    className='flex items-center w-full font-semibold'
                    href='/sign-in'>
                    Entrar
                  </Link>
                </li>
                <li className='my-3 h-px w-full bg-gray-300' />
                <li>
                  <Link
                    onClick={() =>
                      closeOnCurrent('/pricing')
                    }
                    className='flex items-center w-full font-semibold'
                    href='/pricing'>
                    Preço
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link
                    onClick={() =>
                      closeOnCurrent('/dashboard')
                    }
                    className='flex items-center w-full font-semibold'
                    href='/dashboard'>
                    Dashboard
                  </Link>
                </li>

                <li className='my-3 h-px w-full bg-gray-300' />

                <li>
                  <Link href='/dashboard/billing' className='flex items-center w-full font-semibold'>
                    Trocar plano
                    <Gem className='text-blue-600 h-4 w-4 ml-1.5' />
                  </Link>
                </li>

                <li className='my-3 h-px w-full bg-gray-300' />

                <li>
                  <Link href='mailto:matheusbrunoalmeida.dev@gmail.com' className='flex items-center w-full font-semibold'>
                    Suporte
                  </Link>
                </li>

                <li className='my-3 h-px w-full bg-gray-300' />

                <li>
                  <Link
                    className='flex items-center w-full font-semibold'
                    href='/sign-out'>
                    Sair
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

export default MobileNav
