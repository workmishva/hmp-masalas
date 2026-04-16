import { Request, Response } from 'express';
import { z } from 'zod';
import User from '../models/User';
import Order from '../models/Order';

const createUserSchema = z.object({
  displayName: z.string().max(100).optional().or(z.literal('')),
  email: z.string().trim().email().optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  photoURL: z.string().url().optional().or(z.literal('')),
});

const updateUserSchema = z.object({
  displayName: z.string().max(100).optional().or(z.literal('')),
  email: z.string().trim().email().optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  photoURL: z.string().url().optional().or(z.literal('')),
  onboardingCompleted: z.boolean().optional(),
  address: z.object({
    house: z.string().max(255).optional(),
    street: z.string().max(255).optional(),
    nearby: z.string().max(255).optional(),
    cityVillage: z.string().max(100).optional(),
    district: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
    postalCode: z.string().max(20).optional(),
  }).optional(),
});

// POST /api/users/me - Create or update profile on first sign-in
export const upsertUser = async (req: Request, res: Response) => {
  try {
    const firebaseUser = (req as any).user;
    const body = createUserSchema.parse(req.body);
    const normalizedEmail = (body.email || firebaseUser.email || '').trim().toLowerCase();

    const existing = await User.findOne({ firebaseUid: firebaseUser.uid });

    if (existing) {
      return res.status(200).json({ user: existing });
    }

    if (normalizedEmail) {
      const emailOwner = await User.findOne({
        email: normalizedEmail,
        firebaseUid: { $ne: firebaseUser.uid },
      }).lean();

      if (emailOwner) {
        return res.status(409).json({ error: 'This email is already linked to another account.' });
      }
    }

    const newUser = await User.create({
      firebaseUid: firebaseUser.uid,
      email: normalizedEmail,
      displayName: body.displayName || firebaseUser.name || 'User',
      photoURL: body.photoURL || '',
      phone: body.phone || firebaseUser.phone_number || '',
      role: 'customer',
      onboardingCompleted: false,
    });

    res.status(201).json({ user: newUser });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    console.error('Error upserting user:', error);
    res.status(500).json({ error: 'Failed to save user profile' });
  }
};

// GET /api/users/me - Get current user profile + orders summary
export const getMyProfile = async (req: Request, res: Response) => {
  try {
    const firebaseUser = (req as any).user;

    const user = await User.findOne({ firebaseUid: firebaseUser.uid }).lean();
    if (!user) {
      return res.status(404).json({ error: 'Profile not found. Please complete signup.' });
    }

    // Also fetch order history for this user
    const orders = await Order.find({ userId: firebaseUser.uid })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ user, orders });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// PATCH /api/users/me - Update profile fields
export const updateMyProfile = async (req: Request, res: Response) => {
  try {
    const firebaseUser = (req as any).user;
    const updates = updateUserSchema.parse(req.body);
    const sanitizedUpdates: Record<string, unknown> = { ...updates };

    if (sanitizedUpdates.displayName === '') {
      delete sanitizedUpdates.displayName;
    }

    if (sanitizedUpdates.email === '') {
      delete sanitizedUpdates.email;
    } else if (typeof sanitizedUpdates.email === 'string') {
      sanitizedUpdates.email = sanitizedUpdates.email.trim().toLowerCase();
    }

    if (sanitizedUpdates.email) {
      const emailOwner = await User.findOne({
        email: sanitizedUpdates.email,
        firebaseUid: { $ne: firebaseUser.uid },
      }).lean();

      if (emailOwner) {
        return res.status(409).json({ error: 'This email is already linked to another account.' });
      }
    }

    // 1) Update existing profile when present.
    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid: firebaseUser.uid },
      { $set: sanitizedUpdates },
      { returnDocument: 'after', runValidators: true }
    ).lean();

    if (updatedUser) {
      return res.status(200).json({ user: updatedUser });
    }

    // 2) Create profile if it does not exist yet.
    const fallbackDisplayName =
      firebaseUser.name ||
      firebaseUser.email?.split('@')[0] ||
      'User';

    const createdUser = await User.create({
      firebaseUid: firebaseUser.uid,
      email: (sanitizedUpdates.email as string) || firebaseUser.email || '',
      role: 'customer',
      displayName: (sanitizedUpdates.displayName as string) || fallbackDisplayName,
      phone: (sanitizedUpdates.phone as string) ?? firebaseUser.phone_number ?? '',
      photoURL: (sanitizedUpdates.photoURL as string) ?? '',
      address: (sanitizedUpdates.address as Record<string, unknown>) ?? {},
      onboardingCompleted: (sanitizedUpdates.onboardingCompleted as boolean) ?? false,
    });

    res.status(200).json({ user: createdUser });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};
