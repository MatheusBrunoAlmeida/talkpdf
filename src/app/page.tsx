import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import Link from 'next/link'
import { ArrowRight, Check, HelpCircle, Minus } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import Image from 'next/image'

import '../output.css'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@radix-ui/react-tooltip'
import { PLANS } from '@/config/stripe'
import { cn } from '@/lib/utils'
import { RegisterLink, getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import UpgradeButton from '@/components/UpgradeButton'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { NextSeo } from 'next-seo'

export default function Home() {
  const { getUser } = getKindeServerSession()
  const user = getUser()

  const pricingItems = [
    {
      plan: 'Free',
      tagline: 'Para poucos documentos.',
      quota: 3,
      features: [
        {
          text: '5 Páginas por PDF',
          footnote:
            'O máximo de paginas por PDF.',
        },
        {
          text: '4MB permitido por arquivo.',
          footnote:
            'O máximo do tamnho do arquivo PDF permitido.',
        },
        {
          text: 'Disponivel para celular e Desktop',
        },
        {
          text: 'Respostas maiores',
          footnote:
            'Tamanho da mensagem que pode ser obtida sobre seu arquivo',
          negative: true,
        },
        {
          text: 'Prioridade no suporte',
          negative: true,
        },
      ],
    },
    {
      plan: 'Pro',
      tagline: 'Grande quantidade de documentos.',
      quota: PLANS.find((p) => p.slug === 'pro')!.quota,
      features: [
        {
          text: '50 Páginas por PDF',
          footnote:
            'O máximo de paginas por PDF.',
        },
        {
          text: '16MB permitido por arquivo.',
          footnote:
            'O máximo do tamnho do arquivo PDF permitido.',
        },
        {
          text: 'Disponivel para celular e Desktop',
        },
        {
          text: 'Respostas maiores',
          footnote:
            'Tamanho da mensagem que pode ser obtida sobre seu arquivo',
        },
        {
          text: 'Prioridade no suporte',
        },
      ],
    },
    {
      plan: 'Premium',
      tagline: 'Maior quantidade de documentos.',
      quota: PLANS.find((p) => p.slug === 'premium')!.quota,
      features: [
        {
          text: '300 Páginas por PDF',
          footnote:
            'O máximo de paginas por PDF.',
        },
        {
          text: '80MB permitido por arquivo.',
          footnote:
            'O máximo do tamnho do arquivo PDF permitido.',
        },
        {
          text: 'Disponivel para celular e Desktop',
        },
        {
          text: 'Respostas maiores',
          footnote:
            'Tamanho da mensagem que pode ser obtida sobre seu arquivo',
        },
        {
          text: 'Prioridade no suporte',
        },
      ],
    },
  ]

  return (
    <>
      {/* <NextSeo 
      title='TalkPdf'
      description='A sua plataforma de PDF + IA'
    /> */}
      <MaxWidthWrapper className='mb-12 mt-16 sm:mt-40 flex flex-col items-center justify-center text-center'>
        {/* <div className='mx-auto mb-4 flex max-w-fit items-center justify-center space-x-2 overflow-hidden rounded-full border border-gray-200 bg-white px-7 py-2 shadow-md backdrop-blur transition-all hover:border-gray-300 hover:bg-white/50'>
          <p className='text-sm font-semibold text-gray-700'>
            Quill is now public!
          </p>
        </div> */}
        <span className='max-w-4xl text-3xl font-bold md:text-6xl lg:text-2xl'>
          Transforme seus{' '}
          <span className='text-blue-600'>documentos</span>{' '}
          em respostas imediatas com <span className='text-blue-600'>Inteligência Artificial!</span>
        </span>
        <p className='mt-5 max-w-4xl text-zinc-700 sm:text-lg'>
          Obtenha insights rápidos e precisos sobre seus documentos PDF,
          aproveitando o poder da IA.
        </p>

        <RegisterLink
          className={buttonVariants({
            size: 'lg',
            className: 'mt-5',
          })}
          // href='/dashboard'
          target='_blank'>
          Teste grátis{' '}
          <ArrowRight className='ml-2 h-5 w-5' />
        </RegisterLink>
      </MaxWidthWrapper>

      {/* value proposition section */}
      <div>
        <div className='relative isolate'>
          <div
            aria-hidden='true'
            className='pointer-events-none absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80'>
            <div
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
              className='relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]'
            />
          </div>

          <div>
            <div className='mx-auto max-w-6xl px-6 lg:px-8'>
              <div className='mt-16 flow-root sm:mt-24'>
                <div className='-m-2 rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-2xl lg:p-4'>
                  <Image
                    src='/dashboard-preview.jpg'
                    alt='product preview'
                    width={1364}
                    height={866}
                    quality={100}
                    className='rounded-md bg-white p-2 sm:p-8 md:p-20 shadow-2xl ring-1 ring-gray-900/10'
                  />
                </div>
              </div>
            </div>
          </div>

          <div
            aria-hidden='true'
            className='pointer-events-none absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80'>
            <div
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
              className='relative left-[calc(50%-13rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-36rem)] sm:w-[72.1875rem]'
            />
          </div>
        </div>
      </div>

      {/* Feature section */}
      <div className='mx-auto mb-32 mt-32 max-w-5xl sm:mt-56'>
        <div className='mb-12 px-6 lg:px-8'>
          <div className='mx-auto max-w-2xl sm:text-center'>
            <h2 className='mt-2 font-bold text-4xl text-gray-900 sm:text-5xl'>
              Começe um chat em segundos
            </h2>
            <p className='mt-4 text-lg text-gray-600'>
              Conversar sobre seus documentos nunca foi tão facil como
              com o TalkPdf.
            </p>
          </div>
        </div>

        {/* steps */}
        <ol className='my-8 space-y-4 pt-8 md:flex md:space-x-12 md:space-y-0'>
          <li className='md:flex-1'>
            <div className='flex flex-col space-y-2 border-l-4 border-zinc-300 py-2 pl-4 md:border-l-0 md:border-t-2 md:pb-0 md:pl-0 md:pt-4'>
              <span className='text-sm font-medium text-blue-600'>
                Passo 1
              </span>
              <span className='text-xl font-semibold'>
                Crie sua conta
              </span>
              <span className='mt-2 text-zinc-700'>
                Começe com um plano gratuido ou
                escolha o seu{' '}
                <Link
                  href='/pricing'
                  className='text-blue-700 underline underline-offset-2'>
                  plano pro
                </Link>
                .
              </span>
            </div>
          </li>
          <li className='md:flex-1'>
            <div className='flex flex-col space-y-2 border-l-4 border-zinc-300 py-2 pl-4 md:border-l-0 md:border-t-2 md:pb-0 md:pl-0 md:pt-4'>
              <span className='text-sm font-medium text-blue-600'>
                Passo 2
              </span>
              <span className='text-xl font-semibold'>
                Faça upload do seu pdf facilmente
              </span>
              <span className='mt-2 text-zinc-700'>
                Nós; processaremos seu arquivo e deixaremos
                pronto para uma experiencia única com IA.
              </span>
            </div>
          </li>
          <li className='md:flex-1'>
            <div className='flex flex-col space-y-2 border-l-4 border-zinc-300 py-2 pl-4 md:border-l-0 md:border-t-2 md:pb-0 md:pl-0 md:pt-4'>
              <span className='text-sm font-medium text-blue-600'>
                Passo 3
              </span>
              <span className='text-xl font-semibold'>
                Começe suaas perguntas
              </span>
              <span className='mt-2 text-zinc-700'>
                De maneira simples, tenha uma experiencia
                que aumentará sua performace com documentos e seus estudos.
              </span>
            </div>
          </li>
        </ol>

        <div className='mx-auto max-w-6xl px-6 lg:px-8'>
          <div className='mt-16 flow-root sm:mt-24'>
            <div className='-m-2 rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-2xl lg:p-4'>
              <Image
                src='/file-upload-preview.jpg'
                alt='uploading preview'
                width={1419}
                height={732}
                quality={100}
                className='rounded-md bg-white p-2 sm:p-8 md:p-20 shadow-2xl ring-1 ring-gray-900/10'
              />
            </div>
          </div>
        </div>

        {/* <MaxWidthWrapper className='w-full px-0 py-0'> */}


      </div>
      <div style={{ marginTop: '10rem' }} className='flex flex-col w-full items-center justify-center mb-10 '>
        <h1 className='text-6xl font-bold sm:text-7xl'>
          Preço
        </h1>
        <p className='mt-5 text-gray-600 sm:text-lg'>
          Os melhores preços que cabem no seu bolso.
        </p>
      </div>

      <div className='px-10 pt-12 w-96 grid grid-cols-1 gap-10 lg:grid-cols-3'>
        <TooltipProvider>
          {pricingItems.map(
            ({ plan, tagline, quota, features }) => {
              const price =
                PLANS.find(
                  (p) => p.slug === plan.toLowerCase()
                )?.price.amount || 0

              return (
                <div
                  key={plan}
                  className={cn(
                    'relative rounded-2xl bg-white shadow-lg',
                    {
                      'border-2 border-blue-600 shadow-blue-200':
                        plan === 'Pro',
                      'border border-gray-200':
                        plan !== 'Pro',
                    }
                  )}>
                  {plan === 'Pro' && (
                    <div className='absolute -top-5 left-0 right-0 mx-auto w-32 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 px-3 py-2 text-sm font-medium text-white'>
                      Recomendado
                    </div>
                  )}

                  <div className='p-5 flex flex-col items-center'>
                    <h3 className='my-3 text-center font-display text-3xl font-bold'>
                      {plan}
                    </h3>
                    <p className='text-gray-500'>
                      {tagline}
                    </p>
                    <p className='my-5 font-display text-6xl font-semibold'>
                      R$ {price}
                    </p>
                    <p className='text-gray-500'>
                      por mês
                    </p>
                  </div>

                  <div className='flex h-20 items-center justify-center border-b border-t border-gray-200 bg-gray-50'>
                    <div className='flex items-center space-x-1'>
                      <p>
                        {quota.toLocaleString()} PDFs/mês
                        incluído
                      </p>

                      <Tooltip delayDuration={300}>
                        <TooltipTrigger className='cursor-default ml-1.5'>
                          <HelpCircle className='h-4 w-4 text-zinc-500' />
                        </TooltipTrigger>
                        <TooltipContent className='w-80 p-2'>
                          Quantos PDFs você pode subir por mês.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  <ul className='my-10 space-y-5 px-8'>
                    {features.map(
                      ({ text, footnote, negative }) => (
                        <li
                          key={text}
                          className='flex space-x-5'>
                          <div className='flex-shrink-0'>
                            {negative ? (
                              <Minus className='h-6 w-6 text-gray-300' />
                            ) : (
                              <Check className='h-6 w-6 text-blue-500' />
                            )}
                          </div>
                          {footnote ? (
                            <div className='flex items-center space-x-1'>
                              <p
                                className={cn(
                                  'text-gray-600',
                                  {
                                    'text-gray-400':
                                      negative,
                                  }
                                )}>
                                {text}
                              </p>
                              <Tooltip
                                delayDuration={300}>
                                <TooltipTrigger className='cursor-default ml-1.5'>
                                  <HelpCircle className='h-4 w-4 text-zinc-500' />
                                </TooltipTrigger>
                                <TooltipContent className='w-80 p-2'>
                                  {footnote}
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          ) : (
                            <p
                              className={cn(
                                'text-gray-600',
                                {
                                  'text-gray-400':
                                    negative,
                                }
                              )}>
                              {text}
                            </p>
                          )}
                        </li>
                      )
                    )}
                  </ul>
                  <div className='border-t border-gray-200' />
                  <div className='p-5'>
                    {plan === 'Free' ? (
                      <Link
                        href={
                          user ? '/dashboard' : '/sign-in'
                        }
                        className={buttonVariants({
                          className: 'w-full',
                          variant: 'secondary',
                        })}>
                        {user ? 'Selecionar' : 'Selecionar'}
                        <ArrowRight className='h-5 w-5 ml-1.5' />
                      </Link>
                    ) : user ? (
                      <UpgradeButton />
                    ) : (
                      <Link
                        href={
                          user ? '/dashboard' : '/sign-in'
                        }
                        className={buttonVariants({
                          className: 'w-full',
                        })}>
                        {user ? 'Selecionar' : 'Selecionar'}
                        <ArrowRight className='h-5 w-5 ml-1.5' />
                      </Link>
                    )}
                  </div>
                </div>
              )
            }
          )}
        </TooltipProvider>
      </div>
      {/* </MaxWidthWrapper> */}

      <div>
        <div style={{ marginTop: '10rem' }} className='flex flex-col w-full items-center justify-center mb-10 '>
          <h1 className='text-6xl font-bold sm:text-7xl'>
            FAQ
          </h1>
          <p className='mt-5 text-gray-600 sm:text-lg'>
            Responderemos suas duvidas.
          </p>
        </div>
        <MaxWidthWrapper>
          <Accordion type="single" collapsible className="w-full p-5">
            <AccordionItem value="item-1" className='p-5'>
              <AccordionTrigger>Existe algum limite de perguntas sobre os documentos?</AccordionTrigger>
              <AccordionContent className='mt-4'>
                Por equanto, não adicionamos limites de perguntas e respostas.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className='p-5'>
              <AccordionTrigger>Funciona para qualquer documento?</AccordionTrigger>
              <AccordionContent className='mt-4'>
                Por enquanto, só estamos funcionando com PDF.
                Em breve iremos atualizar para funcionarmos com qualquer tipo de documento e imagem.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" className='p-5'>
              <AccordionTrigger>Funciona no celular?</AccordionTrigger>
              <AccordionContent className='mt-4'>
                Sim, você pode acessar o TalkPdf no navegador do seu celular
                utiliza-lo tranquilamente.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </MaxWidthWrapper>
      </div>
      <footer style={{ background: 'rgb(30 41 59 /1)' }} className=' text-white bg-slate-800 flex items-center justify-center p-5 '>
        <span>Feito por <span className='font-bold'>Matheus Almeida Innovation</span></span>
      </footer>
    </>
  )
}
