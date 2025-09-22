import User from "../db/User.js";

export async function findUserByEmail(email) {
  return User.findOne({ where: { email } });
}

export async function createUser({ email, passwordHash, avatarURL }) {
  return User.create({ email, password: passwordHash, avatarURL });
}

export async function saveUserToken(userId, token) {
  await User.update({ token }, { where: { id: userId } });
}

export async function clearUserToken(userId, avatarURL) {
  await User.update({ token: null }, { where: { id: userId } });
  return { avatarURL };
}

export async function updateUserAvatar(userId, avatarURL) {
  await User.update({ avatarURL }, { where: { id: userId } });
  return { avatarURL };
}
