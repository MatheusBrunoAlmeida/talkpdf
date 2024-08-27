'use client'

import { getUserSubscriptionPlan, stripe } from '@/lib/stripe'
import { useToast } from './ui/use-toast'
import { trpc } from '@/app/_trpc/client'
import MaxWidthWrapper from './MaxWidthWrapper'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card'
import { Button } from './ui/button'
import { Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { useState } from 'react'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { api } from '@/lib/axios'
import Link from 'next/link'
import { useRouter } from 'next/router'

interface BillingFormProps {
  subscriptionPlan: Awaited<
    ReturnType<typeof getUserSubscriptionPlan>
  >
}

const BillingForm = ({
  subscriptionPlan,
}: BillingFormProps) => {
  const { toast } = useToast()
  const [isCanceling, setIsCanceling] = useState(false)
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false)

  console.log(subscriptionPlan)

  const { mutate: createStripeSession, isLoading } =
    trpc.createStripeSession.useMutation({
      onSuccess: ({ url }) => {
        if (url) window.location.href = url
        if (!url) {
          toast({
            title: 'There was a problem...',
            description: 'Please try again in a moment',
            variant: 'destructive',
          })
        }
      },
    })

  const { mutate: cancelSubscription } = trpc.cancelSubiscription.useMutation({
    onSuccess: (response) => {
      console.log(response)
      toast({
        title: 'Assinatura cancelada com sucesso',
        description: 'Sua assinatura foi cancelada.',
      })

      window.location.reload()
      setIsConfirmingCancel(false)
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Houve um problema ao cancelar sua assinatura.',
        variant: 'destructive',
      })
      setIsCanceling(false)
    },
  })



  const handleCancelSubscription = async () => {
    setIsCanceling(true)
    // @ts-ignore
    cancelSubscription({ subscriptionId: subscriptionPlan.stripeSubscriptionId })
  }

  return (
    <MaxWidthWrapper className='max-w-5xl'>
      <form
        className='mt-12'
        onSubmit={(e) => {
          e.preventDefault()
          if (!subscriptionPlan.isSubscribed) {
            // @ts-ignore
            createStripeSession({ plan: subscriptionPlan.name })
          }
        }}>
        <Card>
          <CardHeader>
            <CardTitle>Plano assinado</CardTitle>
            <CardDescription>
              Você está no plano{' '}
              {/* @ts-ignore */}
              <strong>{subscriptionPlan.name}</strong>.
            </CardDescription>
          </CardHeader>

          <CardFooter className='flex flex-col items-start space-y-2 md:flex-row md:justify-between md:space-x-0'>
            {subscriptionPlan.isSubscribed ? (
              <>
                <Dialog open={isConfirmingCancel} onOpenChange={setIsConfirmingCancel}>
                  <DialogTrigger asChild>
                    <Button
                      type='button'
                      disabled={isLoading || isCanceling}
                      onClick={() => setIsConfirmingCancel(true)}
                    >
                      {(isLoading || isCanceling) ? (
                        <Loader2 className='mr-4 h-4 w-4 animate-spin' />
                      ) : null}
                      {'Cancelar assinatura'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirmar Cancelamento</DialogTitle>
                    </DialogHeader>
                    <p>Você tem certeza que deseja cancelar sua assinatura?</p>
                    <DialogFooter>
                      <Button variant='outline' onClick={() => setIsConfirmingCancel(false)}>
                        Não, voltar
                      </Button>
                      <Button
                        variant='destructive'
                        onClick={handleCancelSubscription}
                        disabled={isCanceling}
                      >
                        {isCanceling ? (
                          <Loader2 className='mr-4 h-4 w-4 animate-spin' />
                        ) : null}
                        Sim, cancelar assinatura
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <Button onClick={() => window.location.href = '/pricing'} disabled={isLoading}>
                {(isLoading) ? (
                  <Loader2 className='mr-4 h-4 w-4 animate-spin' />
                ) : null}
                {'Upgrade para PRO'}
              </Button>
            )}

            {subscriptionPlan.isSubscribed ? (
              <p className='rounded-full text-xs font-medium'>
                {subscriptionPlan.isCanceled
                  ? 'Seu plano vai ser cancelado em '
                  : 'Seu plano renova em '}
                {format(
                  subscriptionPlan.stripeCurrentPeriodEnd!,
                  'dd/MM/yyyy'
                )}
              </p>
            ) : null}
          </CardFooter>
        </Card>
      </form>
    </MaxWidthWrapper>
  )
}

export default BillingForm
