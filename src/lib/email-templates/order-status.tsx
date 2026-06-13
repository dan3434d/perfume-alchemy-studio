import * as React from 'react'
import { Body, Container, Head, Heading, Hr, Html, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  orderNumber?: string
  customerName?: string
  status?: string
}

const Email = ({ orderNumber = 'AP-0000', customerName = 'there', status = 'processing' }: Props) => (
  <Html lang="en">
    <Head />
    <Preview>Order {orderNumber} update: {status}</Preview>
    <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Georgia, serif', margin: 0 }}>
      <Container style={{ maxWidth: 560, padding: '32px 28px' }}>
        <Heading style={{ fontSize: 22, color: '#1a1a1a', margin: 0 }}>Abdulrahman Perfumes</Heading>
        <Hr style={{ borderColor: '#c9a14a', borderWidth: 1, margin: '12px 0 24px' }} />
        <Heading as="h2" style={{ fontSize: 18 }}>Hi {customerName},</Heading>
        <Text style={{ color: '#444', fontSize: 14, lineHeight: '22px' }}>
          Your order <strong>{orderNumber}</strong> is now <strong style={{ textTransform: 'capitalize' }}>{status}</strong>.
        </Text>
        <Text style={{ color: '#666', fontSize: 12 }}>Sign in to your account to view full order details.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `Order ${d.orderNumber ?? ''} ${d.status ?? 'updated'}`,
  displayName: 'Order status update',
  previewData: { orderNumber: 'AP-20260101-ABC123', customerName: 'Sara', status: 'processing' },
} satisfies TemplateEntry
