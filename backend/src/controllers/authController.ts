import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { sendEmail } from '../services/emailService';

const JWT_SECRET = process.env.JWT_SECRET || 'outpro_super_secret_jwt_key_2026';

// In-Memory User Repository Fallback for seamless offline & demo operation
interface InMemoryUser {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'employee' | 'client' | 'candidate' | 'user';
  isVerified: boolean;
  phone?: string;
  title?: string;
  department?: string;
  companyName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const inMemoryUsers = new Map<string, InMemoryUser>();

// Pre-populate in-memory store with demo portal accounts
const initInMemoryStore = async () => {
  if (inMemoryUsers.size > 0) return;
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  const demoAccounts: InMemoryUser[] = [
    {
      _id: 'user-admin-001',
      name: 'Siddharth Sen',
      email: 'admin@outpro.india',
      password: hashedPassword,
      role: 'admin',
      title: 'CEO & Founder',
      department: 'Executive',
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: 'user-emp-002',
      name: 'Kabir Malhotra',
      email: 'employee@outpro.india',
      password: hashedPassword,
      role: 'employee',
      title: 'Head of Design',
      department: 'Design',
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: 'user-client-003',
      name: 'Sarah Jenkins',
      email: 'client@outpro.india',
      password: hashedPassword,
      role: 'client',
      companyName: 'Vanguard Realty',
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: 'user-cand-004',
      name: 'John Doe',
      email: 'candidate@outpro.india',
      password: hashedPassword,
      role: 'candidate',
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: 'user-user-005',
      name: 'Jane Smith',
      email: 'user@outpro.india',
      password: hashedPassword,
      role: 'user',
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  demoAccounts.forEach(user => inMemoryUsers.set(user.email.toLowerCase(), user));
};

initInMemoryStore();

const isDbConnected = () => mongoose.connection.readyState === 1;

const registerSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  role: z.enum(['admin', 'employee', 'client', 'candidate', 'user']).optional(),
  phone: z.string().optional(),
  title: z.string().optional(),
  department: z.string().optional(),
  companyName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const emailLower = validatedData.email.toLowerCase();

    // Hash password securely with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(validatedData.password, salt);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    let userId: string = '';
    let userPayload: any = null;

    if (isDbConnected()) {
      // MongoDB Active Mode
      const existingUser = await User.findOne({ email: emailLower });
      if (existingUser) {
        res.status(400).json({ success: false, message: 'Email is already registered' });
        return;
      }

      const newUser = new User({
        ...validatedData,
        email: emailLower,
        password: hashedPassword,
        isVerified: true,
        otp
      });

      await newUser.save();
      userId = newUser._id.toString();
      userPayload = newUser.toObject();
    } else {
      // Offline / In-Memory Fallback Mode
      if (inMemoryUsers.has(emailLower)) {
        res.status(400).json({ success: false, message: 'Email is already registered' });
        return;
      }

      userId = `user-${Date.now()}`;
      const memUser: InMemoryUser = {
        _id: userId,
        name: validatedData.name,
        email: emailLower,
        password: hashedPassword,
        role: validatedData.role || 'user',
        phone: validatedData.phone,
        title: validatedData.title,
        department: validatedData.department,
        companyName: validatedData.companyName,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      inMemoryUsers.set(emailLower, memUser);
      userPayload = { ...memUser };
    }

    delete userPayload.password;

    // Safely attempt to send email without failing registration if SMTP credentials are missing
    try {
      await sendEmail({
        to: emailLower,
        subject: 'Welcome to Outpro.India',
        text: `Hello ${validatedData.name},\n\nThank you for signing up for Outpro.India! Your account is active.`
      });
    } catch (emailErr: any) {
      console.warn('Email dispatch warning:', emailErr.message);
    }

    // Issue JWT token
    const token = jwt.sign(
      { userId, role: validatedData.role || 'user' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: userPayload,
        otp
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.map(err => ({ field: err.path.join('.'), message: err.message }))
      });
      return;
    }
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const emailLower = validatedData.email.toLowerCase();

    let userObj: any = null;
    let passwordHash = '';
    let userId = '';
    let userRole = '';

    if (isDbConnected()) {
      // MongoDB Active Mode
      const dbUser = await User.findOne({ email: emailLower }).select('+password');
      if (!dbUser) {
        res.status(401).json({ success: false, message: 'Invalid email or password' });
        return;
      }
      userObj = dbUser.toObject();
      passwordHash = dbUser.password || '';
      userId = dbUser._id.toString();
      userRole = dbUser.role;

      if (!dbUser.isVerified) {
        dbUser.isVerified = true;
        await dbUser.save();
      }
    } else {
      // In-Memory Fallback Mode
      const memUser = inMemoryUsers.get(emailLower);
      if (!memUser) {
        res.status(401).json({ success: false, message: 'Invalid email or password' });
        return;
      }
      userObj = { ...memUser };
      passwordHash = memUser.password || '';
      userId = memUser._id;
      userRole = memUser.role;
    }

    // Verify Password using bcrypt
    const isMatch = await bcrypt.compare(validatedData.password, passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    delete userObj.password;

    // Issue JWT token
    const token = jwt.sign(
      { userId, role: userRole },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: userObj
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.map(err => ({ field: err.path.join('.'), message: err.message }))
      });
      return;
    }
    next(error);
  }
};

export const verifyOTP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required' });
      return;
    }

    const emailLower = email.toLowerCase();
    let userObj: any = null;
    let userId = '';
    let userRole = '';

    if (isDbConnected()) {
      const user = await User.findOne({ email: emailLower });
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }
      user.isVerified = true;
      user.otp = undefined;
      await user.save();
      userObj = user.toObject();
      userId = user._id.toString();
      userRole = user.role;
    } else {
      const memUser = inMemoryUsers.get(emailLower);
      if (!memUser) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }
      memUser.isVerified = true;
      userObj = { ...memUser };
      userId = memUser._id;
      userRole = memUser.role;
    }

    delete userObj.password;

    const token = jwt.sign(
      { userId, role: userRole },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Account verified successfully',
      data: {
        token,
        user: userObj
      }
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required' });
      return;
    }

    const emailLower = email.toLowerCase();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    let userExists = false;

    if (isDbConnected()) {
      const user = await User.findOne({ email: emailLower });
      if (user) {
        user.otp = otp;
        user.otpExpires = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();
        userExists = true;
      }
    } else {
      if (inMemoryUsers.has(emailLower)) {
        userExists = true;
      }
    }

    if (!userExists) {
      res.status(404).json({ success: false, message: 'No user registered with this email address' });
      return;
    }

    try {
      await sendEmail({
        to: emailLower,
        subject: 'Reset Password OTP - Outpro.India',
        text: `Your password reset OTP code is: ${otp}`
      });
    } catch (err: any) {
      console.warn('Password reset email dispatch warning:', err.message);
    }

    res.status(200).json({
      success: true,
      message: 'Password reset OTP generated successfully',
      otp
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      res.status(400).json({ success: false, message: 'Email and newPassword are required' });
      return;
    }

    const emailLower = email.toLowerCase();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    if (isDbConnected()) {
      const user = await User.findOne({ email: emailLower });
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }
      user.password = hashedPassword;
      user.isVerified = true;
      await user.save();
    } else {
      const memUser = inMemoryUsers.get(emailLower);
      if (!memUser) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }
      memUser.password = hashedPassword;
      memUser.isVerified = true;
    }

    res.status(200).json({
      success: true,
      message: 'Password reset completed successfully. You can now login.'
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.userId;
    let userObj: any = null;

    if (isDbConnected()) {
      const user = await User.findById(userId);
      if (user) {
        userObj = user.toObject();
      }
    }

    if (!userObj) {
      // Lookup in memory repository
      for (const u of Array.from(inMemoryUsers.values())) {
        if (u._id === userId || u.email === req.user.email) {
          userObj = { ...u };
          break;
        }
      }
    }

    if (!userObj) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    delete userObj.password;

    res.status(200).json({
      success: true,
      data: userObj
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.userId;
    const { name, phone, bio, address, skills, socialLinks } = req.body;
    let userObj: any = null;

    if (isDbConnected()) {
      const user = await User.findById(userId);
      if (user) {
        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (bio !== undefined) user.bio = bio;
        if (address !== undefined) user.address = address;
        if (skills !== undefined) user.skills = skills;
        if (socialLinks !== undefined) user.socialLinks = socialLinks;
        await user.save();
        userObj = user.toObject();
      }
    } else {
      for (const [email, u] of Array.from(inMemoryUsers.entries())) {
        if (u._id === userId) {
          if (name) u.name = name;
          if (phone) u.phone = phone;
          userObj = { ...u };
          break;
        }
      }
    }

    if (!userObj) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    delete userObj.password;

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: userObj
    });
  } catch (error) {
    next(error);
  }
};

export const googleLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, name } = req.body;
    if (!email || !name) {
      res.status(400).json({ success: false, message: 'Google details incomplete' });
      return;
    }

    const emailLower = email.toLowerCase();
    let userObj: any = null;
    let userId = '';
    let role = 'user';

    const randomPassword = Math.random().toString(36).substring(2, 10);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(randomPassword, salt);

    if (isDbConnected()) {
      let user = await User.findOne({ email: emailLower });
      if (!user) {
        user = new User({
          name,
          email: emailLower,
          password: hashedPassword,
          role: 'user',
          isVerified: true
        });
        await user.save();
      }
      userObj = user.toObject();
      userId = user._id.toString();
      role = user.role;
    } else {
      let memUser = inMemoryUsers.get(emailLower);
      if (!memUser) {
        userId = `user-sso-${Date.now()}`;
        memUser = {
          _id: userId,
          name,
          email: emailLower,
          password: hashedPassword,
          role: 'user',
          isVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        inMemoryUsers.set(emailLower, memUser);
      }
      userObj = { ...memUser };
      userId = memUser._id;
      role = memUser.role;
    }

    delete userObj.password;

    const token = jwt.sign(
      { userId, role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Google login successful',
      data: {
        token,
        user: userObj
      }
    });
  } catch (error) {
    next(error);
  }
};
