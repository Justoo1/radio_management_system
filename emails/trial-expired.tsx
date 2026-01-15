/**
 * Trial Expired Email
 * Sent when trial period has ended
 */

import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Button,
  Hr,
  Img,
} from '@react-email/components'

interface TrialExpiredEmailProps {
  organizationName: string
  upgradeUrl: string
}

export function TrialExpiredEmail({
  organizationName = 'Radio Station',
  upgradeUrl = 'https://radio.edtmsys.com/upgrade',
}: TrialExpiredEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img
              src="https://radio.edtmsys.com/logo.png"
              width="50"
              height="50"
              alt="Radio Management System"
              style={logo}
            />
            <Text style={heading}>Your Trial Has Ended</Text>
          </Section>

          <Section style={content}>
            <Text style={paragraph}>
              Hi <strong>{organizationName}</strong>,
            </Text>

            <Text style={paragraph}>
              Your <strong>7-day trial period</strong> has ended. Thank you for trying Radio Management System!
            </Text>

            <Text style={paragraph}>
              To regain full access to all features and continue managing your radio station seamlessly, please subscribe to one of our plans.
            </Text>

            {/* Plan highlights */}
            <Section style={plansBox}>
              <Text style={plansHeading}>Choose Your Plan:</Text>

              <div style={planCard}>
                <Text style={planName}>Starter - GH₵500/month</Text>
                <Text style={planDesc}>Perfect for small stations</Text>
              </div>

              <div style={planCard}>
                <Text style={planName}>Professional - GH₵1,200/month</Text>
                <Text style={planDesc}>Most popular, includes SMS & advanced features</Text>
              </div>

              <div style={planCard}>
                <Text style={planName}>Enterprise - Custom Pricing</Text>
                <Text style={planDesc}>Unlimited access, priority support</Text>
              </div>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={upgradeUrl}>
                Subscribe Now
              </Button>
            </Section>

            <Text style={warningText}>
              ⚠️ Your account is now locked. Subscribe to restore full access.
            </Text>

            <Text style={paragraph}>
              Need help choosing a plan? Our team is here to assist you.
            </Text>

            <Text style={paragraph}>
              Best regards,
              <br />
              Radio Management System Team
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              © 2026 Radio Management System. All rights reserved.
            </Text>
            <Text style={footerText}>
              <Link href="https://radio.edtmsys.com" style={link}>
                Visit our website
              </Link>
              {' · '}
              <Link href="https://radio.edtmsys.com/support" style={link}>
                Support
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default TrialExpiredEmail

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const header = {
  padding: '32px 40px',
  textAlign: 'center' as const,
}

const logo = {
  margin: '0 auto',
  marginBottom: '16px',
}

const heading = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#1f2937',
  marginTop: '8px',
  marginBottom: '0',
}

const content = {
  padding: '0 40px',
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#4b5563',
  marginBottom: '16px',
}

const plansBox = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '24px',
  marginTop: '24px',
  marginBottom: '24px',
}

const plansHeading = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1f2937',
  marginBottom: '16px',
  marginTop: '0',
}

const planCard = {
  borderLeft: '3px solid #8b5cf6',
  paddingLeft: '16px',
  marginBottom: '16px',
}

const planName = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1f2937',
  marginBottom: '4px',
  marginTop: '0',
}

const planDesc = {
  fontSize: '14px',
  color: '#6b7280',
  marginTop: '0',
  marginBottom: '0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  marginTop: '32px',
  marginBottom: '32px',
}

const button = {
  backgroundColor: '#8b5cf6',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
}

const warningText = {
  fontSize: '14px',
  lineHeight: '24px',
  color: '#dc2626',
  backgroundColor: '#fef2f2',
  padding: '12px 16px',
  borderRadius: '8px',
  borderLeft: '3px solid #dc2626',
  marginTop: '16px',
  marginBottom: '24px',
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
}

const footer = {
  padding: '0 40px',
}

const footerText = {
  fontSize: '14px',
  lineHeight: '24px',
  color: '#9ca3af',
  textAlign: 'center' as const,
  marginBottom: '8px',
}

const link = {
  color: '#8b5cf6',
  textDecoration: 'underline',
}
