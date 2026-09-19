import * as React from 'react'
import { Section, Text } from '@react-email/components'
import { EmailLayout, colors, panelStyle, textStyle } from './brand'
interface Props { token: string }
export const ReauthenticationEmail = ({ token }: Props) => (
  <EmailLayout preview="Your secure verification code" eyebrow="Account security" title="Confirm it’s you" showImage={false}>
    <Text style={textStyle}>Enter this one-time code to continue:</Text>
    <Section style={{ ...panelStyle, textAlign: 'center' }}><Text style={{ color: colors.ink, fontFamily: 'Courier, monospace', fontSize: '28px', fontWeight: 700, letterSpacing: '5px', margin: 0 }}>{token}</Text></Section>
    <Text style={{ ...textStyle, fontSize: '12px' }}>This code expires shortly. If you did not request it, no action is needed.</Text>
  </EmailLayout>
)
export default ReauthenticationEmail
