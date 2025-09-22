import User from "../db/User.js";

export async function findUserByEmail(email) {
  return User.findOne({ where: { email } });
}

export async function findUserByVerificationToken(verificationToken) {
  return User.findOne({ where: { verificationToken } });
}

export async function createUser({ email, passwordHash, avatarURL, verify = false, verificationToken }) {
  return User.create({ email, password: passwordHash, avatarURL, verify, verificationToken });
}

export async function saveUserToken(userId, token) {
  await User.update({ token }, { where: { id: userId } });
}

export async function clearUserToken(userId, avatarURL) {
  await User.update({ token: null }, { where: { id: userId } });
  return { avatarURL };
}

export async function markUserVerified(userId) {
  await User.update({ verify: true, verificationToken: null }, { where: { id: userId } });
}

export async function setVerificationToken(userId, verificationToken) {
  await User.update({ verificationToken }, { where: { id: userId } });
}

export async function updateUserAvatar(userId, avatarURL) {
  await User.update({ avatarURL }, { where: { id: userId } });
  return { avatarURL };
}
