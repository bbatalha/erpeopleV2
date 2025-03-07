import { handleLinkedInWebhook } from '../../lib/webhookHandler'

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const webhookData = await req.json()

    // Basic validation of webhook data
    if (!webhookData?.data?.data) {
      return new Response('Invalid webhook data', { status: 400 })
    }

    // Process webhook data
    const result = await handleLinkedInWebhook(webhookData)

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Webhook error:', error)
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}