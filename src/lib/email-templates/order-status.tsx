import * as React from 'react'
import { Text } from '@react-email/components'
import type { TemplateEntry } from './registry'
import { EmailButton, EmailLayout, STORE_URL, mutedTextStyle, textStyle } from './brand'

interface Props {
  orderNumber?: string
  customerName?: string
  status?: string
}

const Email = ({ orderNumber = 'AP-0000', customerName = 'there', status = 'updated' }: Props) => (
  <EmailLayout preview={`An update for order ${orderNumber}`} eyebrow="Order update" title={`An update for you, ${customerName}.`} showImage={false}>
    <Text style={textStyle}>Order <strong>{orderNumber}</strong> has been <strong>{status}</strong>.</Text>
    <Text style={mutedTextStyle}>Your account always shows the latest confirmed order information.</Text>
    <EmailButton href={`${STORE_URL}/account`}>View your order</EmailButton>
  </EmailLayout>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `Order ${d.orderNumber ?? ''} ${d.status ?? 'updated'}`,
  displayName: 'Order status update',
  previewData: { orderNumber: 'AP-20260101-ABC123', customerName: 'Sara', status: 'processing' },
} satisfies TemplateEntry
