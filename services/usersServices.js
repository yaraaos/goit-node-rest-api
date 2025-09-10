import User from "../db/User.js";

export async function findUserByEmail(email) {
  return User.findOne({ where: { email } });
}

export async function createUser({ email, passwordHash }) {
  return User.create({ email, password: passwordHash });
}

export async function saveUserToken(userId, token) {
  await User.update({ token }, { where: { id: userId } });
}

export async function clearUserToken(userId) {
  await User.update({ token: null }, { where: { id: userId } });
}