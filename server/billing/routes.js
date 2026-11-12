import { Router } from 'express'
import { exigirAutenticacao } from '../auth/middleware.js'
import { obterPlano, PLANOS } from './plans.js'
import {
  contarTarefasAtivas,
  obterAssinatura,
  planoEfetivo,
  salvarClienteStripe,
} from './repository.js'
import { appUrl, pagamentosConfigurados, precosPro, stripe } from './stripe.js'

const router = Router()

router.get('/', exigirAutenticacao, async (req, res) => {
  try {
    const assinatura = await obterAssinatura(req.userId)
    const efetivo = planoEfetivo(assinatura)
    const plano = obterPlano(efetivo)
    const tarefasAtivas = await contarTarefasAtivas(req.userId)
    const pagamentosProntos = pagamentosConfigurados && Boolean(precosPro.mes) && Boolean(precosPro.ano)

    res.json({
      pagamentosConfigurados: pagamentosProntos,
      planos: PLANOS,
      assinatura: {
        plano: assinatura.plano,
        planoEfetivo: efetivo,
        status: assinatura.status,
        intervalo: assinatura.intervalo,
        periodoFim: assinatura.periodo_fim,
        cancelamentoAgendado: Boolean(assinatura.cancel_at_period_end),
      },
      uso: { tarefasAtivas },
      limites: { tarefas: plano.limiteTarefas },
    })
  } catch (error) {
    console.error('Falha ao carregar assinatura:', error)
    res.status(503).json({ erro: 'Não foi possível carregar os planos. Tente novamente.' })
  }
})

router.post('/checkout', exigirAutenticacao, async (req, res) => {
  const intervalo = req.body?.intervalo === 'ano' ? 'ano' : 'mes'

  if (!pagamentosConfigurados || !stripe) {
    return res.status(503).json({ erro: 'Pagamentos ainda não estão configurados no servidor.' })
  }

  const priceId = precosPro[intervalo]
  if (!priceId) {
    return res.status(503).json({
      erro: `O preço do plano Pro (${intervalo}) não está configurado no servidor.`,
    })
  }

  try {
    const assinatura = await obterAssinatura(req.userId)
    if (planoEfetivo(assinatura) === 'pro') {
      return res.status(409).json({ erro: 'Você já possui uma assinatura Pro ativa.' })
    }

    let customerId = assinatura.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.usuario.email,
        metadata: { userId: req.userId },
      })
      customerId = customer.id
      await salvarClienteStripe(req.userId, customerId)
    }

    const sessao = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: req.userId,
      success_url: `${appUrl}/?checkout=sucesso`,
      cancel_url: `${appUrl}/?checkout=cancelado`,
      allow_promotion_codes: true,
      metadata: { userId: req.userId, plano: 'pro', intervalo },
      subscription_data: {
        metadata: { userId: req.userId, plano: 'pro', intervalo },
      },
    })

    res.json({ url: sessao.url })
  } catch (error) {
    console.error('Falha ao criar checkout:', error)
    res.status(502).json({ erro: 'Não foi possível iniciar o checkout. Tente novamente.' })
  }
})

router.post('/portal', exigirAutenticacao, async (req, res) => {
  if (!pagamentosConfigurados || !stripe) {
    return res.status(503).json({ erro: 'Pagamentos ainda não estão configurados no servidor.' })
  }

  try {
    const assinatura = await obterAssinatura(req.userId)
    if (!assinatura.stripe_customer_id) {
      return res.status(400).json({ erro: 'Nenhuma assinatura encontrada para gerenciar.' })
    }

    const sessao = await stripe.billingPortal.sessions.create({
      customer: assinatura.stripe_customer_id,
      return_url: `${appUrl}/?checkout=portal`,
    })

    res.json({ url: sessao.url })
  } catch (error) {
    console.error('Falha ao abrir portal de cobrança:', error)
    res.status(502).json({ erro: 'Não foi possível abrir o gerenciamento da assinatura.' })
  }
})

export default router
