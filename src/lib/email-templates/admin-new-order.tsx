import * as React from 'react'
import { Hr, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'
import { EmailButton, EmailLayout, STORE_URL, colors, itemStyle, panelStyle, textStyle } from './brand'

interface Props {
  orderNumber?: string
  customerName?: string
  customerEmail?: string
  total?: string
  items?: { name: string; quantity: number; price: string }[]
}

const Email = ({ orderNumber = 'AP-0000', customerName = '', customerEmail = '', total = '$0.00', items = [] }: Props) => (
  <EmailLayout preview={`Paid order ${orderNumber} · ${total}`} eyebrow="Paid order" title="A new order is ready to prepare." showImage={false}>
    <Text style={textStyle}><strong>{orderNumber}</strong> was paid by {customerName} ({customerEmail}).</Text>
    <Section style={panelStyle}>
      {items.map((item, index) => <Text key={`${item.name}-${index}`} style={itemStyle}>{item.quantity} × {item.name} · {item.price}</Text>)}
      <Hr style={{ borderColor: colors.border, margin: '12px 0' }} />
      <Text style={{ ...itemStyle, fontSize: '16px', margin: 0 }}><strong>Paid total</strong> · {total}</Text>
    </Section>
    <EmailButton href={`${STORE_URL}/admin`}>Open orders</EmailButton>
  </EmailLayout>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `Paid order ${d.orderNumber ?? ''} · ${d.total ?? ''}`,
  displayName: 'Admin — new order',
  previewData: { orderNumber: 'AP-20260101-ABC123', customerName: 'Sara', customerEmail: 'sara@example.com', total: '$120.00', items: [{ name: 'Oud Royal 50ml', quantity: 1, price: '$120.00' }] },
} satisfies TemplateEntry
