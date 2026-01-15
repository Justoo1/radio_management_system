/**
 * Trial Reminder Email
 * Sent when trial is ending soon
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

interface TrialReminderEmailProps {
  organizationName: string
  daysRemaining: number
  trialEndDate: string
  upgradeUrl: string
}

export function TrialReminderEmail({
  organizationName = 'Radio Station',
  daysRemaining = 2,
  trialEndDate = 'January 20, 2026',
  upgradeUrl = 'https://radio.edtmsys.com/upgrade',
}: TrialReminderEmailProps) {
  const previewText = `Your trial ends in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}`

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
            <Text style={heading}>Trial Ending Soon</Text>
          </Section>

          <Section style={content}>
            <Text style={paragraph}>
              Hi <strong>{organizationName}</strong>,
            </Text>

            <Text style={paragraph}>
              {daysRemaining === 1 ? (
                <>Your <strong>7-day trial</strong> expires <strong>tomorrow</strong> on <strong>{trialEndDate}</strong>.</>
              ) : (
                <>You have <strong>{daysRemaining} days</strong> remaining in your <strong>7-day trial</strong>. Your trial will end on <strong>{trialEndDate}</strong>.</>
              )}
            </Text>

            <Text style={paragraph}>
              To continue enjoying full access to all features, please subscribe to a plan that fits your needs.
            </Text>

            {/* Features highlight */}
            <Section style={featuresBox}>
              <Text style={featuresHeading}>What you'll keep with a subscription:</Text>
              <ul style={featuresList}>
                <li style={featureItem}>✓ Client & Program Management</li>
                <li style={featureItem}>✓ Live On-Air Dashboard</li>
                <li style={featureItem}>✓ SMS Campaigns & Marketing</li>
                <li style={featureItem}>✓ Financial Reports & Analytics</li>
                <li style={featureItem}>✓ Media Library & Streaming</li>
                <li style={featureItem}>✓ Airtime Booking System</li>
              </ul>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={upgradeUrl}>
                View Subscription Plans
              </Button>
            </Section>

            <Text style={paragraph}>
              Questions? Reply to this email or contact our support team.
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

export default TrialReminderEmail

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

const featuresBox = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '24px',
  marginTop: '24px',
  marginBottom: '24px',
}

const featuresHeading = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1f2937',
  marginBottom: '12px',
  marginTop: '0',
}

const featuresList = {
  margin: '0',
  padding: '0',
  listStyle: 'none',
}

const featureItem = {
  fontSize: '14px',
  lineHeight: '24px',
  color: '#4b5563',
  marginBottom: '8px',
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
