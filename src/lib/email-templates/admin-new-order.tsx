import * as React from 'react'
import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  orderNumber?: string
  customerName?: string
  customerEmail?: string
  total?: string
  items?: { name: string; quantity: number; price: string }[]
}

const Email = ({ orderNumber = 'AP-0000', customerName = '', customerEmail = '', total = '$0.00', items = [] }: Props) => (
  <Html lang="en">
    <Head />
    <Preview>New order {orderNumber} — {total}</Preview>
    <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Georgia, serif', margin: 0 }}>
      <Container style={{ maxWidth: 560, padding: '32px 28px' }}>
        <Heading style={{ fontSize: 22, color: '#1a1a1a', margin: 0 }}>New order received</Heading>
        <Hr style={{ borderColor: '#c9a14a', borderWidth: 1, margin: '12px 0 24px' }} />
        <Text style={{ color: '#444', fontSize: 14, lineHeight: '22px' }}>
          Order <strong>{orderNumber}</strong> from <strong>{customerName}</strong> ({customerEmail}).
        </Text>
        <Section style={{ backgroundColor: '#faf6ef', padding: 16, borderRadius: 8, margin: '20px 0' }}>
          {items.map((it, i) => (
            <Text key={i} style={{ margin: '4px 0', fontSize: 13, color: '#333' }}>
              {it.quantity}× {it.name} — {it.price}
            </Text>
          ))}
          <Hr style={{ margin: '10px 0' }} />
          <Text style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>Total: {total}</Text>
        </Section>
        <Text style={{ color: '#444', fontSize: 14 }}>
          Open the admin dashboard to manage this order.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `New order ${d.orderNumber ?? ''} — ${d.total ?? ''}`,
  displayName: 'Admin — new order',
  previewData: { orderNumber: 'AP-20260101-ABC123', customerName: 'Sara', customerEmail: 'sara@example.com', total: '$120.00', items: [{ name: 'Oud Royal 50ml', quantity: 1, price: '$120.00' }] },
} satisfies TemplateEntry
