import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Location from '../models/Location.js';
import Message from '../models/Message.js';
import { isDbConnected } from '../db.js';

// Streak Tier Helper for Gamified Punctuality Competition
export const getStreakTier = (streak = 0) => {
  if (streak >= 30) {
    return {
      rank: 'Phoenix',
      title: 'Phoenix Champion',
      flames: 5,
      multiplier: 3.0,
      badgeColor: 'from-amber-400 via-rose-500 to-purple-600',
      textColor: 'text-amber-300',
      borderColor: 'border-amber-400/50',
      bgColor: 'bg-amber-500/10',
      nextTierStreak: null,
      daysToNext: 0
    };
  }
  if (streak >= 14) {
    return {
      rank: 'Inferno',
      title: 'Inferno Master',
      flames: 4,
      multiplier: 2.0,
      badgeColor: 'from-rose-600 via-orange-500 to-amber-400',
      textColor: 'text-rose-400',
      borderColor: 'border-rose-500/50',
      bgColor: 'bg-rose-500/10',
      nextTierStreak: 30,
      daysToNext: 30 - streak
    };
  }
  if (streak >= 7) {
    return {
      rank: 'Blaze',
      title: 'Blaze Veteran',
      flames: 3,
      multiplier: 1.5,
      badgeColor: 'from-orange-500 to-amber-500',
      textColor: 'text-orange-400',
      borderColor: 'border-orange-500/50',
      bgColor: 'bg-orange-500/10',
      nextTierStreak: 14,
      daysToNext: 14 - streak
    };
  }
  if (streak >= 3) {
    return {
      rank: 'Flame',
      title: 'Flame Rising',
      flames: 2,
      multiplier: 1.25,
      badgeColor: 'from-amber-500 to-yellow-500',
      textColor: 'text-amber-400',
      borderColor: 'border-amber-500/50',
      bgColor: 'bg-amber-500/10',
      nextTierStreak: 7,
      daysToNext: 7 - streak
    };
  }
  if (streak >= 1) {
    return {
      rank: 'Spark',
      title: 'Spark Starter',
      flames: 1,
      multiplier: 1.0,
      badgeColor: 'from-yellow-400 to-amber-500',
      textColor: 'text-yellow-400',
      borderColor: 'border-yellow-400/50',
      bgColor: 'bg-yellow-500/10',
      nextTierStreak: 3,
      daysToNext: 3 - streak
    };
  }
  return {
    rank: 'Unranked',
    title: 'Warm Up',
    flames: 0,
    multiplier: 1.0,
    badgeColor: 'from-slate-600 to-slate-700',
    textColor: 'text-slate-400',
    borderColor: 'border-slate-700',
    bgColor: 'bg-slate-800/30',
    nextTierStreak: 1,
    daysToNext: 1
  };
};

// Pre-seeded in-memory store for instant zero-config usage if MongoDB is not connected
const inMemoryUsers = [
  {
    _id: 'mem_admin_1',
    name: 'Admin User',
    email: 'admin@example.com',
    password: '$2a$10$eE2w6uA12pP7vA49xKjUeezQe2Xk3kL9y2y.5y9y9y9y9y9y9y9y9', // hashed 'admin123'
    rawPassword: 'admin123',
    role: 'admin',
    employeeId: 'EMP-001',
    department: 'Management',
    phone: '+1 555-0199',
    workStartTime: '09:00',
    status: 'Active',
    punctualityStreak: 15,
    bestStreak: 22,
    earlyBirdPoints: 2150,
    streakRank: 'Inferno',
    earlyBirdMultiplier: 2.0,
    totalEarlyCheckIns: 14,
    totalOnTimeCheckIns: 20,
    createdAt: new Date().toISOString()
  },
  {
    _id: 'mem_supervisor_1',
    name: 'Alex Supervisor',
    email: 'supervisor@example.com',
    password: '$2a$10$eE2w6uA12pP7vA49xKjUeezQe2Xk3kL9y2y.5y9y9y9y9y9y9y9y9',
    rawPassword: 'supervisor123',
    role: 'supervisor',
    employeeId: 'EMP-SUP-01',
    department: 'Operations',
    phone: '+1 555-0144',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    workStartTime: '09:00',
    status: 'Active',
    punctualityStreak: 6,
    bestStreak: 11,
    earlyBirdPoints: 920,
    streakRank: 'Flame',
    earlyBirdMultiplier: 1.25,
    totalEarlyCheckIns: 5,
    totalOnTimeCheckIns: 12,
    createdAt: new Date().toISOString()
  },
  {
    _id: 'mem_worker_1',
    name: 'John Worker',
    email: 'worker@example.com',
    password: '$2a$10$eE2w6uA12pP7vA49xKjUeezQe2Xk3kL9y2y.5y9y9y9y9y9y9y9y9', // hashed 'worker123'
    rawPassword: 'worker123',
    role: 'worker',
    employeeId: 'EMP-002',
    department: 'Engineering',
    phone: '+1 555-0188',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    workStartTime: '09:00',
    status: 'Active',
    punctualityStreak: 4,
    bestStreak: 9,
    earlyBirdPoints: 680,
    streakRank: 'Flame',
    earlyBirdMultiplier: 1.25,
    totalEarlyCheckIns: 4,
    totalOnTimeCheckIns: 10,
    createdAt: new Date().toISOString()
  },
  {
    _id: 'mem_worker_2',
    name: 'Sarah Chen',
    email: 'sarah@example.com',
    password: '$2a$10$eE2w6uA12pP7vA49xKjUeezQe2Xk3kL9y2y.5y9y9y9y9y9y9y9y9',
    rawPassword: 'worker123',
    role: 'worker',
    employeeId: 'EMP-003',
    department: 'Design',
    phone: '+1 555-0177',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    workStartTime: '09:00',
    status: 'Active',
    punctualityStreak: 9,
    bestStreak: 14,
    earlyBirdPoints: 1420,
    streakRank: 'Blaze',
    earlyBirdMultiplier: 1.5,
    totalEarlyCheckIns: 8,
    totalOnTimeCheckIns: 14,
    createdAt: new Date().toISOString()
  },
  {
    _id: 'mem_worker_3',
    name: 'Michael Scott',
    email: 'michael@example.com',
    password: '$2a$10$eE2w6uA12pP7vA49xKjUeezQe2Xk3kL9y2y.5y9y9y9y9y9y9y9y9',
    rawPassword: 'worker123',
    role: 'worker',
    employeeId: 'EMP-004',
    department: 'Sales',
    phone: '+1 555-0166',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    workStartTime: '09:00',
    status: 'Active',
    punctualityStreak: 2,
    bestStreak: 6,
    earlyBirdPoints: 340,
    streakRank: 'Spark',
    earlyBirdMultiplier: 1.0,
    totalEarlyCheckIns: 2,
    totalOnTimeCheckIns: 7,
    createdAt: new Date().toISOString()
  },
  {
    _id: 'mem_worker_4',
    name: 'Emily Davis',
    email: 'emily@example.com',
    password: '$2a$10$eE2w6uA12pP7vA49xKjUeezQe2Xk3kL9y2y.5y9y9y9y9y9y9y9y9',
    rawPassword: 'worker123',
    role: 'worker',
    employeeId: 'EMP-005',
    department: 'Operations',
    phone: '+1 555-0155',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    workStartTime: '09:00',
    status: 'Active',
    punctualityStreak: 1,
    bestStreak: 7,
    earlyBirdPoints: 210,
    streakRank: 'Spark',
    earlyBirdMultiplier: 1.0,
    totalEarlyCheckIns: 1,
    totalOnTimeCheckIns: 5,
    createdAt: new Date().toISOString()
  }
];

const inMemoryLocations = [
  {
    _id: 'mem_loc_1',
    name: 'HQ Tech Park',
    address: '100 Innovation Way, Silicon Valley',
    lat: 37.7749,
    lng: -122.4194,
    radius: 5000000, // Very generous radius (5000km) in fallback mode
    clockInTime: '09:00',
    gracePeriod: 30,
    clockOutTime: '17:00',
    status: 'Active',
    createdAt: new Date().toISOString()
  }
];

// Helper to generate past dates
const getPastDateStr = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

// Seed 14 days of realistic attendance history
const inMemoryAttendance = [];
const sampleWorkers = inMemoryUsers.filter(u => u.role === 'worker' || u.role === 'supervisor');

for (let i = 13; i >= 0; i--) {
  const dateStr = getPastDateStr(i);
  sampleWorkers.forEach((worker, wIdx) => {
    // Make most check-ins on-time, with occasional late arrival
    const isLate = (i + wIdx) % 5 === 0; // ~20% late rate
    const checkInTime = isLate 
      ? `09:${18 + (wIdx * 3 % 15)}`
      : `08:${45 + (wIdx * 4 % 14)}`;
    const checkOutTime = i === 0 ? '17:05' : `17:${10 + (wIdx * 5 % 20)}`;

    inMemoryAttendance.push({
      _id: `mem_att_seed_${i}_${wIdx}`,
      user: {
        _id: worker._id,
        name: worker.name,
        department: worker.department,
        employeeId: worker.employeeId
      },
      date: dateStr,
      checkInTime,
      checkOutTime: i === 0 && wIdx === 0 ? null : checkOutTime, // Keep first worker currently on shift today
      location: 'HQ Tech Park',
      distance: 12 + wIdx * 5,
      coordinates: { lat: 37.7749 + (wIdx * 0.0001), lng: -122.4194 + (wIdx * 0.0001) },
      outCoordinates: { lat: 37.7749, lng: -122.4194 },
      status: isLate ? 'late' : 'present',
      os: 'Windows',
      browser: 'Chrome',
      createdAt: new Date(Date.now() - i * 86400000).toISOString()
    });
  });
}

const inMemoryMessages = [];

export const dbStore = {
  // --- USER METHODS ---
  async findUserByEmail(email) {
    if (isDbConnected()) {
      return await User.findOne({ email: email.toLowerCase() });
    }
    return inMemoryUsers.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async findUserById(id) {
    if (isDbConnected() && /^[0-9a-fA-F]{24}$/.test(id)) {
      const dbUser = await User.findById(id).select('-password');
      if (dbUser) return dbUser;
    }
    const user = inMemoryUsers.find(u => u._id === id);
    if (!user) return null;
    const { password, ...withoutPassword } = user;
    return withoutPassword;
  },

  async savePushSubscription(id, subscription) {
    if (isDbConnected() && /^[0-9a-fA-F]{24}$/.test(id)) {
      await User.findByIdAndUpdate(
        id, 
        { $addToSet: { pushSubscriptions: subscription } }
      );
      return;
    }
    const user = inMemoryUsers.find(u => u._id === id);
    if (user) {
      if (!user.pushSubscriptions) user.pushSubscriptions = [];
      // Prevent duplicates by endpoint
      if (!user.pushSubscriptions.find(s => s.endpoint === subscription.endpoint)) {
        user.pushSubscriptions.push(subscription);
      }
    }
  },

  async getPushSubscriptions(id) {
    if (isDbConnected() && /^[0-9a-fA-F]{24}$/.test(id)) {
      const user = await User.findById(id).select('pushSubscriptions');
      return user?.pushSubscriptions || [];
    }
    const user = inMemoryUsers.find(u => u._id === id);
    return user?.pushSubscriptions || [];
  },

  async removePushSubscription(endpoint) {
    if (isDbConnected()) {
      await User.updateMany(
        { "pushSubscriptions.endpoint": endpoint },
        { $pull: { pushSubscriptions: { endpoint: endpoint } } }
      );
      return;
    }
    inMemoryUsers.forEach(u => {
      if (u.pushSubscriptions) {
        u.pushSubscriptions = u.pushSubscriptions.filter(s => s.endpoint !== endpoint);
      }
    });
  },

  async createUser({ name, email, password, role, employeeId, department, phone, workStartTime, workEndTime }) {
    if (isDbConnected()) {
      const userCount = await User.countDocuments();
      const assignedRole = role || (userCount === 0 ? 'admin' : 'trainee');
      return await User.create({
        name,
        email: email.toLowerCase(),
        password,
        role: assignedRole,
        employeeId: employeeId || `EMP-${Math.floor(100 + Math.random() * 900)}`,
        department: department || 'General',
        phone,
        workStartTime: workStartTime || '09:00',
        workEndTime: workEndTime || '17:00'
      });
    }

    const userCountMem = inMemoryUsers.length;
    const assignedRoleMem = role || (userCountMem === 0 ? 'admin' : 'trainee');
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      _id: `mem_user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      rawPassword: password,
      role: assignedRoleMem,
      employeeId: employeeId || `EMP-${Math.floor(100 + Math.random() * 900)}`,
      department: department || 'General',
      phone: phone || '',
      workStartTime: workStartTime || '09:00',
      workEndTime: workEndTime || '17:00',
      status: 'Active',
      createdAt: new Date().toISOString()
    };
    inMemoryUsers.push(newUser);
    return newUser;
  },

  async setResetPasswordOtp(email, otp, expiresAt, resetToken) {
    if (isDbConnected()) {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) return null;
      user.resetPasswordOtp = otp;
      user.resetPasswordExpires = expiresAt;
      user.resetPasswordToken = resetToken;
      await user.save();
      return user;
    }

    const user = inMemoryUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return null;
    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = expiresAt;
    user.resetPasswordToken = resetToken;
    return user;
  },

  async verifyResetPasswordOtp(email, otp) {
    let user = null;
    if (isDbConnected()) {
      user = await User.findOne({ 
        email: email.toLowerCase(),
        resetPasswordOtp: otp,
        resetPasswordExpires: { $gt: new Date() }
      });
    } else {
      user = inMemoryUsers.find(u => 
        u.email.toLowerCase() === email.toLowerCase() &&
        u.resetPasswordOtp === otp &&
        new Date(u.resetPasswordExpires) > new Date()
      );
    }
    return user;
  },

  async resetPasswordWithToken(email, resetToken, newPassword) {
    if (isDbConnected()) {
      const user = await User.findOne({
        email: email.toLowerCase(),
        resetPasswordToken: resetToken,
      });
      if (!user) return null;
      user.password = newPassword;
      user.resetPasswordOtp = undefined;
      user.resetPasswordExpires = undefined;
      user.resetPasswordToken = undefined;
      await user.save();
      return user;
    }

    const user = inMemoryUsers.find(u => 
      u.email.toLowerCase() === email.toLowerCase() &&
      u.resetPasswordToken === resetToken
    );
    if (!user) return null;
    user.password = await bcrypt.hash(newPassword, 10);
    user.rawPassword = newPassword;
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;
    user.resetPasswordToken = undefined;
    return user;
  },

  async comparePassword(user, enteredPassword) {
    if (isDbConnected() && typeof user.comparePassword === 'function') {
      return await user.comparePassword(enteredPassword);
    }
    if (user.rawPassword && user.rawPassword === enteredPassword) {
      return true;
    }
    if (user.password) {
      return await bcrypt.compare(enteredPassword, user.password);
    }
    return false;
  },

  async getUsers(roleFilter) {
    const query = (roleFilter && roleFilter !== 'all') ? { role: roleFilter } : {};
    if (isDbConnected()) {
      return await User.find(query).select('-password');
    }
    if (roleFilter && roleFilter !== 'all') {
      return inMemoryUsers.filter(u => u.role === roleFilter);
    }
    return inMemoryUsers;
  },

  async updateUser(id, updateData) {
    if (isDbConnected() && /^[0-9a-fA-F]{24}$/.test(id)) {
      const user = await User.findById(id);
      if (user) {
        Object.assign(user, updateData);
        if (updateData.password) {
          user.password = updateData.password;
        }
        return await user.save();
      }
    }

    const idx = inMemoryUsers.findIndex(u => u._id === id);
    if (idx === -1) return null;

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    inMemoryUsers[idx] = { ...inMemoryUsers[idx], ...updateData };
    return inMemoryUsers[idx];
  },

  async deleteUser(id) {
    if (isDbConnected() && /^[0-9a-fA-F]{24}$/.test(id)) {
      const deletedUser = await User.findByIdAndDelete(id);
      if (deletedUser) {
        try {
          await Attendance.deleteMany({ user: id });
        } catch (e) {
          console.warn('Failed to clean up attendance records for deleted user:', e.message);
        }
        return true;
      }
    }
    const idx = inMemoryUsers.findIndex(u => u._id === id);
    if (idx !== -1) {
      inMemoryUsers.splice(idx, 1);
      return true;
    }
    return false;
  },

  // --- LOCATION METHODS ---
  async getLocations(filter = {}) {
    if (isDbConnected()) {
      return await Location.find(filter);
    }
    return inMemoryLocations.filter(l => {
      if (filter.status && l.status !== filter.status) return false;
      return true;
    });
  },

  async createLocation(locationData) {
    if (isDbConnected()) {
      return await Location.create(locationData);
    }
    const newLoc = {
      _id: `mem_loc_${Date.now()}`,
      ...locationData,
      status: locationData.status || 'Active',
      createdAt: new Date().toISOString()
    };
    inMemoryLocations.push(newLoc);
    return newLoc;
  },

  async updateLocation(id, updateData) {
    if (isDbConnected() && /^[0-9a-fA-F]{24}$/.test(id)) {
      const loc = await Location.findByIdAndUpdate(id, updateData, { new: true });
      if (loc) return loc;
    }
    const idx = inMemoryLocations.findIndex(l => l._id === id);
    if (idx === -1) return null;
    inMemoryLocations[idx] = { ...inMemoryLocations[idx], ...updateData };
    return inMemoryLocations[idx];
  },

  async deleteLocation(id) {
    if (isDbConnected() && /^[0-9a-fA-F]{24}$/.test(id)) {
      const loc = await Location.findByIdAndDelete(id);
      if (loc) return true;
    }
    const idx = inMemoryLocations.findIndex(l => l._id === id);
    if (idx !== -1) {
      inMemoryLocations.splice(idx, 1);
      return true;
    }
    return false;
  },

  // --- ATTENDANCE METHODS ---
  async findAttendanceToday(userId, dateStr) {
    if (isDbConnected()) {
      return await Attendance.findOne({ user: userId, date: dateStr });
    }
    return inMemoryAttendance.find(a => (a.user?._id === userId || a.user === userId) && a.date === dateStr) || null;
  },

  async createAttendance(data) {
    if (isDbConnected()) {
      return await Attendance.create(data);
    }
    const userObj = inMemoryUsers.find(u => u._id === data.user) || { _id: data.user, name: 'Worker', department: 'General' };
    const newRecord = {
      _id: `mem_att_${Date.now()}`,
      ...data,
      user: {
        _id: userObj._id,
        name: userObj.name,
        department: userObj.department,
        employeeId: userObj.employeeId
      },
      createdAt: new Date().toISOString()
    };
    inMemoryAttendance.unshift(newRecord);
    return newRecord;
  },

  async getAttendanceList() {
    if (isDbConnected()) {
      return await Attendance.find().populate('user', 'name department employeeId').sort({ createdAt: -1 });
    }
    return [...inMemoryAttendance];
  },

  async getWorkerAttendance(userId) {
    if (isDbConnected()) {
      return await Attendance.find({ user: userId }).sort({ date: -1 });
    }
    return inMemoryAttendance.filter(a => a.user?._id === userId || a.user === userId);
  },

  async updateAttendance(id, updateData) {
    if (isDbConnected() && /^[0-9a-fA-F]{24}$/.test(id)) {
      const att = await Attendance.findById(id);
      if (att) {
        Object.assign(att, updateData);
        return await att.save();
      }
    }
    const idx = inMemoryAttendance.findIndex(a => a._id === id);
    if (idx === -1) return null;
    inMemoryAttendance[idx] = { ...inMemoryAttendance[idx], ...updateData };
    return inMemoryAttendance[idx];
  },

  async deleteAttendance(id) {
    if (isDbConnected() && /^[0-9a-fA-F]{24}$/.test(id)) {
      const att = await Attendance.findById(id);
      if (att) {
        await att.deleteOne();
        return true;
      }
    }
    const idx = inMemoryAttendance.findIndex(a => a._id === id);
    if (idx !== -1) {
      inMemoryAttendance.splice(idx, 1);
      return true;
    }
    return false;
  },

  async getAdminDashboardStats() {
    const today = new Date().toISOString().split('T')[0];

    // Helper to build 14-day trends from an array of attendance records
    const buildDailyTrends = (records) => {
      const trends = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        
        // Format label as "Aug 11"
        const dateObj = new Date(d);
        const dateLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        const dayRecords = records.filter(a => a.date === dateStr);
        const onTime = dayRecords.filter(a => a.status === 'present' || a.status === 'on-time').length;
        const late = dayRecords.filter(a => a.status === 'late').length;
        const total = dayRecords.length;
        const clockedOut = dayRecords.filter(a => a.checkOutTime).length;
        const onTimeRate = total > 0 ? Math.round((onTime / total) * 100) : 0;

        trends.push({
          fullDate: dateStr,
          date: dateLabel,
          onTime,
          late,
          total,
          clockedOut,
          onTimeRate
        });
      }
      return trends;
    };

    if (isDbConnected()) {
      const totalEmployees = await User.countDocuments({ role: { $ne: 'admin' } });
      const checkInsToday = await Attendance.countDocuments({ date: today });
      const lateToday = await Attendance.countDocuments({ date: today, status: 'late' });
      const onTimeToday = checkInsToday - lateToday;
      const presentPercentage = totalEmployees > 0 ? Math.round((checkInsToday / totalEmployees) * 100) : 0;

      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const recentAttendance = await Attendance.find({ date: { $gte: fourteenDaysAgo } });
      const dailyTrends = buildDailyTrends(recentAttendance);

      const topEmployees = await Attendance.aggregate([
        { $match: { status: 'present' } },
        { $group: { _id: "$user", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userDetails' } },
        { $unwind: '$userDetails' }
      ]);

      return {
        totalEmployees,
        checkInsToday,
        lateToday,
        onTimeToday,
        presentPercentage,
        dailyTrends,
        topEmployees
      };
    }

    // In-memory stats
    const totalEmployees = inMemoryUsers.filter(u => u.role !== 'admin').length;
    const checkInsToday = inMemoryAttendance.filter(a => a.date === today).length;
    const lateToday = inMemoryAttendance.filter(a => a.date === today && a.status === 'late').length;
    const onTimeToday = checkInsToday - lateToday;
    const presentPercentage = totalEmployees > 0 ? Math.round((checkInsToday / totalEmployees) * 100) : 0;

    const dailyTrends = buildDailyTrends(inMemoryAttendance);

    // Department breakdown
    const deptMap = {};
    inMemoryAttendance.forEach(a => {
      const dept = a.user?.department || 'General';
      if (!deptMap[dept]) deptMap[dept] = { department: dept, onTime: 0, late: 0, total: 0 };
      deptMap[dept].total += 1;
      if (a.status === 'late') deptMap[dept].late += 1;
      else deptMap[dept].onTime += 1;
    });

    return {
      totalEmployees,
      checkInsToday,
      lateToday,
      onTimeToday,
      presentPercentage,
      dailyTrends,
      departmentStats: Object.values(deptMap),
      topEmployees: inMemoryUsers.filter(u => u.role === 'worker').slice(0, 5).map(u => ({
        _id: u._id,
        count: inMemoryAttendance.filter(a => (a.user?._id === u._id || a.user === u._id) && a.status === 'present').length,
        userDetails: u
      }))
    };
  },

  // --- MESSAGE METHODS ---
  async getThreadPreviews(userId) {
    let allMsgs = [];
    if (isDbConnected()) {
      allMsgs = await Message.find({
        $or: [{ isBroadcast: true }, { sender: userId }, { receiver: userId }]
      }).sort({ createdAt: 1 }).lean();
    } else {
      allMsgs = inMemoryMessages.filter(m => 
        m.isBroadcast || m.sender === userId || m.receiver === userId
      ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }

    const previews = {};
    
    for (const m of allMsgs) {
      if (m.isBroadcast) {
        previews['broadcast'] = {
          text: m.text,
          time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unread: false
        };
        continue;
      }
      
      const isMine = m.sender === userId || (m.sender && m.sender.toString() === userId.toString());
      const partnerId = isMine ? (m.receiver ? m.receiver.toString() : null) : (m.sender ? m.sender.toString() : null);
      
      if (partnerId) {
        if (!previews[partnerId]) previews[partnerId] = { unread: false, count: 0 };
        previews[partnerId].text = m.text || 'Sent an attachment';
        previews[partnerId].time = new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        if (!isMine && m.read === false) {
          previews[partnerId].unread = true;
          previews[partnerId].count++;
        } else if (!isMine && m.read === true) {
          // If a later message is read, it might reset our basic check but generally the DB handles the exact status.
        }
      }
    }
    return previews;
  },

  async getMessages(userId, otherUserId) {
    if (isDbConnected()) {
      if (otherUserId === 'broadcast') {
        return await Message.find({ isBroadcast: true })
          .populate('sender', 'name avatar role')
          .sort({ createdAt: 1 });
      }

      const conditions = [{ isBroadcast: true }];
      const isValidUser = /^[0-9a-fA-F]{24}$/.test(userId);
      const isValidOther = /^[0-9a-fA-F]{24}$/.test(otherUserId);

      if (isValidUser && isValidOther) {
        conditions.push({ sender: userId, receiver: otherUserId });
        conditions.push({ sender: otherUserId, receiver: userId });
      } else if (!isValidOther) {
        // Fallback or in-memory mix
        conditions.push({ sender: userId, receiver: otherUserId });
        conditions.push({ sender: otherUserId, receiver: userId });
      }

      return await Message.find({
        $or: conditions
      }).populate('sender', 'name avatar role').sort({ createdAt: 1 });
    }

    if (otherUserId === 'broadcast') {
      return inMemoryMessages.filter(m => m.isBroadcast).map(m => {
        const sender = inMemoryUsers.find(u => u._id === m.sender) || {};
        return { ...m, sender: { _id: sender._id, name: sender.name, avatar: sender.avatar, role: sender.role } };
      }).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }

    return inMemoryMessages.filter(m => 
      m.isBroadcast || 
      (m.sender === userId && m.receiver === otherUserId) || 
      (m.sender === otherUserId && m.receiver === userId)
    ).map(m => {
      const sender = inMemoryUsers.find(u => u._id === m.sender) || {};
      return { ...m, sender: { _id: sender._id, name: sender.name, avatar: sender.avatar, role: sender.role } };
    }).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  },

  async createMessage(data) {
    if (isDbConnected()) {
      const msg = new Message(data);
      await msg.save();
      return await Message.findById(msg._id).populate('sender', 'name avatar role');
    }
    const newMessage = {
      ...data,
      read: false,
      _id: 'msg_' + Date.now(),
      createdAt: new Date().toISOString()
    };
    inMemoryMessages.push(newMessage);
    const sender = inMemoryUsers.find(u => u._id === newMessage.sender) || {};
    return { ...newMessage, sender: { _id: sender._id, name: sender.name, avatar: sender.avatar, role: sender.role } };
  },

  async markMessagesAsRead(userId, senderId) {
    if (isDbConnected()) {
      await Message.updateMany(
        { receiver: userId, sender: senderId, read: false },
        { $set: { read: true } }
      );
      return true;
    }
    inMemoryMessages.forEach(m => {
      if (m.receiver === userId && m.sender === senderId && !m.read) {
        m.read = true;
      }
    });
    return true;
  },

  // --- COMPETITIVE LEADERBOARD & PUNCTUALITY STREAKS ---
  async getLeaderboard(currentUserId) {
    let allUsers = [];
    if (isDbConnected()) {
      allUsers = await User.find({ role: { $ne: 'admin' } }).select('-password');
    } else {
      allUsers = inMemoryUsers.filter(u => u.role !== 'admin');
    }

    const allAtt = isDbConnected() 
      ? await Attendance.find() 
      : inMemoryAttendance;

    const enrichedUsers = allUsers.map(user => {
      const uId = String(user._id);
      const userAtt = allAtt.filter(a => {
        const aUid = String(a.user?._id || a.user);
        return aUid === uId;
      });

      const totalCheckIns = userAtt.length;
      const onTimeCount = userAtt.filter(a => a.status === 'present').length;
      const lateCount = userAtt.filter(a => a.status === 'late').length;
      const onTimeRate = totalCheckIns > 0 ? Math.round((onTimeCount / totalCheckIns) * 100) : 100;

      const streak = Number(user.punctualityStreak) || 0;
      const bestStreak = Number(user.bestStreak) || streak;
      const points = Number(user.earlyBirdPoints) || 0;
      const tier = getStreakTier(streak);

      return {
        _id: user._id,
        name: user.name,
        avatar: user.avatar,
        department: user.department || 'General',
        employeeId: user.employeeId || 'EMP',
        role: user.role,
        punctualityStreak: streak,
        bestStreak: Math.max(bestStreak, streak),
        earlyBirdPoints: points,
        totalEarlyCheckIns: Number(user.totalEarlyCheckIns) || 0,
        totalOnTimeCheckIns: Number(user.totalOnTimeCheckIns) || onTimeCount,
        onTimeRate,
        totalCheckIns,
        streakTier: tier,
        lastPunctualDate: user.lastPunctualDate
      };
    });

    // Rank primarily by punctualityStreak DESC, then earlyBirdPoints DESC, then onTimeRate DESC
    enrichedUsers.sort((a, b) => {
      if (b.punctualityStreak !== a.punctualityStreak) {
        return b.punctualityStreak - a.punctualityStreak;
      }
      if (b.earlyBirdPoints !== a.earlyBirdPoints) {
        return b.earlyBirdPoints - a.earlyBirdPoints;
      }
      return b.onTimeRate - a.onTimeRate;
    });

    // Assign rank positions
    const leaderboard = enrichedUsers.map((u, idx) => ({
      ...u,
      rank: idx + 1,
      isTop3: idx < 3
    }));

    const myIndex = leaderboard.findIndex(u => String(u._id) === String(currentUserId));
    const myStats = myIndex !== -1 ? {
      ...leaderboard[myIndex],
      aheadOfYou: myIndex > 0 ? leaderboard[myIndex - 1] : null,
      totalCompetitors: leaderboard.length,
      percentile: Math.round(((leaderboard.length - myIndex) / Math.max(1, leaderboard.length)) * 100)
    } : null;

    const todayStr = new Date().toISOString().split('T')[0];
    const todaysEarlyBirds = allAtt.filter(a => a.date === todayStr && a.status === 'present').length;
    const streaksOnFireCount = leaderboard.filter(u => u.punctualityStreak >= 3).length;

    return {
      leaderboard,
      myStats,
      streaksOnFireCount,
      todaysEarlyBirds
    };
  }
};
