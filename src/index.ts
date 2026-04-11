import { Hono } from 'hono'
import { Resend } from 'resend'
import type { WebhookEventPayload } from 'resend'

const app = new Hono()
const resend = new Resend(process.env.RESEND_API_KEY);

const welcomeStrings = [
  'Hello!',
  'You found my API endpoint. Please don\'t do evil things with it.',
  'Contact me: kaiwei.zhqwq@gmail.com'
]

app.get('/', (c) => {
  return c.text(welcomeStrings.join('\n\n'))
})

app.post('/webhook', async (c) => {
  const event = await c.req.json<WebhookEventPayload>();

  console.log('Processing email.received event');
  console.log('Event:', event);

  if (event.type === 'email.received') {
    const { data, error } = await resend.emails.receiving.forward({
      emailId: event.data.email_id,
      to: 'kaiwei.zhqwq@gmail.com',
      from: event.data.from,
    });

    if (error) {
      return c.text(`Error: ${error.message}`, 500);
    }

    return c.json(data);
  }

  return c.json({});
});

export default app
