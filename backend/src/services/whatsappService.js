const axios = require('axios');

const API_VERSION = process.env.WHATSAPP_API_VERSION || 'v21.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

class WhatsAppService {
  constructor() {
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.client = axios.create({
      baseURL: BASE_URL,
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
  }

  // ─── Send a text message ───
  async sendTextMessage(to, body) {
    const response = await this.client.post(`/${this.phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { preview_url: false, body },
    });
    return response.data;
  }

  // ─── Send a template message (required for starting conversations) ───
  async sendTemplateMessage(to, templateName, languageCode = 'en_US', components = []) {
    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
      },
    };
    if (components.length > 0) {
      payload.template.components = components;
    }
    const response = await this.client.post(`/${this.phoneNumberId}/messages`, payload);
    return response.data;
  }

  // ─── Send an image message ───
  async sendImageMessage(to, imageUrl, caption = '') {
    const response = await this.client.post(`/${this.phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      to,
      type: 'image',
      image: { link: imageUrl, caption },
    });
    return response.data;
  }

  // ─── Send a document message ───
  async sendDocumentMessage(to, documentUrl, filename, caption = '') {
    const response = await this.client.post(`/${this.phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      to,
      type: 'document',
      document: { link: documentUrl, filename, caption },
    });
    return response.data;
  }

  // ─── Bulk send (with delay to avoid rate limiting) ───
  async sendBulkMessages(recipients, messageType, messageData, delayMs = 1000) {
    const results = [];

    for (const recipient of recipients) {
      try {
        let result;
        switch (messageType) {
          case 'text':
            result = await this.sendTextMessage(recipient, messageData.body);
            break;
          case 'template':
            result = await this.sendTemplateMessage(
              recipient,
              messageData.templateName,
              messageData.languageCode,
              messageData.components
            );
            break;
          case 'image':
            result = await this.sendImageMessage(recipient, messageData.imageUrl, messageData.caption);
            break;
          default:
            throw new Error(`Unknown message type: ${messageType}`);
        }
        results.push({ recipient, status: 'sent', data: result });
      } catch (error) {
        results.push({
          recipient,
          status: 'failed',
          error: error.response?.data || error.message,
        });
      }

      // Delay between messages to respect rate limits
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    return results;
  }

  // ─── Mark message as read ───
  async markAsRead(messageId) {
    const response = await this.client.post(`/${this.phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    });
    return response.data;
  }

  // ─── Get message templates ───
  async getMessageTemplates() {
    const businessId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
    const response = await this.client.get(`/${businessId}/message_templates`);
    return response.data;
  }
}

module.exports = new WhatsAppService();
