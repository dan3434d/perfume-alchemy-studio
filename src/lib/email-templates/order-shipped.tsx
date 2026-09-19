import * as React from 'react'
import { Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'
import { EmailButton, EmailLayout, colors, mutedTextStyle, panelStyle, textStyle } from './brand'

interface Props {
  orderNumber?: string
  customerName?: string
  carrier?: string
  trackingNumber?: string
  trackingUrl?: string
}

const Email = ({ orderNumber = 'AP-0000', customerName = 'there', carrier = 'Australia Post', trackingNumber = 'XXXXXXXX', trackingUrl }: Props) => (
  <EmailLayout preview={`Tracking is ready for ${orderNumber}`} eyebrow="Dispatched" title={`Your fragrance is on its way, ${customerName}.`}>
    <Text style={textStyle}>Order <strong>{orderNumber}</strong> has left our Sydney dispatch with <strong>{carrier}</strong>.</Text>
    <Section style={panelStyle}>
      <Text style={{ color: colors.muted, fontSize: '11px', fontWeight: 700, letterSpacing: '2px', margin: 0, textTransform: 'uppercase' }}>Tracking number</Text>
      <Text style={{ color: colors.ink, fontFamily: 'Courier, monospace', fontSize: '20px', fontWeight: 700, margin: '8px 0 0' }}>{trackingNumber}</Text>
    </Section>
    {trackingUrl ? <EmailButton href={trackingUrl}>Track your parcel</EmailButton> : null}
    <Text style={{ ...mutedTextStyle, marginTop: '20px' }}>Tracking can take a few hours to update after the first carrier scan.</Text>
  </EmailLayout>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `On its way · Order ${d.orderNumber ?? ''}`,
  displayName: 'Order shipped',
  previewData: { orderNumber: 'AP-20260101-ABC123', customerName: 'Sara', carrier: 'Australia Post', trackingNumber: 'AP12345678AU', trackingUrl: 'https://auspost.com.au/mypost/track/#/details/AP12345678AU' },
} satisfies TemplateEntry
