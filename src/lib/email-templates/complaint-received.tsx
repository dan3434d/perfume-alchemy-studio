import * as React from 'react'
import { Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'
import { EmailLayout, panelStyle, textStyle } from './brand'

interface Props {
  orderNumber?: string
  customerName?: string
  subject?: string
}

const Email = ({ orderNumber = 'AP-0000', customerName = 'there', subject = 'your concern' }: Props) => (
  <EmailLayout preview={`We received your message about ${orderNumber}`} eyebrow="Customer care" title={`We’re here to help, ${customerName}.`} showImage={false}>
    <Text style={textStyle}>We have received your message regarding order <strong>{orderNumber}</strong>.</Text>
    <Section style={panelStyle}><Text style={{ ...textStyle, margin: 0 }}><strong>Subject</strong><br />{subject}</Text></Section>
    <Text style={textStyle}>Our customer care team will review it and respond within one business day. Reply to this email if you would like to add any details.</Text>
  </EmailLayout>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `We received your message about order ${d.orderNumber ?? ''}`,
  displayName: 'Complaint received',
  previewData: { orderNumber: 'AP-20260101-ABC123', customerName: 'Sara', subject: 'Damaged bottle' },
} satisfies TemplateEntry
