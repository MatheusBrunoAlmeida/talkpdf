import { stripe } from '@/lib/stripe'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // console.log(req)
  // return
  if (req.method === 'POST') {
    console.log('entrou aqui')
    try {
      const { subscriptionId } = req.body

      if (!subscriptionId) {
        return res.status(400).json({ message: 'Subscription ID is required' })
      }

      // Cancela a assinatura no Stripe
      const deletedSubscription = await stripe.subscriptions.cancel(subscriptionId)

      console.log('assinatura', deletedSubscription)

      res.status(200).json(deletedSubscription)
    } catch (error) {
      console.error('Stripe cancellation error:', error)
      res.status(500).json({ message: 'An error occurred while canceling the subscription' })
    }
  } else {
    res.setHeader('Allow', 'POST')
    res.status(403).end('Method Not Allowed')
  }
}
