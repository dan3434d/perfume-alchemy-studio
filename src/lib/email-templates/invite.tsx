import * as React from 'react'
import { Link, Text } from '@react-email/components'
import { EmailButton, EmailLayout, textLink, textStyle } from './brand'
interface Props { siteName: string; siteUrl: string; confirmationUrl: string }
export const InviteEmail = ({ siteUrl, confirmationUrl }: Props) => (
  <EmailLayout preview="Your invitation to Abdulrahman Perfumes" eyebrow="Private invitation" title="You’re invited">
    <Text style={textStyle}>You have been invited to join <Link href={siteUrl} style={textLink}>Abdulrahman Perfumes</Link>. Accept below to create your account.</Text>
    <EmailButton href={confirmationUrl}>Accept invitation</EmailButton>
    <Text style={{ ...textStyle, fontSize: '12px', marginTop: '24px' }}>If you were not expecting this invitation, no action is needed.</Text>
  </EmailLayout>
)
export default InviteEmail
