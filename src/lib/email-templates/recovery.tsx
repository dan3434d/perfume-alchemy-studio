import * as React from 'react'
import { Text } from '@react-email/components'
import { EmailButton, EmailLayout, textStyle } from './brand'
interface Props { siteName: string; confirmationUrl: string }
export const RecoveryEmail = ({ confirmationUrl }: Props) => (
  <EmailLayout preview="Reset your Abdulrahman Perfumes password" eyebrow="Account security" title="Reset your password" showImage={false}>
    <Text style={textStyle}>We received a request to reset your password. Use the secure link below to choose a new one.</Text>
    <EmailButton href={confirmationUrl}>Reset password</EmailButton>
    <Text style={{ ...textStyle, fontSize: '12px', marginTop: '24px' }}>If you did not request this, your password remains unchanged.</Text>
  </EmailLayout>
)
export default RecoveryEmail
