/**
 * Seed Subscription Plans
 * Creates the three subscription plan tiers in the database
 *
 * Run with: npx tsx scripts/seed-subscription-plans.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding subscription plans...')

  // Create or update Starter Plan
  const starterPlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'Starter' },
    update: {
      description: 'Perfect for small radio stations getting started',
      price: '500',
      currency: 'GHS',
      billingInterval: 'MONTHLY',
      maxUsers: 5,
      maxClients: 100,
      maxSMSPerMonth: 500,
      maxStorageGB: 5,
      maxPrograms: 50,
      features: JSON.stringify([
        'Client Management',
        'Program Scheduling',
        'Live On-Air Dashboard',
        'Invoices & Contracts',
        'Expense Tracking',
        'Basic Reports',
        'Up to 5 Users',
      ]),
      isPopular: false,
      isActive: true,
      sortOrder: 1,
    },
    create: {
      name: 'Starter',
      description: 'Perfect for small radio stations getting started',
      price: '500',
      currency: 'GHS',
      billingInterval: 'MONTHLY',
      maxUsers: 5,
      maxClients: 100,
      maxSMSPerMonth: 500,
      maxStorageGB: 5,
      maxPrograms: 50,
      features: JSON.stringify([
        'Client Management',
        'Program Scheduling',
        'Live On-Air Dashboard',
        'Invoices & Contracts',
        'Expense Tracking',
        'Basic Reports',
        'Up to 5 Users',
      ]),
      isPopular: false,
      isActive: true,
      sortOrder: 1,
    },
  })
  console.log('✅ Starter plan created/updated:', starterPlan.id)

  // Create or update Professional Plan
  const professionalPlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'Professional' },
    update: {
      description: 'For growing stations with advanced needs',
      price: '1200',
      currency: 'GHS',
      billingInterval: 'MONTHLY',
      maxUsers: 15,
      maxClients: 500,
      maxSMSPerMonth: 5000,
      maxStorageGB: 50,
      maxPrograms: 200,
      features: JSON.stringify([
        'Everything in Starter',
        'SMS Campaigns',
        'Advertisement Management',
        'Media Library',
        'WhatsApp Integration',
        'Expense Tracking',
        'Advanced Reports',
        'Up to 15 Users',
      ]),
      isPopular: true,
      isActive: true,
      sortOrder: 2,
    },
    create: {
      name: 'Professional',
      description: 'For growing stations with advanced needs',
      price: '1200',
      currency: 'GHS',
      billingInterval: 'MONTHLY',
      maxUsers: 15,
      maxClients: 500,
      maxSMSPerMonth: 5000,
      maxStorageGB: 50,
      maxPrograms: 200,
      features: JSON.stringify([
        'Everything in Starter',
        'SMS Campaigns',
        'Advertisement Management',
        'Media Library',
        'WhatsApp Integration',
        'Expense Tracking',
        'Advanced Reports',
        'Up to 15 Users',
      ]),
      isPopular: true,
      isActive: true,
      sortOrder: 2,
    },
  })
  console.log('✅ Professional plan created/updated:', professionalPlan.id)

  // Create or update Enterprise Plan
  const enterprisePlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'Enterprise' },
    update: {
      description: 'For large stations with custom requirements',
      price: '0', // Custom pricing - contact sales
      currency: 'GHS',
      billingInterval: 'MONTHLY',
      maxUsers: 999,
      maxClients: 9999,
      maxSMSPerMonth: 99999,
      maxStorageGB: 500,
      maxPrograms: 9999,
      features: JSON.stringify([
        'Everything in Professional',
        'Unlimited Users',
        'Advanced Analytics',
        'Priority Support',
        'Custom Integrations',
        'Dedicated Account Manager',
        'Custom Training',
        'SLA Guarantee',
      ]),
      isPopular: false,
      isActive: true,
      sortOrder: 3,
    },
    create: {
      name: 'Enterprise',
      description: 'For large stations with custom requirements',
      price: '0', // Custom pricing - contact sales
      currency: 'GHS',
      billingInterval: 'MONTHLY',
      maxUsers: 999,
      maxClients: 9999,
      maxSMSPerMonth: 99999,
      maxStorageGB: 500,
      maxPrograms: 9999,
      features: JSON.stringify([
        'Everything in Professional',
        'Unlimited Users',
        'Advanced Analytics',
        'Priority Support',
        'Custom Integrations',
        'Dedicated Account Manager',
        'Custom Training',
        'SLA Guarantee',
      ]),
      isPopular: false,
      isActive: true,
      sortOrder: 3,
    },
  })
  console.log('✅ Enterprise plan created/updated:', enterprisePlan.id)

  console.log('\n✨ All subscription plans have been seeded successfully!')
  console.log('\nPlans summary:')
  console.log(`  - Starter: GHS ${starterPlan.price}/month`)
  console.log(`  - Professional: GHS ${professionalPlan.price}/month (Most Popular)`)
  console.log(`  - Enterprise: Custom pricing`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding subscription plans:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
