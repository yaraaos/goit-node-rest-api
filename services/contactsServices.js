import Contact from '../db/Contact.js';

async function listContacts() {
  const contacts = await Contact.findAll({
    order: [['createdAt', 'DESC']],
  });
  return contacts;
}

async function getContactById(contactId) {
  const contact = await Contact.findByPk(contactId);
  return contact || null;
}

async function removeContact(contactId) {
  const contact = await Contact.findByPk(contactId);
  if (!contact) return null;
  await contact.destroy();
  return contact; 
}

async function addContact(name, email, phone) {
  const created = await Contact.create({ name, email, phone });
  return created;
}

async function updateContact(contactId, updateData) {
  const contact = await Contact.findByPk(contactId);
  if (!contact) return null;
  await contact.update(updateData);
  return contact;
}

export async function updateStatusContact(contactId, { favorite }) {
  const contact = await Contact.findByPk(contactId);
  if (!contact) return null;
  await contact.update({ favorite });
  return contact;
}

export { listContacts, getContactById, removeContact, addContact, updateContact };
