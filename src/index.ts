import { Hono } from 'hono'
import { Resend } from 'resend'
import type { WebhookEventPayload } from 'resend'
import { simpleParser } from 'mailparser';

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
    // Get the email metadata
    const { data: email } = await resend
      .emails
      .receiving
      .get(event.data.email_id)

    // Download the raw email content if available
    if (!email?.raw?.download_url) {
      console.error('No raw email data available');
      return c.text('No raw email data available', 500);
    }

    const rawResponse = await fetch(email.raw.download_url);
    const rawEmailContent = await rawResponse.text();

    // Parse the raw email to extract content and attachments
    const parsed = await simpleParser(rawEmailContent, {
      skipImageLinks: true,
    });

    // Extract attachments with content_id for inline images
    const attachments = parsed.attachments.map((attachment) => {
      // Strip < and > from content IDs for proper inline image handling
      const contentId = attachment.contentId
        ? attachment.contentId.replace(/^<|>$/g, '')
        : undefined;

      return {
        filename: attachment.filename,
        content: attachment.content.toString('base64'),
        content_type: attachment.contentType,
        content_id: contentId || undefined,
      };
    });

    const { data, error } = await resend.emails.send({
      from: `${event.data.from} <forward@kaiweizhang.com>`,
      to: ['kaiwei.zhqwq@gmail.com'],
      subject: email.subject || '(no subject)',
      html: parsed.html || '(no html)',
      text: parsed.text || '(no text)',
      attachments: attachments.length > 0 ? attachments : undefined,
      replyTo: event.data.from,
    });

    if (error) {
      console.error('Error sending email:', error);
      return c.text('Error sending email', 500);
    }

    return c.json(data);
  }

  return c.json({});
});

export default app
