import * as React from 'react'
import { Hr, Img, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'
import { EmailButton, EmailLayout, STORE_URL, colors, itemStyle, mutedTextStyle, panelStyle, textStyle } from './brand'

interface Props {
  orderNumber?: string
  customerName?: string
  total?: string
  items?: { name: string; quantity: number; price: string; imageUrl?: string | null }[]
  deliveryAddress?: string
}

const Email = ({ orderNumber = 'AP-0000', customerName = 'there', total = '$0.00', items = [], deliveryAddress }: Props) => (
  <EmailLayout preview={`Payment confirmed for ${orderNumber}`} eyebrow="Payment confirmed" title={`Thank you, ${customerName}.`}>
    <Text style={textStyle}>Your payment is confirmed and order <strong>{orderNumber}</strong> is now being prepared. We will send tracking as soon as it leaves our Sydney dispatch.</Text>
    <Section style={panelStyle}>
      {items.map((item, index) => (
        <Section key={`${item.name}-${index}`} style={{ borderBottom: index < items.length - 1 ? `1px solid ${colors.border}` : 'none', padding: '9px 0' }}>
          {item.imageUrl ? <Img src={item.imageUrl} width="54" height="54" alt="" style={{ float: 'left', objectFit: 'cover', marginRight: '14px' }} /> : null}
          <Text style={itemStyle}><strong>{item.quantity} × {item.name}</strong><br /><span style={{ color: colors.muted }}>{item.price}</span></Text>
        </Section>
      ))}
      <Hr style={{ borderColor: colors.border, margin: '12px 0' }} />
      <Text style={{ ...itemStyle, fontSize: '16px', margin: 0 }}><strong>Total paid</strong> · {total}</Text>
    </Section>
    {deliveryAddress ? <Text style={mutedTextStyle}><strong>Delivery address</strong><br />{deliveryAddress}</Text> : null}
    <EmailButton href={`${STORE_URL}/account`}>View your order</EmailButton>
  </EmailLayout>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `Payment confirmed · Order ${d.orderNumber ?? ''}`,
  displayName: 'Order confirmation',
  previewData: { orderNumber: 'AP-20260101-ABC123', customerName: 'Sara', total: '$120.00', deliveryAddress: '10 George Street, Sydney NSW 2000, Australia', items: [{ name: 'Oud Royal 50ml', quantity: 1, price: '$120.00' }] },
} satisfies TemplateEntry
