import { Hono } from 'hono'
import { Resend } from 'resend'

const app = new Hono()
const resend = new Resend(process.env.RESEND_API_KEY);

const welcomeStrings = [
  'Hello Hono!',
  'To learn more about Hono on Vercel, visit https://vercel.com/docs/frameworks/backend/hono'
]

app.get('/', (c) => {
  return c.text(welcomeStrings.join('\n\n'))
})

app.post('/webhook', async (c) => {
  const event = await c.req.json();

  if (event.type === 'email.received') {
    const { data, error } = await resend.emails.receiving.forward({
      emailId: event.data.email_id,
      to: 'kaiwei.zhqwq@gmail.com',
      from: 'onboarding@resend.dev',
    });

    if (error) {
      return c.text(`Error: ${error.message}`, 500);
    }

    return c.json(data);
  }

  return c.json({});
});

export default app
