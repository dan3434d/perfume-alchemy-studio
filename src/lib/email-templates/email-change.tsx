import * as React from 'react'
import { Link, Text } from '@react-email/components'
import { EmailButton, EmailLayout, textLink, textStyle } from './brand'
interface Props { siteName: string; oldEmail: string; email: string; newEmail: string; confirmationUrl: string }
export const EmailChangeEmail = ({ oldEmail, newEmail, confirmationUrl }: Props) => (
  <EmailLayout preview="Confirm your new email address" eyebrow="Account security" title="Confirm your email change" showImage={false}>
    <Text style={textStyle}>Confirm changing your account email from <Link href={`mailto:${oldEmail}`} style={textLink}>{oldEmail}</Link> to <Link href={`mailto:${newEmail}`} style={textLink}>{newEmail}</Link>.</Text>
    <EmailButton href={confirmationUrl}>Confirm change</EmailButton>
    <Text style={{ ...textStyle, fontSize: '12px', marginTop: '24px' }}>If you did not request this change, do not use the link and contact customer care.</Text>
  </EmailLayout>
)
export default EmailChangeEmail
