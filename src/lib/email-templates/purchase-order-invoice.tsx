import * as React from 'react'
import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  orderNumber?: string
  customerName?: string
  total?: string
  items?: { name: string; quantity: number; price: string }[]
  invoiceUrl?: string
  poReference?: string
}

const Email = ({
  orderNumber = 'AP-0000',
  customerName = 'there',
  total = '$0.00',
  items = [],
  invoiceUrl = '#',
  poReference = '',
}: Props) => (
  <Html lang="en">
    <Head />
    <Preview>Invoice for purchase order {orderNumber}</Preview>
    <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Georgia, serif', margin: 0 }}>
      <Container style={{ maxWidth: 580, padding: '32px 28px' }}>
        <Heading style={{ fontSize: 22, color: '#1a1a1a', margin: 0 }}>Abdulrahman Perfumes</Heading>
        <Hr style={{ borderColor: '#c9a14a', borderWidth: 1, margin: '12px 0 24px' }} />
        <Heading as="h2" style={{ fontSize: 18, color: '#1a1a1a' }}>Purchase order received, {customerName}.</Heading>
        <Text style={{ color: '#444', fontSize: 14, lineHeight: '22px' }}>
          Thank you for your order. We've created invoice <strong>{orderNumber}</strong> against your purchase
          order{poReference ? ` (${poReference})` : ''}. Please find the PDF invoice attached via the secure
          link below. Standard payment terms apply (Net 14 days).
        </Text>
        <Section style={{ textAlign: 'center', margin: '24px 0' }}>
          <Button
            href={invoiceUrl}
            style={{
              backgroundColor: '#c9a14a',
              color: '#ffffff',
              padding: '12px 22px',
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Download invoice PDF
          </Button>
        </Section>
        <Section style={{ backgroundColor: '#faf6ef', padding: 16, borderRadius: 8, margin: '20px 0' }}>
          {items.map((it, i) => (
            <Text key={i} style={{ margin: '4px 0', fontSize: 13, color: '#333' }}>
              {it.quantity}× {it.name} — {it.price}
            </Text>
          ))}
          <Hr style={{ margin: '10px 0' }} />
          <Text style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>Total due: {total}</Text>
        </Section>
        <Text style={{ color: '#666', fontSize: 12 }}>
          Please remit payment as per the instructions on the invoice. Reply to this email if you have any
          questions.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `Invoice ${d.orderNumber ?? ''} — Purchase order`,
  displayName: 'Purchase order invoice',
  previewData: {
    orderNumber: 'AP-20260101-ABC123',
    customerName: 'Sara',
    total: '$240.00',
    items: [{ name: 'Oud Royal 50ml', quantity: 2, price: '$240.00' }],
    invoiceUrl: 'https://example.com/invoice.pdf',
    poReference: 'PO-12345',
  },
} satisfies TemplateEntry
