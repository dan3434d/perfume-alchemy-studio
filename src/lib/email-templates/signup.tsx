import * as React from 'react'
import { Link, Text } from '@react-email/components'
import { EmailButton, EmailLayout, textLink, textStyle } from './brand'
interface Props { siteName: string; siteUrl: string; recipient: string; confirmationUrl: string }
export const SignupEmail = ({ siteUrl, recipient, confirmationUrl }: Props) => (
  <EmailLayout preview="Confirm your Abdulrahman Perfumes account" eyebrow="Welcome to the house" title="Confirm your email address">
    <Text style={textStyle}>Complete your account for <Link href={siteUrl} style={textLink}>Abdulrahman Perfumes</Link> by confirming <Link href={`mailto:${recipient}`} style={textLink}>{recipient}</Link>.</Text>
    <EmailButton href={confirmationUrl}>Confirm email</EmailButton>
    <Text style={{ ...textStyle, fontSize: '12px', marginTop: '24px' }}>If you did not create this account, no action is needed.</Text>
  </EmailLayout>
)
export default SignupEmail
