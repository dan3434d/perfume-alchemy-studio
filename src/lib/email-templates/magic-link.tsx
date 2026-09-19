import * as React from 'react'
import { Text } from '@react-email/components'
import { EmailButton, EmailLayout, textStyle } from './brand'
interface Props { siteName: string; confirmationUrl: string }
export const MagicLinkEmail = ({ confirmationUrl }: Props) => (
  <EmailLayout preview="Your secure sign-in link" eyebrow="Secure access" title="Sign in to your account" showImage={false}>
    <Text style={textStyle}>Use this private link to sign in to Abdulrahman Perfumes. It expires shortly and can only be used once.</Text>
    <EmailButton href={confirmationUrl}>Sign in securely</EmailButton>
    <Text style={{ ...textStyle, fontSize: '12px', marginTop: '24px' }}>If you did not request this link, you can safely ignore this email.</Text>
  </EmailLayout>
)
export default MagicLinkEmail
