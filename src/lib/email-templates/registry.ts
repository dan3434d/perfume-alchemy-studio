import type { ComponentType } from 'react'
import { template as orderConfirmation } from './order-confirmation'
import { template as orderShipped } from './order-shipped'
import { template as orderStatus } from './order-status'
import { template as complaintReceived } from './complaint-received'
import { template as adminNewOrder } from './admin-new-order'
import { template as purchaseOrderInvoice } from './purchase-order-invoice'
import { SignupEmail } from './signup'
import { InviteEmail } from './invite'
import { MagicLinkEmail } from './magic-link'
import { RecoveryEmail } from './recovery'
import { EmailChangeEmail } from './email-change'
import { ReauthenticationEmail } from './reauthentication'


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
  'admin-new-order': adminNewOrder,
  'purchase-order-invoice': purchaseOrderInvoice,
  signup: { component: SignupEmail, subject: 'Confirm your email', displayName: 'Confirm account', previewData: { siteName: 'Abdulrahman Perfumes', siteUrl: 'https://www.abdulrahmanperfumes.com.au', recipient: 'sara@example.com', confirmationUrl: 'https://www.abdulrahmanperfumes.com.au/auth/confirm' } },
  invite: { component: InviteEmail, subject: "You've been invited", displayName: 'Account invitation', previewData: { siteName: 'Abdulrahman Perfumes', siteUrl: 'https://www.abdulrahmanperfumes.com.au', confirmationUrl: 'https://www.abdulrahmanperfumes.com.au/auth/confirm' } },
  magiclink: { component: MagicLinkEmail, subject: 'Your secure sign-in link', displayName: 'Magic link', previewData: { siteName: 'Abdulrahman Perfumes', confirmationUrl: 'https://www.abdulrahmanperfumes.com.au/auth/confirm' } },
  recovery: { component: RecoveryEmail, subject: 'Reset your password', displayName: 'Password recovery', previewData: { siteName: 'Abdulrahman Perfumes', confirmationUrl: 'https://www.abdulrahmanperfumes.com.au/auth/confirm' } },
  email_change: { component: EmailChangeEmail, subject: 'Confirm your new email', displayName: 'Email change', previewData: { siteName: 'Abdulrahman Perfumes', oldEmail: 'old@example.com', email: 'new@example.com', newEmail: 'new@example.com', confirmationUrl: 'https://www.abdulrahmanperfumes.com.au/auth/confirm' } },
  reauthentication: { component: ReauthenticationEmail, subject: 'Your verification code', displayName: 'Verification code', previewData: { token: '428103' } },
}

