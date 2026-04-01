/**
 * Modèle Utilisateur - Profil et authentification
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email requis'],
      unique: true,
      lowercase: true,
      trim: true
    },
    username: {
      type: String,
      required: [true, 'Nom d\'utilisateur requis'],
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20
    },
    password: {
      type: String,
      required: function () { return !this.googleId; },
      minlength: 6,
      select: false
    },
    googleId: { type: String, sparse: true },
    googlePhoto: String,
    emailVerified: {
      type: Boolean,
      default: false
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    // Profil
    firstName: {
      type: String,
      required: function () { return !this.googleId; },
      trim: true,
      default: ''
    },
    lastName: {
      type: String,
      required: function () { return !this.googleId; },
      trim: true,
      default: ''
    },
    birthDate: {
      type: Date,
      required: function () { return !this.googleId; }
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      default: 'other'
    },
    interestedIn: {
      type: [String],
      enum: ['male', 'female', 'other', 'all'],
      default: ['all']
    },
    bio: {
      type: String,
      maxlength: 500,
      default: ''
    },
    profilePicture: {
      type: String,
      default: ''
    },
    coverPicture: {
      type: String,
      default: ''
    },
    followers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    following: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    photos: [{
      url: String,
      publicId: String,
      isPrimary: { type: Boolean, default: false }
    }],
    interests: [{
      type: String,
      trim: true
    }],
    location: {
      city: String,
      coordinates: {
        type: [Number],
        index: '2dsphere'
      },
      maxDistance: { type: Number, default: 50 } // km
    },
    ageRange: {
      min: { type: Number, default: 18 },
      max: { type: Number, default: 99 }
    },
    lastSeen: { type: Date, default: Date.now },
    isOnline: { type: Boolean, default: false },
    // Admin
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    isBanned: {
      type: Boolean,
      default: false
    },
    bannedUntil: Date
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Age calculé dynamiquement
userSchema.virtual('age').get(function () {
  if (!this.birthDate) return null;
  const today = new Date();
  const birth = new Date(this.birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
});

// Hash password avant sauvegarde
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
