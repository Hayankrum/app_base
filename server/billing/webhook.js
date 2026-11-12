import { buscarUsuarioPorCustomer, salvarAssinatura } from './repository.js'
import { stripe, webhookSecret } from './stripe.js'

function obterFimDoPeriodo(subscription) {
  const doItem = subscription.items?.data?.[0]?.current_period_end
  return subscription.current_period_end ?? doItem ?? null
}

function obterIntervalo(subscription) {
  const intervalo = subscription.items?.data?.[0]?.price?.recurring?.interval
  return intervalo === 'year' ? 'ano' : 'mes'
}

async function sincronizarAssinatura(subscription, userIdInformado) {
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer?.id
  const userId = userIdInformado
    ?? subscription.metadata?.userId
    ?? await buscarUsuarioPorCustomer(customerId)
  if (!userId) return

  const fim = obterFimDoPeriodo(subscription)
  await salvarAssinatura(userId, {
    plano: 'pro',
    status: subscription.status,
    intervalo: obterIntervalo(subscription),
    customerId,
    subscriptionId: subscription.id,
    periodoFim: fim ? new Date(fim * 1000).toISOString() : null,
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
  })
}

export async function billingWebhook(req, res) {
  if (!stripe || !webhookSecret) {
    return res.status(503).json({ erro: 'Webhook de pagamento não configurado.' })
  }

  let evento
  try {
    evento = stripe.webhooks.constructEvent(
      req.body,
      req.get('stripe-signature'),
      webhookSecret
    )
  } catch (error) {
    console.error('Assinatura de webhook inválida:', error.message)
    return res.status(400).json({ erro: `Webhook inválido: ${error.message}` })
  }

  try {
    if (evento.type === 'checkout.session.completed') {
      const sessao = evento.data.object
      const userId = sessao.client_reference_id ?? sessao.metadata?.userId
      if (sessao.subscription) {
        const subscriptionId = typeof sessao.subscription === 'string'
          ? sessao.subscription
          : sessao.subscription.id
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        await sincronizarAssinatura(subscription, userId)
      }
    } else if (
      evento.type === 'customer.subscription.created'
      || evento.type === 'customer.subscription.updated'
      || evento.type === 'customer.subscription.deleted'
    ) {
      await sincronizarAssinatura(evento.data.object)
    }

    res.json({ received: true })
  } catch (error) {
    console.error('Falha ao processar webhook:', error)
    res.status(500).json({ erro: 'Falha ao processar o evento.' })
  }
}
