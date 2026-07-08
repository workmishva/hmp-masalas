import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const MONGODB_URI = process.env.MONGODB_URI || ''

if (!MONGODB_URI) {
  console.error('Set MONGODB_URI in .env.local before running seed')
  process.exit(1)
}

async function seed() {

  
  await mongoose.connect(MONGODB_URI)
  console.log('Connected to MongoDB')

  const { default: User }     = await import('../models/User')
  const { default: Product }  = await import('../models/Product')
  const { default: Settings } = await import('../models/Settings')

  // Admin user — upsert so re-running always keeps credentials in sync.
  // Strategy:
  //   1. If target email already exists → promote it to admin + set new password.
  //   2. Else find any existing admin → rename email + set new password.
  //   3. Neither found → create fresh admin.
  // Any other admin with a different email is demoted to enduser.
  const TARGET_EMAIL = 'mishvapanchani17@gmail.com'
  const hash         = await bcrypt.hash('DMVJ@hmp1730', 12)

  const byEmail = await User.findOne({ email: TARGET_EMAIL })
  if (byEmail) {
    // Target email already exists — just promote + re-hash password
    await User.updateOne(
      { _id: byEmail._id },
      { $set: { role: 'admin', password: hash } }
    )
    console.log('Admin promoted/updated → mishvapanchani17@gmail.com')
    // Demote any other admin accounts
    await User.updateMany(
      { role: 'admin', _id: { $ne: byEmail._id } },
      { $set: { role: 'enduser' } }
    )
  } else {
    const existingAdmin = await User.findOne({ role: 'admin' })
    if (existingAdmin) {
      await User.updateOne(
        { _id: existingAdmin._id },
        { $set: { email: TARGET_EMAIL, password: hash } }
      )
      console.log('Admin email + password updated → mishvapanchani17@gmail.com')
    } else {
      await User.create({
        name:     'HMP Admin',
        email:    TARGET_EMAIL,
        phone:    '7984904156',
        password: hash,
        role:     'admin',
      })
      console.log('Admin created → mishvapanchani17@gmail.com')
    }
  }

  // Settings singleton
  const settings = await Settings.findOne()
  if (!settings) {
    await Settings.create({
      paymentEnabled:              false,
      whatsappVerificationEnabled: true,
      whatsappNumber:              '91XXXXXXXXXX',
      storeName:                   'HMP Masala',
    })
    console.log('Settings initialized')
  }

  // Sample products
  const count = await Product.countDocuments()
  if (count === 0) {
    await Product.insertMany([
      {
        name:        'Garam Masala',
        description: 'A warm and aromatic blend of whole spices, freshly ground in small batches. Perfect for curries, rice dishes, and marinades.',
        stock:       50,
        category:    'Garam Masala',
        images:      [],
        isActive:    true,
        weights: [
          { weight: '250g', price: 149, deliveryCharge: 0, tax: 5, isDefault: true, isActive: true, description: 'Popular choice' }
        ]
      },
      {
        name:        'Chai Masala',
        description: 'A fragrant spice blend made for the perfect cup of masala chai. Notes of cardamom, ginger, cinnamon, and clove.',
        stock:       75,
        category:    'Chai Masala',
        images:      [],
        isActive:    true,
        weights: [
          { weight: '250g', price: 99, deliveryCharge: 0, tax: 5, isDefault: true, isActive: true, description: 'Popular choice' }
        ]
      },
      {
        name:        'Biryani Masala',
        description: 'Rich, bold, and layered spice mix crafted specifically for aromatic biryani. Family recipe passed down through generations.',
        stock:       30,
        category:    'Biryani Masala',
        images:      [],
        isActive:    true,
        weights: [
          { weight: '250g', price: 179, deliveryCharge: 0, tax: 5, isDefault: true, isActive: true, description: 'Popular choice' }
        ]
      },
      {
        name:        'Pav Bhaji Masala',
        description: 'Tangy and bold spice blend that brings the authentic street food flavor of Mumbai to your kitchen.',
        stock:       60,
        category:    'Pav Bhaji Masala',
        images:      [],
        isActive:    true,
        weights: [
          { weight: '250g', price: 89, deliveryCharge: 0, tax: 5, isDefault: true, isActive: true, description: 'Popular choice' }
        ]
      },
    ])
    console.log('Sample products created')
  }

  await mongoose.disconnect()
  console.log('Seed complete')
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
