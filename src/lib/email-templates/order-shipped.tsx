import * as React from 'react'
import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  orderNumber?: string
  customerName?: string
  carrier?: string
  trackingNumber?: string
}

const Email = ({ orderNumber = 'AP-0000', customerName = 'there', carrier = 'Australia Post', trackingNumber = 'XXXXXXXX' }: Props) => (
  <Html lang="en">
    <Head />
    <Preview>Order {orderNumber} has shipped</Preview>
    <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Georgia, serif', margin: 0 }}>
      <Container style={{ maxWidth: 560, padding: '32px 28px' }}>
        <Heading style={{ fontSize: 22, color: '#1a1a1a', margin: 0 }}>Abdulrahman Perfumes</Heading>
        <Hr style={{ borderColor: '#c9a14a', borderWidth: 1, margin: '12px 0 24px' }} />
        <Heading as="h2" style={{ fontSize: 18 }}>Your order is on its way, {customerName}.</Heading>
        <Text style={{ color: '#444', fontSize: 14, lineHeight: '22px' }}>
          Order <strong>{orderNumber}</strong> has been shipped via <strong>{carrier}</strong>.
        </Text>
        <Section style={{ backgroundColor: '#faf6ef', padding: 16, borderRadius: 8, margin: '20px 0' }}>
          <Text style={{ margin: 0, fontSize: 12, color: '#666', textTransform: 'uppercase', letterSpacing: 1 }}>Tracking number</Text>
          <Text style={{ margin: '6px 0 0', fontSize: 18, fontWeight: 600, fontFamily: 'monospace' }}>{trackingNumber}</Text>
        </Section>
        <Text style={{ color: '#666', fontSize: 12 }}>Track delivery progress directly with {carrier} using the number above.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `Order ${d.orderNumber ?? ''} shipped`,
  displayName: 'Order shipped',
  previewData: { orderNumber: 'AP-20260101-ABC123', customerName: 'Sara', carrier: 'Australia Post', trackingNumber: 'AP12345678AU' },
} satisfies TemplateEntry
