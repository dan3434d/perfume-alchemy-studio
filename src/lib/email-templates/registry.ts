import type { ComponentType } from 'react'
import { template as orderConfirmation } from './order-confirmation'
import { template as orderShipped } from './order-shipped'
import { template as orderStatus } from './order-status'
import { template as complaintReceived } from './complaint-received'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  to?: string
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'order-confirmation': orderConfirmation,
  'order-shipped': orderShipped,
  'order-status': orderStatus,
  'complaint-received': complaintReceived,
}
