import * as React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

export const STORE_URL = 'https://www.abdulrahmanperfumes.com.au'
export const HOUSE_IMAGE_URL = `${STORE_URL}/email/house-bottle-in-hand.jpg`

export const colors = {
  ink: '#282521',
  muted: '#6f6a63',
  brass: '#96723f',
  sand: '#f3eee6',
  border: '#ded6ca',
  white: '#ffffff',
}

export function EmailLayout({
  preview,
  eyebrow,
  title,
  children,
  showImage = true,
}: {
  preview: string
  eyebrow?: string
  title: string
  children: React.ReactNode
  showImage?: boolean
}) {
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={masthead}>
            <Link href={STORE_URL} style={brandLink}>
              <Text style={brand}>ABDULRAHMAN</Text>
              <Text style={brandSub}>PERFUMES</Text>
            </Link>
          </Section>
          {showImage ? (
            <Link href={STORE_URL}>
              <Img
                src={HOUSE_IMAGE_URL}
                width="600"
                height="260"
                alt="Abdulrahman Perfumes house collection"
                style={heroImage}
              />
            </Link>
          ) : null}
          <Section style={content}>
            {eyebrow ? <Text style={eyebrowStyle}>{eyebrow}</Text> : null}
            <Heading style={heading}>{title}</Heading>
            {children}
          </Section>
          <Hr style={rule} />
          <Section style={footer}>
            <Text style={footerTitle}>Composed in the UAE. Sent from Sydney.</Text>
            <Text style={footerText}>
              Need help? Reply to this email or visit{' '}
              <Link href={`${STORE_URL}/contact`} style={textLink}>Customer care</Link>.
            </Text>
            <Text style={footerText}>© Abdulrahman Perfumes · Australia</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export function EmailButton({ href, children }: { href: string; children: React.ReactNode }) {
  return <Button href={href} style={button}>{children}</Button>
}

export const textStyle = {
  color: colors.ink,
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 18px',
}

export const mutedTextStyle = {
  color: colors.muted,
  fontSize: '13px',
  lineHeight: '21px',
  margin: '0 0 12px',
}

export const panelStyle = {
  backgroundColor: colors.sand,
  border: `1px solid ${colors.border}`,
  padding: '18px',
  margin: '24px 0',
}

export const itemStyle = {
  color: colors.ink,
  fontSize: '14px',
  lineHeight: '21px',
  margin: '7px 0',
}

export const textLink = { color: colors.ink, textDecoration: 'underline' }

const main = { backgroundColor: colors.white, fontFamily: 'Arial, Helvetica, sans-serif', margin: 0, padding: 0 }
const container = { backgroundColor: colors.white, maxWidth: '600px', margin: '0 auto', padding: '0 0 28px' }
const masthead = { padding: '30px 28px 24px', textAlign: 'center' as const }
const brandLink = { color: colors.ink, textDecoration: 'none' }
const brand = { color: colors.ink, fontFamily: 'Georgia, Times, serif', fontSize: '27px', lineHeight: '30px', margin: 0 }
const brandSub = { color: colors.brass, fontSize: '10px', lineHeight: '16px', margin: 0, letterSpacing: '3px' }
const heroImage = { display: 'block', width: '100%', height: '260px', objectFit: 'cover' as const }
const content = { padding: '32px 28px 18px' }
const eyebrowStyle = { color: colors.brass, fontSize: '11px', lineHeight: '16px', fontWeight: 700, letterSpacing: '2px', margin: '0 0 10px', textTransform: 'uppercase' as const }
const heading = { color: colors.ink, fontFamily: 'Georgia, Times, serif', fontSize: '29px', fontWeight: 400, lineHeight: '36px', margin: '0 0 20px' }
const button = { backgroundColor: colors.ink, color: colors.white, display: 'inline-block', fontSize: '13px', fontWeight: 700, letterSpacing: '1px', padding: '13px 22px', textDecoration: 'none', textTransform: 'uppercase' as const }
const rule = { borderColor: colors.border, margin: '4px 28px 22px' }
const footer = { padding: '0 28px', textAlign: 'center' as const }
const footerTitle = { color: colors.ink, fontFamily: 'Georgia, Times, serif', fontSize: '15px', margin: '0 0 8px' }
const footerText = { color: colors.muted, fontSize: '11px', lineHeight: '18px', margin: '4px 0' }