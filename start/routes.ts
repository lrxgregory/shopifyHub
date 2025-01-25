/*
|--------------------------------------------------------------------------
| routers file
|--------------------------------------------------------------------------
|
| The routers file is used for defining the HTTP routers.
|
*/

import ShopifyService from '#services/shopify_services'
import { Env } from '@adonisjs/core/env'
import router from '@adonisjs/core/services/router'
import crypto from 'crypto'

// Initialiser le service Shopify
const shopifyService = new ShopifyService()

// Middleware pour vérifier la signature des webhooks Shopify
const verifyShopifyWebhook = async ({ request, response }, next) => {
  const hmac = request.header('X-Shopify-Hmac-Sha256')
  const topic = request.header('X-Shopify-Topic')
  const shop = request.header('X-Shopify-Shop-Domain')

  if (!hmac || !topic || !shop) {
    return response.status(401).json({ error: 'Missing required headers' })
  }

  const rawBody = request.raw()
  const hash = crypto
    .createHmac('sha256', Env.get('SHOPIFY_WEBHOOK_SECRET'))
    .update(rawBody)
    .digest('base64')

  if (hash !== hmac) {
    return response.status(401).json({ error: 'Invalid webhook signature' })
  }

  await next()
}

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

// Products routers
router.group(() => {
  router.get('/', async ({ response }) => {
    try {
      const products = await shopifyService.getProducts()
      return response.status(200).json(products)
    } catch (error) {
      console.error('Error fetching products:', error)
      return response.status(500).json({
        error: error.message || 'Failed to fetch products'
      })
    }
  })

  router.get('/:id', async ({ params, response }) => {
    try {
      const product = await shopifyService.getProduct(params.id)
      return response.status(200).json(product)
    } catch (error) {
      return response.status(500).json({
        error: error.message || 'Failed to fetch product'
      })
    }
  })

  router.post('/', async ({ request, response }) => {
    try {
      const product = await shopifyService.createProduct(request.body())
      return response.status(201).json(product)
    } catch (error) {
      console.error('Error creating product:', error)
      return response.status(500).json({
        error: error.message || 'Failed to create product'
      })
    }
  })
}).prefix('/api/products')

// Orders routers
router.group(() => {
  router.get('/', async ({ response }) => {
    try {
      const orders = await shopifyService.getOrders()
      return response.status(200).json(orders)
    } catch (error) {
      console.error('Error fetching orders:', error)
      return response.status(500).json({
        error: error.message || 'Failed to fetch orders'
      })
    }
  })

  router.get('/:id', async ({ params, response }) => {
    try {
      const order = await shopifyService.getOrder(params.id)
      return response.status(200).json(order)
    } catch (error) {
      return response.status(500).json({
        error: error.message || 'Failed to fetch order'
      })
    }
  })
}).prefix('/api/orders')

// Customers routers
router.group(() => {
  router.get('/', async ({ response }) => {
    try {
      const customers = await shopifyService.getCustomers()
      return response.status(200).json(customers)
    } catch (error) {
      console.error('Error fetching customers:', error)
      return response.status(500).json({
        error: error.message || 'Failed to fetch customers'
      })
    }
  })

  router.get('/:id', async ({ params, response }) => {
    try {
      const customer = await shopifyService.getCustomer(params.id)
      return response.status(200).json(customer)
    } catch (error) {
      return response.status(500).json({
        error: error.message || 'Failed to fetch customer'
      })
    }
  })
}).prefix('/api/customers')

// Webhooks routers
router.group(() => {
  router.post('/', async ({ request, response }) => {
    try {
      const topic = request.header('X-Shopify-Topic')
      const payload = request.body()

      console.log(`Webhook received: ${topic}`)
      console.log('Payload:', payload)

      switch (topic) {
        case 'products/create':
          // Logique pour la création de produit
          break
        case 'orders/create':
          // Logique pour la création de commande
          break
      }

      return response.status(200).json({ success: true, message: `Webhook ${topic} processed` })
    } catch (error) {
      console.error('Error processing webhook:', error)
      return response.status(500).json({
        error: error.message || 'Failed to process webhook'
      })
    }
  }).middleware(verifyShopifyWebhook)

  router.get('/', async ({ response }) => {
    try {
      const webhooks = await shopifyService.getWebhooks()
      return response.status(200).json(webhooks)
    } catch (error) {
      console.error('Error fetching webhooks:', error)
      return response.status(500).json({
        error: error.message || 'Failed to fetch webhooks'
      })
    }
  })
}).prefix('/api/webhooks')