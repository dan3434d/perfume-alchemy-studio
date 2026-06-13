import * as React from 'react'
import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  orderNumber?: string
  customerName?: string
  subject?: string
}

const Email = ({ orderNumber = 'AP-0000', customerName = 'there', subject = 'your concern' }: Props) => (
  <Html lang="en">
    <Head />
    <Preview>We've received your complaint about order {orderNumber}</Preview>
    <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Georgia, serif', margin: 0 }}>
      <Container style={{ maxWidth: 560, padding: '32px 28px' }}>
        <Heading style={{ fontSize: 22, color: '#1a1a1a', margin: 0 }}>Abdulrahman Perfumes</Heading>
        <Hr style={{ borderColor: '#c9a14a', borderWidth: 1, margin: '12px 0 24px' }} />
        <Heading as="h2" style={{ fontSize: 18 }}>We hear you, {customerName}.</Heading>
        <Text style={{ color: '#444', fontSize: 14, lineHeight: '22px' }}>
          We've received your message regarding order <strong>{orderNumber}</strong> ("{subject}"). Our team will review and respond within one business day.
        </Text>
        <Section style={{ backgroundColor: '#faf6ef', padding: 16, borderRadius: 8, margin: '20px 0' }}>
          <Text style={{ margin: 0, fontSize: 13, color: '#333' }}>Need to add details? Reply to this email and we'll attach it to your case.</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `We received your message about order ${d.orderNumber ?? ''}`,
  displayName: 'Complaint received',
  previewData: { orderNumber: 'AP-20260101-ABC123', customerName: 'Sara', subject: 'Damaged bottle' },
} satisfies TemplateEntry
