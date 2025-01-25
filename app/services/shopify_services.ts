import env from '#start/env'
import axios, { AxiosError } from 'axios'

interface ShopifyWebhook {
    topic: string
    address: string
    format: string
}

interface ShopifyError {
    message: string
    status: number
}

export default class ShopifyService {
    private readonly endpoint: string
    private readonly headers: Record<string, string>

    constructor() {
        const accessToken = env.get('SHOPIFY_ACCESS_TOKEN')
        const storeUrl = env.get('SHOPIFY_STORE_URL')
        const apiVersion = env.get('SHOPIFY_API_VERSION')

        this.endpoint = `https://${storeUrl}/admin/api/${apiVersion}`
        this.headers = {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json',
        }
    }

    private async request<T>(
        method: 'GET' | 'POST' | 'PUT' | 'DELETE',
        path: string,
        data?: any
    ): Promise<T> {
        try {
            const response = await axios<T>({
                method,
                url: `${this.endpoint}${path}`,
                headers: this.headers,
                data,
            })
            return response.data
        } catch (error) {
            if (error instanceof AxiosError) {
                throw {
                    message: error.response?.data?.errors || error.message,
                    status: error.response?.status || 500,
                } as ShopifyError
            }
            throw error
        }
    }

    // Products
    async getProducts() {
        try {
            console.log('Fetching products from:', `${this.endpoint}/products.json`)
            console.log('Headers:', this.headers)
            const response = await this.request<any>('GET', '/products.json')
            return response
        } catch (error) {
            console.error('Error in getProducts:', error)
            throw error
        }
    }

    async getProduct(productId: number) {
        return this.request<any>('GET', `/products/${productId}.json`)
    }

    async createProduct(productData: any) {
        return this.request<any>('POST', '/products.json', { product: productData })
    }

    // Orders
    async getOrders() {
        return this.request<any>('GET', '/orders.json')
    }

    async getOrder(orderId: number) {
        return this.request<any>('GET', `/orders/${orderId}.json`)
    }

    // Customers
    async getCustomers() {
        return this.request<any>('GET', '/customers.json')
    }

    async getCustomer(customerId: number) {
        return this.request<any>('GET', `/customers/${customerId}.json`)
    }

    // Webhooks
    async createWebhook(webhook: ShopifyWebhook) {
        return this.request<any>('POST', '/webhooks.json', { webhook })
    }

    async getWebhooks() {
        return this.request<any>('GET', '/webhooks.json')
    }

    async deleteWebhook(webhookId: number) {
        return this.request<void>('DELETE', `/webhooks/${webhookId}.json`)
    }
}
